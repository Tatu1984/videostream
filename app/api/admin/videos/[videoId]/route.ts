import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Delete the video and all related data (cascades)
    await prisma.video.delete({
      where: { id: videoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete video:", error)
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const video = await prisma.video.update({
      where: { id: videoId },
      data,
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Failed to update video:", error)
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 })
  }
}
