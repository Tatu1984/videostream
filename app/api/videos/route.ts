import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createVideoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  channelId: z.string(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED", "SCHEDULED"]).default("PRIVATE"),
  videoType: z.enum(["STANDARD", "SHORT", "LIVE", "PREMIERE"]).default("STANDARD"),
  madeForKids: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")
    const videoType = searchParams.get("type")
    const visibility = searchParams.get("visibility")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    if (channelId) where.channelId = channelId
    if (videoType) where.videoType = videoType
    if (visibility) where.visibility = visibility
    else where.visibility = "PUBLIC" // Default to public videos

    const videos = await prisma.video.findMany({
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

    const total = await prisma.video.count({ where })

    return NextResponse.json({
      videos,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createVideoSchema.parse(body)

    // Verify user owns the channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: validatedData.channelId,
        ownerId: session.user.id,
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or you don't have permission" },
        { status: 403 }
      )
    }

    const video = await prisma.video.create({
      data: {
        ...validatedData,
        processingStatus: "PENDING",
      },
      include: {
        channel: true,
      },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating video:", error)
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    )
  }
}
