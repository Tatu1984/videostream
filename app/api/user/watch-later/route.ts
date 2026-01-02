import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    })

    return NextResponse.json({ watchLater })
  } catch (error) {
    console.error("Error fetching watch later:", error)
    return NextResponse.json(
      { error: "Failed to fetch watch later" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get("videoId")

    if (videoId) {
      // Delete specific video from watch later
      await prisma.watchLater.deleteMany({
        where: {
          userId: session.user.id,
          videoId: videoId,
        },
      })
    } else {
      // Delete all watch later for user
      await prisma.watchLater.deleteMany({
        where: { userId: session.user.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing watch later:", error)
    return NextResponse.json(
      { error: "Failed to clear watch later" },
      { status: 500 }
    )
  }
}
