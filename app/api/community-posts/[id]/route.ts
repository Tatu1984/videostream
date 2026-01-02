import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// POST like/unlike a community post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await req.json() // "like" or "unlike"

    const post = await prisma.communityPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (action === "like") {
      await prisma.communityPost.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      })
    } else if (action === "unlike") {
      await prisma.communityPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      })
    }

    const updated = await prisma.communityPost.findUnique({
      where: { id },
      select: { likeCount: true },
    })

    return NextResponse.json({ likeCount: updated?.likeCount || 0 })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

// GET a single community post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await prisma.communityPost.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    )
  }
}
