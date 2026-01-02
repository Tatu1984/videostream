import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET copyright claims for user's videos
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    // Get user's channel IDs
    const channels = await prisma.channel.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    })

    const channelIds = channels.map((c) => c.id)

    // Get videos with claims
    const where: any = {
      video: {
        channelId: { in: channelIds },
      },
    }

    if (status) {
      where.status = status
    }

    const claims = await prisma.copyrightClaim.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
        rightsHolder: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ claims })
  } catch (error) {
    console.error("Error fetching claims:", error)
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    )
  }
}

// POST submit counter-notice
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { claimId, counterNotice } = await req.json()

    if (!claimId || !counterNotice) {
      return NextResponse.json(
        { error: "claimId and counterNotice are required" },
        { status: 400 }
      )
    }

    // Find the claim
    const claim = await prisma.copyrightClaim.findUnique({
      where: { id: claimId },
      include: {
        video: {
          include: {
            channel: {
              select: { ownerId: true },
            },
          },
        },
      },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Verify ownership
    if (claim.video.channel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to dispute this claim" },
        { status: 403 }
      )
    }

    // Can only dispute pending or upheld claims
    if (!["PENDING", "UPHELD"].includes(claim.status)) {
      return NextResponse.json(
        { error: "This claim cannot be disputed" },
        { status: 400 }
      )
    }

    // Update claim with counter-notice
    await prisma.copyrightClaim.update({
      where: { id: claimId },
      data: {
        counterNotice,
        counterNoticedAt: new Date(),
        status: "COUNTER_NOTICED",
      },
    })

    return NextResponse.json({
      message: "Counter-notice submitted successfully",
    })
  } catch (error) {
    console.error("Error submitting counter-notice:", error)
    return NextResponse.json(
      { error: "Failed to submit counter-notice" },
      { status: 500 }
    )
  }
}
