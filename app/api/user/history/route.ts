import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const history = await prisma.watchHistory.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          include: {
            channel: {
              select: {
                name: true,
                handle: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
      },
      orderBy: { watchedAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching history:", error)
    return NextResponse.json(
      { error: "Failed to fetch history" },
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
    const historyId = searchParams.get("id")

    if (historyId) {
      // Delete specific history entry
      await prisma.watchHistory.deleteMany({
        where: {
          id: historyId,
          userId: session.user.id,
        },
      })
    } else {
      // Delete all history for user
      await prisma.watchHistory.deleteMany({
        where: { userId: session.user.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing history:", error)
    return NextResponse.json(
      { error: "Failed to clear history" },
      { status: 500 }
    )
  }
}
