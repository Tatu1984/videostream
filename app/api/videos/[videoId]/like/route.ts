import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

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

    const { type } = await req.json() // "LIKE" or "DISLIKE"

    // Check if user already liked/disliked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId,
        },
      },
    })

    if (existingLike) {
      if (existingLike.type === type) {
        // Remove like/dislike
        await prisma.like.delete({
          where: { id: existingLike.id },
        })

        // Update video counts
        await prisma.video.update({
          where: { id: videoId },
          data: {
            [type === "LIKE" ? "likeCount" : "dislikeCount"]: { decrement: 1 },
          },
        })

        return NextResponse.json({ message: "Removed" })
      } else {
        // Change like to dislike or vice versa
        await prisma.like.update({
          where: { id: existingLike.id },
          data: { type },
        })

        // Update video counts
        await prisma.video.update({
          where: { id: videoId },
          data: {
            likeCount: { [type === "LIKE" ? "increment" : "decrement"]: 1 },
            dislikeCount: { [type === "DISLIKE" ? "increment" : "decrement"]: 1 },
          },
        })

        return NextResponse.json({ message: "Updated" })
      }
    }

    // Create new like/dislike
    await prisma.like.create({
      data: {
        userId: session.user.id,
        videoId: videoId,
        type,
      },
    })

    // Update video counts
    await prisma.video.update({
      where: { id: videoId },
      data: {
        [type === "LIKE" ? "likeCount" : "dislikeCount"]: { increment: 1 },
      },
    })

    return NextResponse.json({ message: "Success" })
  } catch (error) {
    console.error("Error liking video:", error)
    return NextResponse.json(
      { error: "Failed to like video" },
      { status: 500 }
    )
  }
}
