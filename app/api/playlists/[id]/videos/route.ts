import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// POST add video to playlist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to modify this playlist" },
        { status: 403 }
      )
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

    // Check if already in playlist
    const existing = await prisma.playlistVideo.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Video already in playlist" },
        { status: 400 }
      )
    }

    // Get the next position
    const lastVideo = await prisma.playlistVideo.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
    })

    const position = (lastVideo?.position || 0) + 1

    await prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId,
        position,
      },
    })

    // Update video count
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { videoCount: { increment: 1 } },
    })

    return NextResponse.json({ message: "Video added to playlist" })
  } catch (error) {
    console.error("Error adding video to playlist:", error)
    return NextResponse.json(
      { error: "Failed to add video to playlist" },
      { status: 500 }
    )
  }
}

// DELETE remove video from playlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to modify this playlist" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      )
    }

    await prisma.playlistVideo.deleteMany({
      where: {
        playlistId,
        videoId,
      },
    })

    // Update video count
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { videoCount: { decrement: 1 } },
    })

    return NextResponse.json({ message: "Video removed from playlist" })
  } catch (error) {
    console.error("Error removing video from playlist:", error)
    return NextResponse.json(
      { error: "Failed to remove video from playlist" },
      { status: 500 }
    )
  }
}

// PATCH reorder videos in playlist
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to modify this playlist" },
        { status: 403 }
      )
    }

    const { videoOrder } = await req.json() // Array of { videoId, position }

    if (!Array.isArray(videoOrder)) {
      return NextResponse.json(
        { error: "videoOrder must be an array" },
        { status: 400 }
      )
    }

    // Update positions in a transaction
    await prisma.$transaction(
      videoOrder.map(({ videoId, position }) =>
        prisma.playlistVideo.updateMany({
          where: {
            playlistId,
            videoId,
          },
          data: { position },
        })
      )
    )

    return NextResponse.json({ message: "Playlist order updated" })
  } catch (error) {
    console.error("Error reordering playlist:", error)
    return NextResponse.json(
      { error: "Failed to reorder playlist" },
      { status: 500 }
    )
  }
}
