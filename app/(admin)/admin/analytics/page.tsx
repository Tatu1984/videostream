"use client"

import { useEffect, useState } from "react"
import {
  Users,
  Video,
  Tv,
  Eye,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Flag,
  Copyright,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalChannels: number
    totalVideos: number
    totalComments: number
    activeUsers: number
    newUsers: number
    newChannels: number
    newVideos: number
    pendingFlags: number
    pendingClaims: number
    activeStrikes: number
  }
  videoStats: {
    totalViews: string
    totalLikes: number
    totalComments: number
  }
  channelStats: {
    totalSubscribers: number
    totalVideos: number
    avgSubscribers: number
    verifiedChannels: number
    monetizedChannels: number
  }
  distributions: {
    userRoles: Record<string, number>
    userStatuses: Record<string, number>
    videoVisibility: Record<string, number>
    videoTypes: Record<string, number>
  }
  moderation: {
    flagStats: Record<string, number>
    flagReasons: Record<string, number>
    strikeTypes: Record<string, number>
    strikeSeverities: Record<string, number>
    copyrightStats: Record<string, number>
  }
  revenue: {
    totalRevenue: number
    transactionCount: number
  }
  trends: {
    dailySignups: Array<{ date: string; count: number }>
    dailyUploads: Array<{ date: string; count: number }>
  }
  topContent: {
    topChannels: Array<{
      id: string
      name: string
      handle: string
      subscriberCount: number
      videoCount: number
      verified: boolean
    }>
    topVideos: Array<{
      id: string
      title: string
      viewCount: string
      likeCount: number
      channel: { name: string; handle: string }
    }>
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-sm text-gray-600">Comprehensive platform metrics and insights</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="mt-1 text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</p>
              <p className="mt-1 text-xs text-green-600">+{data.overview.newUsers} new</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Videos</p>
              <p className="mt-1 text-2xl font-bold">{data.overview.totalVideos.toLocaleString()}</p>
              <p className="mt-1 text-xs text-green-600">+{data.overview.newVideos} new</p>
            </div>
            <Video className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Channels</p>
              <p className="mt-1 text-2xl font-bold">{data.overview.totalChannels.toLocaleString()}</p>
              <p className="mt-1 text-xs text-green-600">+{data.overview.newChannels} new</p>
            </div>
            <Tv className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="mt-1 text-2xl font-bold">{parseInt(data.videoStats.totalViews).toLocaleString()}</p>
            </div>
            <Eye className="h-10 w-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <ThumbsUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-xl font-bold">{data.videoStats.totalLikes.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Total Comments</p>
              <p className="text-xl font-bold">{data.videoStats.totalComments.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Subscribers</p>
              <p className="text-xl font-bold">{data.channelStats.totalSubscribers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Channel Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Verified Channels</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{data.channelStats.verifiedChannels}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Monetized Channels</p>
              <p className="mt-1 text-2xl font-bold text-green-900">{data.channelStats.monetizedChannels}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-purple-600">Avg Subscribers</p>
              <p className="mt-1 text-2xl font-bold text-purple-900">{data.channelStats.avgSubscribers}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm text-orange-600">Total Videos</p>
              <p className="mt-1 text-2xl font-bold text-orange-900">{data.channelStats.totalVideos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Moderation Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">{data.overview.pendingFlags}</p>
              <p className="text-xs text-gray-500">Pending Flags</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Copyright className="h-6 w-6 text-orange-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">{data.overview.pendingClaims}</p>
              <p className="text-xs text-gray-500">Pending Claims</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">{data.overview.activeStrikes}</p>
              <p className="text-xs text-gray-500">Active Strikes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distributions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Roles */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">User Roles Distribution</h2>
          <div className="space-y-3">
            {Object.entries(data.distributions.userRoles).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    role === "ADMIN" ? "bg-red-500" :
                    role === "CREATOR" ? "bg-purple-500" : "bg-blue-500"
                  }`}></div>
                  <span className="text-sm text-gray-700">{role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        role === "ADMIN" ? "bg-red-500" :
                        role === "CREATOR" ? "bg-purple-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${(count / data.overview.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Types */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Video Types Distribution</h2>
          <div className="space-y-3">
            {Object.entries(data.distributions.videoTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    type === "SHORT" ? "bg-purple-500" :
                    type === "LIVE" ? "bg-red-500" :
                    type === "PREMIERE" ? "bg-blue-500" : "bg-gray-500"
                  }`}></div>
                  <span className="text-sm text-gray-700">{type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        type === "SHORT" ? "bg-purple-500" :
                        type === "LIVE" ? "bg-red-500" :
                        type === "PREMIERE" ? "bg-blue-500" : "bg-gray-500"
                      }`}
                      style={{ width: `${(count / data.overview.totalVideos) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flag Reasons */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Flag Reasons Breakdown</h2>
          {Object.keys(data.moderation.flagReasons).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.moderation.flagReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-700">{reason.replace("_", " ")}</span>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No flags recorded</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Strike Types Breakdown</h2>
          {Object.keys(data.moderation.strikeTypes).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.moderation.strikeTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-700">{type.replace("_", " ")}</span>
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active strikes</p>
          )}
        </div>
      </div>

      {/* Top Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Channels */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Top Channels by Subscribers</h2>
          <div className="space-y-3">
            {data.topContent.topChannels.slice(0, 5).map((channel, index) => (
              <div key={channel.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900">{channel.name}</span>
                      {channel.verified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                    </div>
                    <span className="text-xs text-gray-500">@{channel.handle}</span>
                  </div>
                </div>
                <span className="text-sm font-medium">{channel.subscriberCount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Videos */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Top Videos by Views</h2>
          <div className="space-y-3">
            {data.topContent.topVideos.slice(0, 5).map((video, index) => (
              <div key={video.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[200px]">{video.title}</p>
                    <span className="text-xs text-gray-500">{video.channel.name}</span>
                  </div>
                </div>
                <span className="text-sm font-medium">{parseInt(video.viewCount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue (if any) */}
      {data.revenue.totalRevenue > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Revenue Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600">Total Revenue</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-green-900">
                ${data.revenue.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-600">Transactions</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-blue-900">
                {data.revenue.transactionCount}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
