import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { prisma } from "@/lib/db/prisma"
import { Clock, TrendingUp, Calendar } from "lucide-react"
import WellbeingSettingsForm from "./WellbeingSettingsForm"

export default async function WellbeingSettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Get user's wellbeing settings
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      breakReminder: true,
      breakInterval: true,
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  // Calculate watch stats
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [todayStats, weekStats, dailyBreakdown] = await Promise.all([
    // Today's watch time
    prisma.watchHistory.aggregate({
      where: {
        userId: session.user.id,
        watchedAt: { gte: todayStart },
      },
      _sum: { watchTime: true },
    }),
    // This week's watch time
    prisma.watchHistory.aggregate({
      where: {
        userId: session.user.id,
        watchedAt: { gte: weekStart },
      },
      _sum: { watchTime: true },
    }),
    // Daily breakdown for the last 7 days
    prisma.$queryRaw<Array<{ day: Date; total_watch_time: bigint }>>`
      SELECT
        DATE(watched_at) as day,
        SUM(watch_time) as total_watch_time
      FROM "WatchHistory"
      WHERE user_id = ${session.user.id}
        AND watched_at >= ${weekStart}
      GROUP BY DATE(watched_at)
      ORDER BY day ASC
    `,
  ])

  // Convert seconds to hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return { hours, minutes }
  }

  const todayTime = formatTime(Number(todayStats._sum.watchTime) || 0)
  const weekTime = formatTime(Number(weekStats._sum.watchTime) || 0)

  // Process daily breakdown
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
    return date
  })

  const dailyData = last7Days.map((date) => {
    const dayStr = date.toISOString().split("T")[0]
    const record = dailyBreakdown.find(
      (d) => d.day.toISOString().split("T")[0] === dayStr
    )
    const seconds = Number(record?.total_watch_time) || 0
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      hours: seconds / 3600,
    }
  })

  const maxHours = Math.max(...dailyData.map((d) => d.hours), 4)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Time Watched & Wellbeing</h2>
        <p className="text-sm text-gray-600">
          Manage your watch time and set healthy viewing habits
        </p>
      </Card>

      {/* Watch Time Stats */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Your Watch Time</h3>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Today</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {todayTime.hours}h {todayTime.minutes}m
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">This Week</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {weekTime.hours}h {weekTime.minutes}m
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Daily avg: {Math.floor(Number(weekStats._sum.watchTime) / 7 / 3600)}h{" "}
              {Math.floor((Number(weekStats._sum.watchTime) / 7 % 3600) / 60)}m
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last 7 Days</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {weekTime.hours}h {weekTime.minutes}m
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Peak day: {Math.max(...dailyData.map((d) => d.hours)).toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Simple Bar Chart Representation */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Daily Breakdown (Last 7 Days)</p>
          <div className="space-y-2">
            {dailyData.map((item) => (
              <div key={item.day} className="flex items-center gap-2">
                <span className="w-12 text-xs text-gray-600">{item.day}</span>
                <div className="h-6 flex-1 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(item.hours / maxHours) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-gray-600">
                  {item.hours.toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <WellbeingSettingsForm
        initialSettings={{
          breakReminder: user.breakReminder,
          breakInterval: user.breakInterval,
        }}
      />
    </div>
  )
}
