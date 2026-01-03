import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Button } from "@/components/shared/ui/button"
import { Upload, Video, BarChart3, DollarSign, Shield, Users, MessageSquare } from "lucide-react"

export default async function StudioPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's channels
  const channels = await prisma.channel.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: { videos: true, subscriptions: true },
      },
    },
  })

  const primaryChannel = channels[0]

  // Get channel stats and recent videos
  let stats = null
  let recentVideos: any[] = []
  if (primaryChannel) {
    const videos = await prisma.video.findMany({
      where: { channelId: primaryChannel.id },
    })

    const totalViews = videos.reduce((sum, v) => sum + Number(v.viewCount), 0)
    const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0)

    stats = {
      totalViews,
      totalLikes,
      totalVideos: videos.length,
      subscribers: primaryChannel._count.subscriptions,
    }

    // Get recent videos
    recentVideos = await prisma.video.findMany({
      where: { channelId: primaryChannel.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        viewCount: true,
        likeCount: true,
        visibility: true,
        processingStatus: true,
        createdAt: true,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold dark:text-gray-100">Creator Studio</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your channel and content</p>
        </div>

        {!primaryChannel ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-8 text-center">
            <h2 className="text-xl font-semibold dark:text-gray-100">Create your channel</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You need to create a channel before you can upload videos
            </p>
            <Link href="/studio/channel/new">
              <Button className="mt-4">Create Channel</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                    <p className="mt-2 text-3xl font-bold dark:text-gray-100">
                      {stats?.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subscribers</p>
                    <p className="mt-2 text-3xl font-bold dark:text-gray-100">
                      {stats?.subscribers.toLocaleString()}
                    </p>
                  </div>
                  <Video className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Videos</p>
                    <p className="mt-2 text-3xl font-bold dark:text-gray-100">{stats?.totalVideos}</p>
                  </div>
                  <Video className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Likes</p>
                    <p className="mt-2 text-3xl font-bold dark:text-gray-100">
                      {stats?.totalLikes.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/studio/upload">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 transition-shadow hover:shadow-md dark:hover:bg-[#282828]">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-gray-100">Upload Video</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload a new video to your channel
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/videos">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 transition-shadow hover:shadow-md dark:hover:bg-[#282828]">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                      <Video className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-gray-100">Manage Videos</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Edit and manage your uploaded videos
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/analytics">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 transition-shadow hover:shadow-md dark:hover:bg-[#282828]">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-gray-100">View Analytics</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track your channel performance
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/monetization">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 transition-shadow hover:shadow-md dark:hover:bg-[#282828]">
                    <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-gray-100">Monetization</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage earnings and payouts
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/copyright">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 transition-shadow hover:shadow-md dark:hover:bg-[#282828]">
                    <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                      <Shield className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-gray-100">Copyright</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage copyright claims
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/community">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 transition-shadow hover:shadow-md dark:hover:bg-[#282828]">
                    <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3">
                      <MessageSquare className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-gray-100">Community</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create posts for your subscribers
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Videos */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-gray-100">Recent Videos</h2>
                <Link href="/studio/videos">
                  <Button variant="ghost">View All</Button>
                </Link>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
                {recentVideos.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentVideos.map((video) => (
                      <Link
                        key={video.id}
                        href={`/studio/videos/${video.id}/edit`}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#282828]"
                      >
                        <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Video className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {video.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                video.visibility === "PUBLIC"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : video.visibility === "UNLISTED"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {video.visibility}
                            </span>
                            <span>{Number(video.viewCount).toLocaleString()} views</span>
                            <span>{video.likeCount} likes</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                    No videos yet. Upload your first video to get started!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
