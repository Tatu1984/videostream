import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import AnalyticsClient from "./AnalyticsClient"

export default async function StudioAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const session = await auth()
  const { range = "28" } = await searchParams

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's channels
  const channels = await prisma.channel.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: { videos: true },
      },
    },
  })

  if (channels.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">No channel found</p>
          <p className="mt-1 text-sm text-gray-600">
            Create a channel to view analytics
          </p>
        </div>
      </div>
    )
  }

  const channelIds = channels.map((c) => c.id)

  // Calculate date range based on selected period
  const daysToSubtract = range === "lifetime" ? 3650 : parseInt(range, 10)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysToSubtract)

  // Get all videos from user's channels
  const videos = await prisma.video.findMany({
    where: {
      channelId: { in: channelIds },
    },
  })

  // Get real analytics data from VideoAnalytics within date range
  const videoIds = videos.map((v) => v.id)

  const analyticsData = await prisma.videoAnalytics.findMany({
    where: {
      videoId: { in: videoIds },
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  })

  // Calculate totals based on selected range
  const totalViews = analyticsData.reduce((sum, a) => sum + a.views, 0) ||
    videos.reduce((sum, v) => sum + Number(v.viewCount), 0)
  const totalWatchTime = analyticsData.reduce((sum, a) => sum + a.watchTime, 0) ||
    videos.reduce((sum, v) => sum + (v.duration || 0) * Number(v.viewCount), 0)

  // Aggregate analytics by date
  const analyticsMap = new Map<string, { views: number; watchTime: number }>()

  analyticsData.forEach((a) => {
    const dateKey = a.date.toISOString().split("T")[0]
    const existing = analyticsMap.get(dateKey) || { views: 0, watchTime: 0 }
    analyticsMap.set(dateKey, {
      views: existing.views + a.views,
      watchTime: existing.watchTime + a.watchTime,
    })
  })

  // Generate days array based on range
  const numDays = Math.min(daysToSubtract, 365) // Cap at 365 days for display
  const dayData = Array.from({ length: numDays }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (numDays - 1 - i))
    const dateKey = date.toISOString().split("T")[0]
    const data = analyticsMap.get(dateKey) || { views: 0, watchTime: 0 }
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: data.views,
      watchTime: data.watchTime,
    }
  })

  // Calculate traffic source totals
  const trafficTotals = analyticsData.reduce(
    (acc, a) => ({
      search: acc.search + a.searchViews,
      suggested: acc.suggested + a.suggestedViews,
      browse: acc.browse + a.browseViews,
      external: acc.external + a.externalViews,
    }),
    { search: 0, suggested: 0, browse: 0, external: 0 }
  )

  // Get estimated revenue from transactions
  const revenue = await prisma.transaction.aggregate({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      type: { in: ["AD_REVENUE", "MEMBERSHIP", "SUPERCHAT", "DONATION"] },
      createdAt: { gte: startDate },
    },
    _sum: { amount: true },
  })
  const estimatedRevenue = revenue._sum.amount || 0

  // Serialize videos for client
  const serializedVideos = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    viewCount: Number(v.viewCount),
    likeCount: v.likeCount,
    commentCount: v.commentCount,
    duration: v.duration,
  }))

  const serializedChannels = channels.map((c) => ({
    subscriberCount: c.subscriberCount,
  }))

  return (
    <AnalyticsClient
      channels={serializedChannels}
      videos={serializedVideos}
      totalViews={totalViews}
      totalWatchTime={totalWatchTime}
      estimatedRevenue={estimatedRevenue}
      dayData={dayData}
      trafficTotals={trafficTotals}
      currentRange={range}
    />
  )
}
