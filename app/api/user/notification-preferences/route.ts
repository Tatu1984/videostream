import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const notificationPreferencesSchema = z.object({
  newVideosEmail: z.boolean().optional(),
  newVideosPush: z.boolean().optional(),
  newVideosInApp: z.boolean().optional(),
  commentsEmail: z.boolean().optional(),
  commentsPush: z.boolean().optional(),
  commentsInApp: z.boolean().optional(),
  mentionsEmail: z.boolean().optional(),
  mentionsPush: z.boolean().optional(),
  mentionsInApp: z.boolean().optional(),
  recommendationsEmail: z.boolean().optional(),
  recommendationsPush: z.boolean().optional(),
  recommendationsInApp: z.boolean().optional(),
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

    // Get user's notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
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
    const validatedData = notificationPreferencesSchema.parse(body)

    // Update or create notification preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating notification preferences:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
