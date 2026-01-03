import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { cookies } from "next/headers"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Use cookies to prevent multiple views from same user in a session
    const cookieStore = await cookies()
    const viewedVideos = cookieStore.get("viewed_videos")?.value || ""
    const viewedList = viewedVideos ? viewedVideos.split(",") : []

    // Check if this video was already viewed in this session
    if (viewedList.includes(videoId)) {
      return NextResponse.json({
        success: true,
        message: "View already recorded",
        alreadyViewed: true
      })
    }

    // Increment view count
    await prisma.video.update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    })

    // Update channel total views
    const videoWithChannel = await prisma.video.findUnique({
      where: { id: videoId },
      select: { channelId: true },
    })

    if (videoWithChannel?.channelId) {
      await prisma.channel.update({
        where: { id: videoWithChannel.channelId },
        data: { totalViews: { increment: 1 } },
      })
    }

    // Add video to viewed list in cookie (keep last 100 videos)
    viewedList.push(videoId)
    const trimmedList = viewedList.slice(-100)

    const response = NextResponse.json({
      success: true,
      message: "View recorded",
      alreadyViewed: false
    })

    // Set cookie that expires in 24 hours
    response.cookies.set("viewed_videos", trimmedList.join(","), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error recording view:", error)
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    )
  }
}
