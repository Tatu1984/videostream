import { prisma } from "@/lib/db/prisma"
import { Users, PlaySquare, Tv, Film } from "lucide-react"
import { DashboardCharts } from "@/components/admin/DashboardCharts"

export default async function AdminDashboardPage() {
  // Get platform stats
  const [totalUsers, totalChannels, totalVideos, totalShorts] = await Promise.all([
    prisma.user.count(),
    prisma.channel.count(),
    prisma.video.count({ where: { videoType: "STANDARD" } }),
    prisma.video.count({ where: { videoType: "SHORT" } }),
  ])

  // Get last 7 days data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const chartData = await Promise.all(
    last7Days.map(async (date) => {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const [users, videos, shorts] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        }),
        prisma.video.count({
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            videoType: "STANDARD",
          },
        }),
        prisma.video.count({
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            videoType: "SHORT",
          },
        }),
      ])

      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        users,
        videos,
        shorts,
      }
    })
  )

  const stats = [
    {
      label: "Total User",
      value: totalUsers,
      icon: Users,
      progress: Math.min((totalUsers / 100) * 100, 100),
    },
    {
      label: "Total Channel",
      value: totalChannels,
      icon: Tv,
      progress: Math.min((totalChannels / 50) * 100, 100),
    },
    {
      label: "Total Video",
      value: totalVideos,
      icon: PlaySquare,
      progress: Math.min((totalVideos / 100) * 100, 100),
    },
    {
      label: "Total Shorts",
      value: totalShorts,
      icon: Film,
      progress: Math.min((totalShorts / 100) * 100, 100),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Admin !</h1>
          <p className="text-gray-500">Dashboard</p>
        </div>
        <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Select Date Range
        </button>
      </div>

      {/* Stats Cards - 4 in a row exactly like PDF */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-100 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
              <div className="text-[#FF6B8A]">
                <stat.icon className="h-8 w-8" strokeWidth={1.5} />
              </div>
            </div>
            {/* Progress bar - coral/pink gradient */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#FF6B8A]"
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section - Area chart on left, Donut on right */}
      <DashboardCharts
        chartData={chartData}
        totalUsers={totalUsers}
        totalVideos={totalVideos}
        totalShorts={totalShorts}
      />
    </div>
  )
}
