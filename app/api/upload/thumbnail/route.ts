import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("thumbnail") as File | null
    const videoId = formData.get("videoId") as string

    if (!file) {
      return NextResponse.json({ error: "No thumbnail file provided" }, { status: 400 })
    }

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    // Verify user owns the video's channel
    const video = await prisma.video.findFirst({
      where: { id: videoId },
      include: {
        channel: {
          select: { ownerId: true },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.channel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this video" },
        { status: 403 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.type.split("/")[1] || "jpg"
    const filename = `${timestamp}-${randomStr}.${extension}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "thumbnails")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const thumbnailUrl = `/uploads/thumbnails/${filename}`

    // Update video with thumbnail URL
    await prisma.video.update({
      where: { id: videoId },
      data: { thumbnailUrl },
    })

    // Create thumbnail asset record
    await prisma.videoAsset.create({
      data: {
        videoId,
        type: "THUMBNAIL",
        url: thumbnailUrl,
        fileSize: BigInt(file.size),
      },
    })

    return NextResponse.json({
      success: true,
      thumbnailUrl,
    })
  } catch (error) {
    console.error("Error uploading thumbnail:", error)
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    )
  }
}
