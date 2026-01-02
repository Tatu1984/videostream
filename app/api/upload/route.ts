import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string | null // "avatar", "thumbnail", "video", "banner"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB for images, 5GB for videos)
    const maxSize = type === "video" ? 5 * 1024 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${type === "video" ? "5GB" : "10MB"}` },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"]

    if (type === "video") {
      if (!allowedVideoTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid video format. Allowed: MP4, WebM, MOV" },
          { status: 400 }
        )
      }
    } else {
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid image format. Allowed: JPEG, PNG, GIF, WebP" },
          { status: 400 }
        )
      }
    }

    // Generate unique filename
    const ext = path.extname(file.name)
    const hash = crypto.randomBytes(16).toString("hex")
    const filename = `${hash}${ext}`

    // Determine upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", type || "misc")

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return public URL
    const url = `/uploads/${type || "misc"}/${filename}`

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
