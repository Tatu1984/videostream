import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "week" // day, week, month

    const now = new Date()
    let startDate: Date

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get total watch time for the period
    const totalStats = await prisma.watchHistory.aggregate({
      where: {
        userId: session.user.id,
        watchedAt: { gte: startDate },
      },
      _sum: { watchTime: true },
      _count: true,
    })

    // Get daily breakdown
    const dailyBreakdown = await prisma.$queryRaw<
      Array<{ day: Date; total_watch_time: bigint; video_count: bigint }>
    >`
      SELECT
        DATE(watched_at) as day,
        SUM(watch_time) as total_watch_time,
        COUNT(DISTINCT video_id) as video_count
      FROM "WatchHistory"
      WHERE user_id = ${session.user.id}
        AND watched_at >= ${startDate}
      GROUP BY DATE(watched_at)
      ORDER BY day ASC
    `

    // Get top watched videos
    const topVideos = await prisma.watchHistory.groupBy({
      by: ["videoId"],
      where: {
        userId: session.user.id,
        watchedAt: { gte: startDate },
      },
      _sum: { watchTime: true },
      _count: true,
      orderBy: {
        _sum: {
          watchTime: "desc",
        },
      },
      take: 10,
    })

    // Get video details for top videos
    const videoIds = topVideos.map((v) => v.videoId)
    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        duration: true,
        channel: {
          select: {
            name: true,
          },
        },
      },
    })

    const topVideosWithDetails = topVideos.map((tv) => {
      const video = videos.find((v) => v.id === tv.videoId)
      return {
        video,
        watchTime: Number(tv._sum.watchTime),
        watchCount: tv._count,
      }
    })

    return NextResponse.json({
      period,
      totalWatchTime: Number(totalStats._sum.watchTime) || 0,
      totalVideos: totalStats._count,
      dailyBreakdown: dailyBreakdown.map((d) => ({
        day: d.day,
        watchTime: Number(d.total_watch_time),
        videoCount: Number(d.video_count),
      })),
      topVideos: topVideosWithDetails,
    })
  } catch (error) {
    console.error("Error fetching watch stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
