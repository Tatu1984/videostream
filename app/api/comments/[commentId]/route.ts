import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// POST like/unlike comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await req.json() // "like" or "unlike"

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Note: For a full implementation, you'd want a CommentLike model
    // For now, we just increment/decrement the count
    if (action === "like") {
      await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      })
    } else if (action === "unlike") {
      await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      })
    }

    return NextResponse.json({ message: "Success" })
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    )
  }
}

// PATCH update comment (edit, pin, heart)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
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

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const { content, pinned, hearted } = await req.json()

    const isCommentOwner = comment.userId === session.user.id
    const isChannelOwner = comment.video.channel.ownerId === session.user.id

    // Content edit - only comment owner can edit
    if (content !== undefined && !isCommentOwner) {
      return NextResponse.json(
        { error: "Only the comment owner can edit" },
        { status: 403 }
      )
    }

    // Pin/heart - only channel owner can do this
    if ((pinned !== undefined || hearted !== undefined) && !isChannelOwner) {
      return NextResponse.json(
        { error: "Only the channel owner can pin or heart comments" },
        { status: 403 }
      )
    }

    // If pinning, unpin any other pinned comment on this video
    if (pinned === true) {
      await prisma.comment.updateMany({
        where: {
          videoId: comment.videoId,
          pinned: true,
        },
        data: { pinned: false },
      })
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(content !== undefined && { content }),
        ...(pinned !== undefined && { pinned }),
        ...(hearted !== undefined && { hearted }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    )
  }
}

// GET replies for a comment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    })

    const total = await prisma.comment.count({
      where: { parentId: commentId },
    })

    return NextResponse.json({ replies, total })
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    )
  }
}
