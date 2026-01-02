import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET community posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}
    if (channelId) {
      where.channelId = channelId
    }

    const posts = await prisma.communityPost.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    const total = await prisma.communityPost.count({ where })

    return NextResponse.json({ posts, total })
  } catch (error) {
    console.error("Error fetching community posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch community posts" },
      { status: 500 }
    )
  }
}

// POST create community post
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId, type, content, mediaUrls, pollOptions, pollEndDate } =
      await req.json()

    if (!channelId || !type || !content) {
      return NextResponse.json(
        { error: "channelId, type, and content are required" },
        { status: 400 }
      )
    }

    // Verify user owns the channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        ownerId: session.user.id,
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or you don't have permission" },
        { status: 403 }
      )
    }

    const post = await prisma.communityPost.create({
      data: {
        channelId,
        type,
        content,
        mediaUrls: mediaUrls || [],
        pollOptions: pollOptions || [],
        pollEndDate: pollEndDate ? new Date(pollEndDate) : null,
      },
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
    })

    // Notify subscribers
    const subscribers = await prisma.subscription.findMany({
      where: {
        channelId,
        notificationLevel: { in: ["ALL", "PERSONALIZED"] },
      },
      select: { userId: true },
    })

    if (subscribers.length > 0) {
      await prisma.notification.createMany({
        data: subscribers.map((sub) => ({
          userId: sub.userId,
          type: "CHANNEL_UPDATE" as const,
          title: "New Community Post",
          message: `${channel.name} posted an update`,
          channelId,
        })),
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating community post:", error)
    return NextResponse.json(
      { error: "Failed to create community post" },
      { status: 500 }
    )
  }
}

// DELETE community post
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("id")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Find the post and verify ownership
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        channel: {
          select: { ownerId: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.channel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this post" },
        { status: 403 }
      )
    }

    await prisma.communityPost.delete({
      where: { id: postId },
    })

    return NextResponse.json({ message: "Post deleted" })
  } catch (error) {
    console.error("Error deleting community post:", error)
    return NextResponse.json(
      { error: "Failed to delete community post" },
      { status: 500 }
    )
  }
}
