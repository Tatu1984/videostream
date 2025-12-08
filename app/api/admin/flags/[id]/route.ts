import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const resolveFlagSchema = z.object({
  decision: z.enum([
    "dismiss",
    "warn",
    "age_restrict",
    "remove",
    "remove_with_strike",
  ]),
  notes: z.string().optional(),
  strikeType: z.enum([
    "COMMUNITY_GUIDELINES",
    "COPYRIGHT",
    "SPAM",
    "MISLEADING",
    "TERMS_OF_SERVICE",
  ]).optional(),
  strikeSeverity: z.enum(["WARNING", "STRIKE", "SUSPENSION", "TERMINATION"]).optional(),
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

    const flag = await prisma.flag.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            trustScore: true,
          },
        },
        video: {
          include: {
            channel: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        flaggedComment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            video: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    return NextResponse.json({ flag })
  } catch (error) {
    console.error("Error fetching flag:", error)
    return NextResponse.json(
      { error: "Failed to fetch flag" },
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
    const { decision, notes, strikeType, strikeSeverity } = resolveFlagSchema.parse(body)

    const flag = await prisma.flag.findUnique({
      where: { id },
      include: {
        video: {
          include: {
            channel: { include: { owner: true } },
          },
        },
        flaggedComment: {
          include: {
            user: true,
            video: true,
          },
        },
        reporter: true,
      },
    })

    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    if (flag.status === "RESOLVED" || flag.status === "DISMISSED") {
      return NextResponse.json(
        { error: "Flag has already been resolved" },
        { status: 400 }
      )
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)

    // Determine target user and content
    const targetUserId = flag.video?.channel.ownerId || flag.flaggedComment?.userId
    const targetChannelId = flag.video?.channelId || null
    const targetVideoId = flag.videoId || null

    let status: "RESOLVED" | "DISMISSED" = "RESOLVED"
    let actionTaken = ""

    switch (decision) {
      case "dismiss":
        status = "DISMISSED"
        actionTaken = "No violation found"
        // No trust score penalty for dismissed reports - reporter acted in good faith
        break

      case "warn":
        actionTaken = "Warning issued"
        if (targetUserId) {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              type: "SYSTEM",
              title: "Content Warning",
              message: "Your content has received a warning for violating community guidelines.",
              videoId: targetVideoId,
            },
          })
        }
        break

      case "age_restrict":
        actionTaken = "Content age-restricted"
        if (flag.video) {
          await prisma.video.update({
            where: { id: flag.video.id },
            data: { ageRestricted: true },
          })
          await prisma.notification.create({
            data: {
              userId: targetUserId!,
              type: "SYSTEM",
              title: "Video Age-Restricted",
              message: "Your video has been age-restricted due to its content.",
              videoId: flag.video.id,
            },
          })
        }
        break

      case "remove":
        actionTaken = "Content removed"
        if (flag.video) {
          await prisma.video.update({
            where: { id: flag.video.id },
            data: { visibility: "PRIVATE" },
          })
          await prisma.notification.create({
            data: {
              userId: targetUserId!,
              type: "SYSTEM",
              title: "Video Removed",
              message: "Your video has been removed for violating community guidelines.",
              videoId: flag.video.id,
            },
          })
        } else if (flag.flaggedComment) {
          await prisma.comment.delete({
            where: { id: flag.flaggedComment.id },
          })
          await prisma.notification.create({
            data: {
              userId: targetUserId!,
              type: "SYSTEM",
              title: "Comment Removed",
              message: "Your comment has been removed for violating community guidelines.",
            },
          })
        }
        break

      case "remove_with_strike":
        actionTaken = "Content removed with strike"
        // Remove content
        if (flag.video) {
          await prisma.video.update({
            where: { id: flag.video.id },
            data: { visibility: "PRIVATE" },
          })
        } else if (flag.flaggedComment) {
          await prisma.comment.delete({
            where: { id: flag.flaggedComment.id },
          })
        }

        // Create strike
        if (targetUserId) {
          await prisma.strike.create({
            data: {
              userId: targetUserId,
              channelId: targetChannelId,
              type: strikeType || "COMMUNITY_GUIDELINES",
              reason: notes || `Content removed due to ${flag.reason}`,
              severity: strikeSeverity || "STRIKE",
              videoId: targetVideoId,
              issuedBy: session.user.id,
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            },
          })

          // Check total strikes and take action if needed
          const activeStrikes = await prisma.strike.count({
            where: {
              userId: targetUserId,
              active: true,
              severity: "STRIKE",
            },
          })

          if (activeStrikes >= 3) {
            // Suspend the channel
            if (targetChannelId) {
              await prisma.channel.update({
                where: { id: targetChannelId },
                data: { status: "SUSPENDED" },
              })
            }
          }

          await prisma.notification.create({
            data: {
              userId: targetUserId,
              type: "SYSTEM",
              title: "Strike Issued",
              message: `You have received a strike for violating community guidelines. You now have ${activeStrikes + 1} active strike(s).`,
              videoId: targetVideoId,
            },
          })
        }
        break
    }

    // Improve reporter trust score for valid reports
    if (decision !== "dismiss" && flag.reporter) {
      await prisma.user.update({
        where: { id: flag.reporter.id },
        data: { trustScore: Math.min(100, flag.reporter.trustScore + 2) },
      })
    }

    // Update flag
    const updatedFlag = await prisma.flag.update({
      where: { id },
      data: {
        status,
        decision: actionTaken,
        notes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: status === "DISMISSED" ? "FLAG_DISMISSED" : "FLAG_RESOLVED",
      targetType: "Flag",
      targetId: id,
      oldValue: { status: flag.status },
      newValue: { status, decision: actionTaken },
      notes,
    })

    return NextResponse.json({
      flag: updatedFlag,
      message: `Flag ${decision} successful`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error resolving flag:", error)
    return NextResponse.json(
      { error: "Failed to resolve flag" },
      { status: 500 }
    )
  }
}
