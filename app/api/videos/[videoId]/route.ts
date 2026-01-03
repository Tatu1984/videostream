import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
            verified: true,
            subscriberCount: true,
          },
        },
        assets: true,
        chapters: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Note: View count is handled by dedicated /api/videos/[videoId]/view endpoint

    return NextResponse.json(video)
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
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Verify user owns the video
    const existingVideo = await prisma.video.findFirst({
      where: {
        id: videoId,
        channel: {
          ownerId: session.user.id,
        },
      },
    })

    if (!existingVideo) {
      return NextResponse.json(
        { error: "Video not found or you don't have permission" },
        { status: 403 }
      )
    }

    const video = await prisma.video.update({
      where: { id: videoId },
      data: body,
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error("Error updating video:", error)
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the video
    const existingVideo = await prisma.video.findFirst({
      where: {
        id: videoId,
        channel: {
          ownerId: session.user.id,
        },
      },
    })

    if (!existingVideo) {
      return NextResponse.json(
        { error: "Video not found or you don't have permission" },
        { status: 403 }
      )
    }

    await prisma.video.delete({
      where: { id: videoId },
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
