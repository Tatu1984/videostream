import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Search, Filter, Edit, Trash2, Eye, EyeOff, Upload } from "lucide-react"

export default async function StudioVideosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's channels
  const channels = await prisma.channel.findMany({
    where: { ownerId: session.user.id },
  })

  if (channels.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            No channel found
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Create a channel to upload videos
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
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          handle: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = {
    total: videos.length,
    public: videos.filter((v) => v.visibility === "PUBLIC").length,
    private: videos.filter((v) => v.visibility === "PRIVATE").length,
    unlisted: videos.filter((v) => v.visibility === "UNLISTED").length,
    processing: videos.filter((v) => v.processingStatus === "PROCESSING").length,
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Content</h1>
          <p className="mt-1 text-gray-600">
            Manage your videos
          </p>
        </div>
        <Link href="/studio/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Videos</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Public</p>
          <p className="mt-1 text-2xl font-bold">{stats.public}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Private</p>
          <p className="mt-1 text-2xl font-bold">{stats.private}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Unlisted</p>
          <p className="mt-1 text-2xl font-bold">{stats.unlisted}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Processing</p>
          <p className="mt-1 text-2xl font-bold">{stats.processing}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your videos..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4"
              />
            </div>
          </div>
          <select className="rounded-md border border-gray-300 px-4 py-2">
            <option value="">All Channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-gray-300 px-4 py-2">
            <option value="">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="UNLISTED">Unlisted</option>
          </select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Videos Table */}
      {videos.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              No thumbnail
                            </div>
                          )}
                          {video.duration && (
                            <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs text-white">
                              {Math.floor(video.duration / 60)}:
                              {String(video.duration % 60).padStart(2, "0")}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 line-clamp-2">
                            {video.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {video.channel.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          video.visibility === "PUBLIC"
                            ? "bg-green-100 text-green-800"
                            : video.visibility === "UNLISTED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {video.visibility === "PUBLIC" ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {video.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          video.processingStatus === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : video.processingStatus === "PROCESSING"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {video.processingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {video.viewCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {video.likeCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {video.commentCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/studio/videos/${video.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No videos yet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Upload your first video to get started
            </p>
            <Link href="/studio/upload">
              <Button className="mt-4">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
