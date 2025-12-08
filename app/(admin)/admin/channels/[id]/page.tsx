import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Users, Video, Eye, ThumbsUp, CheckCircle } from "lucide-react"
import Link from "next/link"
import { ChannelActions } from "@/components/admin/ChannelActions"

export default async function AdminChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const channel = await prisma.channel.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
        },
      },
      videos: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: {
            select: { likes: true, comments: true },
          },
        },
      },
      _count: {
        select: {
          videos: true,
          subscriptions: true,
          strikes: true,
        },
      },
      strikes: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!channel) {
    notFound()
  }

  // Calculate stats
  const totalViews = channel.videos.reduce((sum, v) => sum + Number(v.viewCount), 0)
  const totalLikes = channel.videos.reduce((sum, v) => sum + v.likeCount, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Details</h1>
          <p className="mt-1 text-gray-600">Manage channel and content</p>
        </div>
        <Link href="/admin/channels">
          <Button variant="outline">Back to Channels</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channel Profile */}
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 flex-shrink-0">
                {channel.avatar ? (
                  <img
                    src={channel.avatar}
                    alt={channel.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-300 text-3xl font-medium text-gray-600">
                    {channel.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{channel.name}</h2>
                  {channel.verified && (
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <p className="mt-1 text-gray-600">@{channel.handle}</p>
                {channel.description && (
                  <p className="mt-3 text-sm text-gray-700">{channel.description}</p>
                )}
                <div className="mt-4 flex gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(channel.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Owner</p>
                    <Link href={`/admin/users/${channel.owner.id}`}>
                      <p className="font-medium text-blue-600 hover:underline">
                        {channel.owner.name}
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Subscribers</p>
                  <p className="mt-1 text-2xl font-bold">
                    {channel.subscriberCount.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Videos</p>
                  <p className="mt-1 text-2xl font-bold">{channel.videoCount}</p>
                </div>
                <Video className="h-8 w-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="mt-1 text-2xl font-bold">
                    {totalViews.toLocaleString()}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Likes</p>
                  <p className="mt-1 text-2xl font-bold">
                    {totalLikes.toLocaleString()}
                  </p>
                </div>
                <ThumbsUp className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Recent Videos */}
          <Card className="p-6">
            <h3 className="mb-4 text-xl font-semibold">Recent Videos</h3>
            {channel.videos.length > 0 ? (
              <div className="space-y-3">
                {channel.videos.map((video) => (
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
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {video.viewCount.toLocaleString()} views • {video._count.likes}{" "}
                        likes • {video._count.comments} comments
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          video.visibility === "PUBLIC"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {video.visibility}
                      </span>
                      <Link href={`/watch/${video.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No videos uploaded yet</p>
            )}
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* View Owner Link */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Owner</h3>
            <Link
              href={`/admin/users/${channel.owner.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                {channel.owner.name?.[0] || "?"}
              </div>
              <div>
                <p className="font-medium text-gray-900">{channel.owner.name}</p>
                <p className="text-xs text-gray-500">{channel.owner.email}</p>
              </div>
            </Link>
          </div>

          {/* Channel Actions Component */}
          <ChannelActions
            channelId={channel.id}
            isVerified={channel.verified}
            status={channel.status}
            monetizationEnabled={channel.monetizationEnabled}
          />

          {/* Strikes */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Policy Strikes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Strikes</span>
                <span className="text-sm font-medium text-gray-900">{channel._count.strikes} / 3</span>
              </div>
              {channel._count.strikes === 0 ? (
                <div className="mt-4 rounded-lg bg-green-50 p-3 text-center">
                  <CheckCircle className="mx-auto h-6 w-6 text-green-600" />
                  <p className="mt-1 text-sm font-medium text-green-900">Good Standing</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {channel.strikes.map((strike) => (
                    <div key={strike.id} className="rounded-lg bg-red-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-red-800">
                          {strike.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-red-600">{strike.severity}</span>
                      </div>
                      <p className="mt-1 text-xs text-red-700 line-clamp-2">{strike.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
