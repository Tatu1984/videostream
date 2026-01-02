import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Route segment config for App Router
export const maxDuration = 300 // 5 minutes timeout for uploads
export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("video") as File | null
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const channelId = formData.get("channelId") as string
    const visibility = (formData.get("visibility") as string) || "PRIVATE"
    const videoType = (formData.get("videoType") as string) || "STANDARD"

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    if (!title || !channelId) {
      return NextResponse.json(
        { error: "Title and channelId are required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP4, WebM, MOV, AVI, MKV" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB" },
        { status: 400 }
      )
    }

    // Verify user owns the channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        ownerId: session.user.id,
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or you don't have permission" },
        { status: 403 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split(".").pop() || "mp4"
    const filename = `${timestamp}-${randomStr}.${extension}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        channelId,
        visibility: visibility as any,
        videoType: videoType as any,
        processingStatus: "COMPLETED", // Since we're not transcoding
      },
    })

    // Create video asset record
    await prisma.videoAsset.create({
      data: {
        videoId: video.id,
        type: "VIDEO",
        url: `/uploads/videos/${filename}`,
        resolution: "original",
        fileSize: BigInt(file.size),
      },
    })

    // Update channel video count
    await prisma.channel.update({
      where: { id: channelId },
      data: { videoCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        url: `/uploads/videos/${filename}`,
      },
    })
  } catch (error) {
    console.error("Error uploading video:", error)
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    )
  }
}
