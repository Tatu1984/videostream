import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Mail, Calendar, Video, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { UserActions } from "@/components/admin/UserActions"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      channels: {
        include: {
          _count: {
            select: { videos: true, subscriptions: true },
          },
        },
      },
      strikes: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          comments: true,
          channels: true,
          flags: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Get recent videos and count through channels
  const [recentVideos, videoCount] = await Promise.all([
    prisma.video.findMany({
      where: { channel: { ownerId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.video.count({
      where: { channel: { ownerId: user.id } },
    }),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="mt-1 text-gray-600">Manage user account and activity</p>
        </div>
        <Link href="/admin/users">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 flex-shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-300 text-3xl font-medium text-gray-600">
                    {user.name?.[0] || user.email?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {user.name || "Unnamed User"}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-red-100 text-red-800"
                        : user.role === "CREATOR"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                {user.username && (
                  <p className="mt-1 text-gray-600">@{user.username}</p>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Channels</p>
                  <p className="mt-1 text-2xl font-bold">{user._count.channels}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Videos</p>
                  <p className="mt-1 text-2xl font-bold">{videoCount}</p>
                </div>
                <Video className="h-8 w-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comments</p>
                  <p className="mt-1 text-2xl font-bold">{user._count.comments}</p>
                </div>
                <Video className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          </div>

          {/* Channels */}
          {user.channels.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Channels</h2>
              <div className="space-y-3">
                {user.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex-shrink-0">
                        {channel.avatar ? (
                          <img
                            src={channel.avatar}
                            alt={channel.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 text-lg font-medium text-gray-600">
                            {channel.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{channel.name}</h3>
                        <p className="text-sm text-gray-600">@{channel.handle}</p>
                        <p className="text-xs text-gray-500">
                          {channel.subscriberCount.toLocaleString()} subscribers •{" "}
                          {channel._count.videos} videos
                        </p>
                      </div>
                    </div>
                    <Link href={`/admin/channels/${channel.id}`}>
                      <Button size="sm" variant="outline">
                        View Channel
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Videos */}
          {recentVideos.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Recent Videos</h2>
              <div className="space-y-3">
                {recentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
                  >
                    <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                      {video.thumbnailUrl && (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {video.viewCount.toLocaleString()} views •{" "}
                        {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        video.visibility === "PUBLIC"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {video.visibility}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Account Info</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Verified</span>
                <span className={`text-sm font-medium ${user.emailVerified ? "text-green-600" : "text-gray-500"}`}>
                  {user.emailVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trust Score</span>
                <span className="text-sm font-medium text-gray-900">{user.trustScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Strikes</span>
                <span className="text-sm font-medium text-orange-600">{user.strikes.length}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions Component */}
          <UserActions
            userId={user.id}
            currentStatus={user.status}
            currentRole={user.role}
          />

          {/* Active Strikes */}
          {user.strikes.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Active Strikes</h2>
              <div className="space-y-2">
                {user.strikes.map((strike) => (
                  <div key={strike.id} className="rounded-lg bg-red-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-red-800">{strike.type.replace("_", " ")}</span>
                      <span className="text-xs text-red-600">{strike.severity}</span>
                    </div>
                    <p className="mt-1 text-xs text-red-700 line-clamp-2">{strike.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
