import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const blockUserSchema = z.object({
  blockedUserId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get blocked users
    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(blockedUsers)
  } catch (error) {
    console.error("Error fetching blocked users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = blockUserSchema.parse(body)

    // Check if user is trying to block themselves
    if (validatedData.blockedUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot block yourself" },
        { status: 400 }
      )
    }

    // Check if user to be blocked exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: validatedData.blockedUserId },
    })

    if (!userToBlock) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Block user
    const blockedUser = await prisma.blockedUser.create({
      data: {
        blockerId: session.user.id,
        blockedId: validatedData.blockedUserId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(blockedUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error blocking user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
