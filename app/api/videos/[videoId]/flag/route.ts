import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const flagSchema = z.object({
  reason: z.enum([
    "SEXUAL_CONTENT",
    "VIOLENT_CONTENT",
    "HATEFUL_CONTENT",
    "SPAM",
    "MISLEADING",
    "COPYRIGHT",
    "HARASSMENT",
    "OTHER",
  ]),
  comment: z.string().max(500).optional(),
})

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

    const body = await req.json()
    const validatedData = flagSchema.parse(body)

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Check if user already flagged this video (prevent spam)
    const existingFlag = await prisma.flag.findFirst({
      where: {
        targetType: "VIDEO",
        targetId: videoId,
        reporterId: session.user.id,
        status: "PENDING",
      },
    })

    if (existingFlag) {
      return NextResponse.json(
        { error: "You have already flagged this video" },
        { status: 400 }
      )
    }

    const flag = await prisma.flag.create({
      data: {
        targetType: "VIDEO",
        targetId: videoId,
        reporterId: session.user.id,
        reason: validatedData.reason,
        comment: validatedData.comment,
      },
    })

    return NextResponse.json(
      { message: "Video flagged successfully", flag },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error flagging video:", error)
    return NextResponse.json(
      { error: "Failed to flag video" },
      { status: 500 }
    )
  }
}
