import { prisma } from "@/lib/db/prisma"
import { Users, Video, Flag, AlertTriangle, Eye, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  // Get stats
  const [userCount, videoCount, channelCount, pendingFlags, activeStrikes] =
    await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.channel.count(),
      prisma.flag.count({ where: { status: "PENDING" } }),
      prisma.strike.count({ where: { active: true } }),
    ])

  // Get recent activity
  const recentVideos = await prisma.video.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      channel: { select: { name: true } },
    },
  })

  const recentFlags = await prisma.flag.findMany({
    where: { status: "PENDING" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true, email: true } },
    },
  })

  const stats = [
    {
      name: "Total Users",
      value: userCount,
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500",
    },
    {
      name: "Total Videos",
      value: videoCount,
      icon: Video,
      href: "/admin/videos",
      color: "bg-green-500",
    },
    {
      name: "Pending Flags",
      value: pendingFlags,
      icon: Flag,
      href: "/admin/flags",
      color: "bg-yellow-500",
    },
    {
      name: "Active Strikes",
      value: activeStrikes,
      icon: AlertTriangle,
      href: "/admin/strikes",
      color: "bg-red-500",
    },
  ]

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Videos */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Videos</h2>
            <Link
              href="/admin/videos"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-20 overflow-hidden rounded bg-gray-200">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No thumb
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium line-clamp-1">{video.title}</p>
                    <p className="text-sm text-gray-500">{video.channel.name}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    video.visibility === "PUBLIC"
                      ? "bg-green-100 text-green-800"
                      : video.visibility === "PRIVATE"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {video.visibility}
                </span>
              </div>
            ))}
            {recentVideos.length === 0 && (
              <p className="py-4 text-center text-gray-500">No videos yet</p>
            )}
          </div>
        </div>

        {/* Pending Flags */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Flags</h2>
            <Link
              href="/admin/flags"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        flag.reason === "SEXUAL_CONTENT"
                          ? "bg-red-100 text-red-800"
                          : flag.reason === "SPAM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {flag.reason.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {flag.targetType}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Reported by {flag.reporter.name || flag.reporter.email}
                  </p>
                </div>
                <Link
                  href={`/admin/flags/${flag.id}`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Review
                </Link>
              </div>
            ))}
            {recentFlags.length === 0 && (
              <p className="py-4 text-center text-gray-500">
                No pending flags
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
