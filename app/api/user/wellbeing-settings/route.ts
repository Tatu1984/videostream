import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const wellbeingSettingsSchema = z.object({
  breakReminder: z.boolean().optional(),
  breakInterval: z.number().int().min(10).max(300).nullable().optional(),
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

    // Get user's wellbeing settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        breakReminder: true,
        breakInterval: true,
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
    console.error("Error fetching wellbeing settings:", error)
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
    const validatedData = wellbeingSettingsSchema.parse(body)

    // Update user's wellbeing settings
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        breakReminder: true,
        breakInterval: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating wellbeing settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
