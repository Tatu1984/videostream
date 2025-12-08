import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Button } from "@/components/shared/ui/button"
import { Upload, Video, BarChart3, DollarSign } from "lucide-react"

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

  // Get channel stats
  let stats = null
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="mt-1 text-gray-600">Manage your channel and content</p>
        </div>

        {!primaryChannel ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold">Create your channel</h2>
            <p className="mt-2 text-gray-600">
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
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="mt-2 text-3xl font-bold">
                      {stats?.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subscribers</p>
                    <p className="mt-2 text-3xl font-bold">
                      {stats?.subscribers.toLocaleString()}
                    </p>
                  </div>
                  <Video className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Videos</p>
                    <p className="mt-2 text-3xl font-bold">{stats?.totalVideos}</p>
                  </div>
                  <Video className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Likes</p>
                    <p className="mt-2 text-3xl font-bold">
                      {stats?.totalLikes.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/studio/upload">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Upload Video</h3>
                      <p className="text-sm text-gray-600">
                        Upload a new video to your channel
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/videos">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                    <div className="rounded-full bg-green-100 p-3">
                      <Video className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Manage Videos</h3>
                      <p className="text-sm text-gray-600">
                        Edit and manage your uploaded videos
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/studio/analytics">
                  <div className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                    <div className="rounded-full bg-purple-100 p-3">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">View Analytics</h3>
                      <p className="text-sm text-gray-600">
                        Track your channel performance
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Videos */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Videos</h2>
                <Link href="/studio/videos">
                  <Button variant="ghost">View All</Button>
                </Link>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="p-4 text-center text-gray-600">
                  No videos yet. Upload your first video to get started!
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
