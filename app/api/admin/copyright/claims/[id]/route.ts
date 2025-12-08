import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const decideClaimSchema = z.object({
  decision: z.enum(["uphold", "reject", "partial"]),
  notes: z.string().optional(),
  action: z.enum(["block", "mute_audio", "monetize_for_claimant", "no_action"]).optional(),
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

    const claim = await prisma.copyrightClaim.findUnique({
      where: { id },
      include: {
        video: {
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
          },
        },
        rightsHolder: true,
      },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    return NextResponse.json({ claim })
  } catch (error) {
    console.error("Error fetching claim:", error)
    return NextResponse.json(
      { error: "Failed to fetch claim" },
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
    const { decision, notes, action, applyStrike } = decideClaimSchema.parse(body)

    const claim = await prisma.copyrightClaim.findUnique({
      where: { id },
      include: {
        video: {
          include: {
            channel: { include: { owner: true } },
          },
        },
        rightsHolder: true,
      },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    if (claim.status !== "PENDING" && claim.status !== "APPEALED" && claim.status !== "COUNTER_NOTICED") {
      return NextResponse.json(
        { error: "Claim has already been decided" },
        { status: 400 }
      )
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)

    let status: "UPHELD" | "REJECTED" = decision === "reject" ? "REJECTED" : "UPHELD"
    let decisionText = ""

    switch (decision) {
      case "uphold":
        decisionText = "Claim upheld - copyright violation confirmed"

        // Apply action to video
        if (action === "block" && claim.video) {
          await prisma.video.update({
            where: { id: claim.video.id },
            data: { visibility: "PRIVATE" },
          })
        }

        // Notify video owner
        if (claim.video) {
          await prisma.notification.create({
            data: {
              userId: claim.video.channel.ownerId,
              type: "SYSTEM",
              title: "Copyright Claim Upheld",
              message: `The copyright claim on your video "${claim.video.title}" has been upheld.`,
              videoId: claim.video.id,
            },
          })
        }

        // Apply copyright strike if requested
        if (applyStrike && claim.video) {
          await prisma.strike.create({
            data: {
              userId: claim.video.channel.ownerId,
              channelId: claim.video.channelId,
              type: "COPYRIGHT",
              reason: notes || "Copyright violation - claim upheld",
              severity: "STRIKE",
              videoId: claim.video.id,
              issuedBy: session.user.id,
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            },
          })

          // Check total copyright strikes
          const copyrightStrikes = await prisma.strike.count({
            where: {
              channelId: claim.video.channelId,
              type: "COPYRIGHT",
              active: true,
            },
          })

          if (copyrightStrikes >= 3) {
            await prisma.channel.update({
              where: { id: claim.video.channelId },
              data: { status: "TERMINATED" },
            })
          }
        }
        break

      case "reject":
        decisionText = "Claim rejected - no copyright violation found"

        // Notify video owner
        if (claim.video) {
          await prisma.notification.create({
            data: {
              userId: claim.video.channel.ownerId,
              type: "SYSTEM",
              title: "Copyright Claim Rejected",
              message: `The copyright claim on your video "${claim.video.title}" has been rejected. No action will be taken.`,
              videoId: claim.video.id,
            },
          })
        }

        // Restore video if it was blocked
        if (claim.video && claim.video.visibility === "PRIVATE") {
          await prisma.video.update({
            where: { id: claim.video.id },
            data: { visibility: "PUBLIC" },
          })
        }
        break

      case "partial":
        status = "UPHELD"
        decisionText = "Claim partially upheld"

        // Notify video owner
        if (claim.video) {
          await prisma.notification.create({
            data: {
              userId: claim.video.channel.ownerId,
              type: "SYSTEM",
              title: "Copyright Claim Partially Upheld",
              message: `The copyright claim on your video "${claim.video.title}" has been partially upheld.`,
              videoId: claim.video.id,
            },
          })
        }
        break
    }

    // Update claim
    const updatedClaim = await prisma.copyrightClaim.update({
      where: { id },
      data: {
        status,
        decision: decisionText,
        decidedBy: session.user.id,
        decidedAt: new Date(),
      },
    })

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: status === "UPHELD" ? "COPYRIGHT_CLAIM_UPHELD" : "COPYRIGHT_CLAIM_REJECTED",
      targetType: "CopyrightClaim",
      targetId: id,
      oldValue: { status: claim.status },
      newValue: { status, decision: decisionText },
      notes,
    })

    return NextResponse.json({
      claim: updatedClaim,
      message: `Claim ${decision} successful`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error deciding claim:", error)
    return NextResponse.json(
      { error: "Failed to decide claim" },
      { status: 500 }
    )
  }
}
