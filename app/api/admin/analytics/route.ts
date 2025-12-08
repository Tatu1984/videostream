import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "30" // days

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get overall stats
    const [
      totalUsers,
      totalChannels,
      totalVideos,
      totalComments,
      activeUsers,
      newUsers,
      newChannels,
      newVideos,
      pendingFlags,
      pendingClaims,
      activeStrikes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.channel.count(),
      prisma.video.count(),
      prisma.comment.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.channel.count({ where: { createdAt: { gte: startDate } } }),
      prisma.video.count({ where: { createdAt: { gte: startDate } } }),
      prisma.flag.count({ where: { status: "PENDING" } }),
      prisma.copyrightClaim.count({ where: { status: "PENDING" } }),
      prisma.strike.count({ where: { active: true } }),
    ])

    // Get video stats
    const videoStats = await prisma.video.aggregate({
      _sum: {
        viewCount: true,
        likeCount: true,
        commentCount: true,
      },
    })

    // Get user role distribution
    const userRoles = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    })

    // Get user status distribution
    const userStatuses = await prisma.user.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    // Get video visibility distribution
    const videoVisibility = await prisma.video.groupBy({
      by: ["visibility"],
      _count: { visibility: true },
    })

    // Get video type distribution
    const videoTypes = await prisma.video.groupBy({
      by: ["videoType"],
      _count: { videoType: true },
    })

    // Get channel stats
    const channelStats = await prisma.channel.aggregate({
      _sum: {
        subscriberCount: true,
        videoCount: true,
      },
      _avg: {
        subscriberCount: true,
      },
    })

    // Get verified channels count
    const verifiedChannels = await prisma.channel.count({
      where: { verified: true },
    })

    // Get monetized channels count
    const monetizedChannels = await prisma.channel.count({
      where: { monetizationEnabled: true },
    })

    // Get flag stats
    const flagStats = await prisma.flag.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    const flagReasons = await prisma.flag.groupBy({
      by: ["reason"],
      _count: { reason: true },
    })

    // Get strike stats
    const strikeTypes = await prisma.strike.groupBy({
      by: ["type"],
      where: { active: true },
      _count: { type: true },
    })

    const strikeSeverities = await prisma.strike.groupBy({
      by: ["severity"],
      where: { active: true },
      _count: { severity: true },
    })

    // Get copyright stats
    const copyrightStats = await prisma.copyrightClaim.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    // Get revenue stats (if any)
    const revenueStats = await prisma.transaction.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    })

    // Get daily signups for the period
    const dailySignups = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    // Get daily video uploads for the period
    const dailyUploads = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "Video"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    // Get top channels by subscribers
    const topChannels = await prisma.channel.findMany({
      take: 10,
      orderBy: { subscriberCount: "desc" },
      select: {
        id: true,
        name: true,
        handle: true,
        subscriberCount: true,
        videoCount: true,
        verified: true,
      },
    })

    // Get top videos by views
    const topVideos = await prisma.video.findMany({
      take: 10,
      where: { visibility: "PUBLIC" },
      orderBy: { viewCount: "desc" },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        channel: {
          select: {
            name: true,
            handle: true,
          },
        },
      },
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        totalChannels,
        totalVideos,
        totalComments,
        activeUsers,
        newUsers,
        newChannels,
        newVideos,
        pendingFlags,
        pendingClaims,
        activeStrikes,
      },
      videoStats: {
        totalViews: videoStats._sum.viewCount?.toString() || "0",
        totalLikes: videoStats._sum.likeCount || 0,
        totalComments: videoStats._sum.commentCount || 0,
      },
      channelStats: {
        totalSubscribers: channelStats._sum.subscriberCount || 0,
        totalVideos: channelStats._sum.videoCount || 0,
        avgSubscribers: Math.round(channelStats._avg.subscriberCount || 0),
        verifiedChannels,
        monetizedChannels,
      },
      distributions: {
        userRoles: userRoles.reduce((acc, curr) => {
          acc[curr.role] = curr._count.role
          return acc
        }, {} as Record<string, number>),
        userStatuses: userStatuses.reduce((acc, curr) => {
          acc[curr.status] = curr._count.status
          return acc
        }, {} as Record<string, number>),
        videoVisibility: videoVisibility.reduce((acc, curr) => {
          acc[curr.visibility] = curr._count.visibility
          return acc
        }, {} as Record<string, number>),
        videoTypes: videoTypes.reduce((acc, curr) => {
          acc[curr.videoType] = curr._count.videoType
          return acc
        }, {} as Record<string, number>),
      },
      moderation: {
        flagStats: flagStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count.status
          return acc
        }, {} as Record<string, number>),
        flagReasons: flagReasons.reduce((acc, curr) => {
          acc[curr.reason] = curr._count.reason
          return acc
        }, {} as Record<string, number>),
        strikeTypes: strikeTypes.reduce((acc, curr) => {
          acc[curr.type] = curr._count.type
          return acc
        }, {} as Record<string, number>),
        strikeSeverities: strikeSeverities.reduce((acc, curr) => {
          acc[curr.severity] = curr._count.severity
          return acc
        }, {} as Record<string, number>),
        copyrightStats: copyrightStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count.status
          return acc
        }, {} as Record<string, number>),
      },
      revenue: {
        totalRevenue: revenueStats._sum.amount || 0,
        transactionCount: revenueStats._count,
      },
      trends: {
        dailySignups: dailySignups.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
        dailyUploads: dailyUploads.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
      },
      topContent: {
        topChannels,
        topVideos: topVideos.map((v) => ({
          ...v,
          viewCount: v.viewCount.toString(),
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
