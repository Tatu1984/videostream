import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get("sort") || "top" // top or newest
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const comments = await prisma.comment.findMany({
      where: {
        videoId: videoId,
        parentId: null, // Only top-level comments
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
        replies: {
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
          take: 3, // Only show first 3 replies
        },
      },
      orderBy: sortBy === "newest" ? { createdAt: "desc" } : { likeCount: "desc" },
      take: limit,
      skip: offset,
    })

    const total = await prisma.comment.count({
      where: {
        videoId: videoId,
        parentId: null,
      },
    })

    return NextResponse.json({ comments, total })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, parentId } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment cannot be empty" },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        videoId: videoId,
        userId: session.user.id,
        parentId,
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

    // Increment comment count on video
    await prisma.video.update({
      where: { id: videoId },
      data: { commentCount: { increment: 1 } },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
