import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/shared/ui/card"
import { Eye, Clock, Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

export default async function StudioAnalyticsPage() {
  const session = await auth()

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

  // Get all videos from user's channels
  const videos = await prisma.video.findMany({
    where: {
      channelId: { in: channelIds },
    },
  })

  // Calculate analytics
  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
  const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0)
  const totalComments = videos.reduce((sum, v) => sum + v.commentCount, 0)
  const totalWatchTime = videos.reduce((sum, v) => sum + (v.duration || 0) * v.viewCount, 0)
  const avgViewsPerVideo = videos.length > 0 ? Math.floor(totalViews / videos.length) : 0

  // Mock data for charts
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (27 - i))
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: Math.floor(Math.random() * 5000) + 1000,
      watchTime: Math.floor(Math.random() * 10000) + 2000,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-1 text-gray-600">Track your channel's performance</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <select className="rounded-md border border-gray-300 px-4 py-2 text-sm">
          <option>Last 7 days</option>
          <option selected>Last 28 days</option>
          <option>Last 90 days</option>
          <option>Last 365 days</option>
          <option>Lifetime</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="mt-1 text-3xl font-bold">{totalViews.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>12.5%</span>
              </div>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Watch Time (hours)</p>
              <p className="mt-1 text-3xl font-bold">
                {Math.floor(totalWatchTime / 3600).toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>8.3%</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subscribers</p>
              <p className="mt-1 text-3xl font-bold">
                {channels[0].subscriberCount.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span>2.1%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estimated Revenue</p>
              <p className="mt-1 text-3xl font-bold">$2,456</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>15.7%</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Views Chart */}
      <Card className="mb-6 p-6">
        <h2 className="mb-6 text-xl font-semibold">Views Over Time</h2>
        <div className="space-y-1">
          {last28Days.map((day, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-16 text-xs text-gray-600">{day.date}</span>
              <div className="h-6 flex-1 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(day.views / 6000) * 100}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs text-gray-600">
                {day.views.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Watch Time Chart */}
      <Card className="mb-6 p-6">
        <h2 className="mb-6 text-xl font-semibold">Watch Time (minutes)</h2>
        <div className="space-y-1">
          {last28Days.slice(-7).map((day, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-16 text-xs text-gray-600">{day.date}</span>
              <div className="h-8 flex-1 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${(day.watchTime / 12000) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs text-gray-600">
                {day.watchTime.toLocaleString()} min
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Videos */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Top Performing Videos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Video
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Views
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Likes
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Comments
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {videos
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 5)
                .map((video) => {
                  const engagementRate =
                    video.viewCount > 0
                      ? (((video.likeCount + video.commentCount) / video.viewCount) * 100).toFixed(2)
                      : "0.00"
                  return (
                    <tr key={video.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                            {video.thumbnailUrl && (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="max-w-xs">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {video.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {video.viewCount.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {video.likeCount.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm text-gray-900">{video.commentCount}</td>
                      <td className="py-4 text-sm text-gray-900">{engagementRate}%</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audience Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Top Traffic Sources</h2>
          <div className="space-y-3">
            {[
              { source: "YouTube Search", percentage: 42 },
              { source: "Suggested Videos", percentage: 28 },
              { source: "Browse Features", percentage: 15 },
              { source: "External", percentage: 10 },
              { source: "Direct", percentage: 5 },
            ].map((item) => (
              <div key={item.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-700">{item.source}</span>
                  <span className="font-medium text-gray-900">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Viewer Demographics</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Age Groups</h3>
              <div className="space-y-2">
                {[
                  { age: "18-24", percentage: 35 },
                  { age: "25-34", percentage: 40 },
                  { age: "35-44", percentage: 15 },
                  { age: "45-54", percentage: 7 },
                  { age: "55+", percentage: 3 },
                ].map((item) => (
                  <div key={item.age} className="flex items-center gap-2">
                    <span className="w-16 text-xs text-gray-600">{item.age}</span>
                    <div className="h-4 flex-1 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-gray-600">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
