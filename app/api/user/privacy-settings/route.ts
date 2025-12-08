import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const privacySettingsSchema = z.object({
  subscriptionsPrivate: z.boolean().optional(),
  likedVideosPrivate: z.boolean().optional(),
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

    // Get user's privacy settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionsPrivate: true,
        likedVideosPrivate: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching privacy settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = privacySettingsSchema.parse(body)

    // Update user's privacy settings
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        subscriptionsPrivate: true,
        likedVideosPrivate: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating privacy settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
