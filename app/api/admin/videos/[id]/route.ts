import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const updateVideoSchema = z.object({
  action: z.enum([
    "remove",
    "restore",
    "age_restrict",
    "remove_age_restriction",
    "set_visibility",
    "disable_comments",
    "enable_comments",
  ]),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  applyStrike: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        flags: {
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        copyrightClaims: {
          include: {
            rightsHolder: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            flags: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, visibility, reason, notes, applyStrike } = updateVideoSchema.parse(body)

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          include: { owner: true },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)
    let updatedVideo
    let auditAction: any

    switch (action) {
      case "remove":
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { visibility: "PRIVATE" },
        })
        auditAction = "VIDEO_REMOVED"
        // Notify owner
        await prisma.notification.create({
          data: {
            userId: video.channel.ownerId,
            type: "SYSTEM",
            title: "Video Removed",
            message: reason || "Your video has been removed for policy violations.",
            videoId: id,
          },
        })
        // Apply strike if requested
        if (applyStrike) {
          await prisma.strike.create({
            data: {
              userId: video.channel.ownerId,
              channelId: video.channelId,
              type: "COMMUNITY_GUIDELINES",
              reason: reason || "Video removed for policy violations",
              severity: "STRIKE",
              videoId: id,
              issuedBy: session.user.id,
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            },
          })
        }
        break

      case "restore":
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { visibility: "PUBLIC" },
        })
        auditAction = "VIDEO_RESTORED"
        break

      case "age_restrict":
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { ageRestricted: true },
        })
        auditAction = "VIDEO_AGE_RESTRICTED"
        await prisma.notification.create({
          data: {
            userId: video.channel.ownerId,
            type: "SYSTEM",
            title: "Video Age-Restricted",
            message: reason || "Your video has been age-restricted.",
            videoId: id,
          },
        })
        break

      case "remove_age_restriction":
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { ageRestricted: false },
        })
        auditAction = "VIDEO_AGE_RESTRICTED"
        break

      case "set_visibility":
        if (!visibility) {
          return NextResponse.json(
            { error: "Visibility is required" },
            { status: 400 }
          )
        }
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { visibility },
        })
        auditAction = "VIDEO_VISIBILITY_CHANGED"
        break

      case "disable_comments":
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { commentsEnabled: false },
        })
        auditAction = "VIDEO_VISIBILITY_CHANGED"
        break

      case "enable_comments":
        updatedVideo = await prisma.video.update({
          where: { id },
          data: { commentsEnabled: true },
        })
        auditAction = "VIDEO_VISIBILITY_CHANGED"
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: auditAction,
      targetType: "Video",
      targetId: id,
      oldValue: {
        visibility: video.visibility,
        ageRestricted: video.ageRestricted,
        commentsEnabled: video.commentsEnabled,
      },
      newValue: {
        visibility: updatedVideo.visibility,
        ageRestricted: updatedVideo.ageRestricted,
        commentsEnabled: updatedVideo.commentsEnabled,
      },
      notes: notes || reason,
    })

    return NextResponse.json({ video: updatedVideo, message: `Video ${action} successful` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating video:", error)
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)

    // Permanently delete video
    await prisma.video.delete({
      where: { id },
    })

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: "VIDEO_REMOVED",
      targetType: "Video",
      targetId: id,
      oldValue: { title: video.title, visibility: video.visibility },
      newValue: null,
      notes: "Video permanently deleted",
    })

    return NextResponse.json({ message: "Video deleted successfully" })
  } catch (error) {
    console.error("Error deleting video:", error)
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    )
  }
}
