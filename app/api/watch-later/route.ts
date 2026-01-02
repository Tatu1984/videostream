import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET watch later list
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get("videoId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Check if specific video is in watch later
    if (videoId) {
      const item = await prisma.watchLater.findUnique({
        where: {
          userId_videoId: {
            userId: session.user.id,
            videoId,
          },
        },
      })

      return NextResponse.json({ inWatchLater: !!item })
    }

    // Get full watch later list
    const watchLater = await prisma.watchLater.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                handle: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
      },
      orderBy: { addedAt: "desc" },
      take: limit,
      skip: offset,
    })

    const total = await prisma.watchLater.count({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      videos: watchLater.map((wl) => ({
        ...wl.video,
        addedAt: wl.addedAt,
      })),
      total,
    })
  } catch (error) {
    console.error("Error fetching watch later:", error)
    return NextResponse.json(
      { error: "Failed to fetch watch later" },
      { status: 500 }
    )
  }
}

// POST add to watch later
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId } = await req.json()

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      )
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check if already in watch later
    const existing = await prisma.watchLater.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: "Already in watch later", inWatchLater: true },
        { status: 200 }
      )
    }

    await prisma.watchLater.create({
      data: {
        userId: session.user.id,
        videoId,
      },
    })

    return NextResponse.json({
      message: "Added to watch later",
      inWatchLater: true,
    })
  } catch (error) {
    console.error("Error adding to watch later:", error)
    return NextResponse.json(
      { error: "Failed to add to watch later" },
      { status: 500 }
    )
  }
}

// DELETE remove from watch later
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      )
    }

    await prisma.watchLater.deleteMany({
      where: {
        userId: session.user.id,
        videoId,
      },
    })

    return NextResponse.json({
      message: "Removed from watch later",
      inWatchLater: false,
    })
  } catch (error) {
    console.error("Error removing from watch later:", error)
    return NextResponse.json(
      { error: "Failed to remove from watch later" },
      { status: 500 }
    )
  }
}
