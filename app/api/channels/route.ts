import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createChannelSchema = z.object({
  name: z.string().min(3, "Channel name must be at least 3 characters").max(50, "Channel name must not exceed 50 characters"),
  handle: z.string().min(3, "Handle must be at least 3 characters").max(30, "Handle must not exceed 30 characters").regex(/^@[a-zA-Z0-9_-]+$/, "Handle must start with @ and contain only letters, numbers, hyphens, and underscores"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional().nullable(),
  category: z.string().optional().nullable(),
})

// GET: List user's channels
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const channels = await prisma.channel.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    )
  }
}

// POST: Create new channel
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createChannelSchema.parse(body)

    // Check if user already has a channel
    const existingChannel = await prisma.channel.findFirst({
      where: { ownerId: session.user.id },
    })

    if (existingChannel) {
      return NextResponse.json(
        { error: "You already have a channel. Each user can only have one channel." },
        { status: 400 }
      )
    }

    // Check if handle is already taken
    const handleExists = await prisma.channel.findUnique({
      where: { handle: validatedData.handle },
    })

    if (handleExists) {
      return NextResponse.json(
        { error: "This handle is already taken. Please choose another one." },
        { status: 400 }
      )
    }

    // Create the channel
    const channel = await prisma.channel.create({
      data: {
        name: validatedData.name,
        handle: validatedData.handle,
        description: validatedData.description,
        ownerId: session.user.id,
        status: "ACTIVE",
        verified: false,
        monetizationEnabled: false,
        subscriberCount: 0,
        videoCount: 0,
        totalViews: 0,
      },
      include: {
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
    })

    // Update user role to CREATOR if not already
    if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "CREATOR" },
      })
    }

    return NextResponse.json(
      { channel, message: "Channel created successfully" },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating channel:", error)
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    )
  }
}
