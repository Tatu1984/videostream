"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Search, Filter, Edit, Trash2, Eye, EyeOff, Upload, Loader2 } from "lucide-react"

interface Channel {
  id: string
  name: string
  handle: string
}

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  duration: number | null
  visibility: string
  processingStatus: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  channel: {
    id: string
    name: string
    handle: string
  }
}

interface StudioVideosClientProps {
  videos: Video[]
  channels: Channel[]
}

export default function StudioVideosClient({ videos: initialVideos, channels }: StudioVideosClientProps) {
  const router = useRouter()
  const [videos, setVideos] = useState(initialVideos)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  // Filter videos based on search and filters
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = !searchQuery ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = !channelFilter || video.channel.id === channelFilter
    const matchesVisibility = !visibilityFilter || video.visibility === visibilityFilter
    return matchesSearch && matchesChannel && matchesVisibility
  })

  const stats = {
    total: videos.length,
    public: videos.filter((v) => v.visibility === "PUBLIC").length,
    private: videos.filter((v) => v.visibility === "PRIVATE").length,
    unlisted: videos.filter((v) => v.visibility === "UNLISTED").length,
    processing: videos.filter((v) => v.processingStatus === "PROCESSING").length,
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video? This cannot be undone.")) {
      return
    }

    setDeleting(videoId)
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId))
      } else {
        alert("Failed to delete video")
      }
    } catch (err) {
      console.error("Failed to delete video:", err)
      alert("Failed to delete video")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Content</h1>
          <p className="mt-1 text-gray-600">Manage your videos</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4"
              />
            </div>
          </div>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="">All Channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2"
          >
            <option value="">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="UNLISTED">Unlisted</option>
          </select>
        </div>
      </Card>

      {/* Videos Table */}
      {filteredVideos.length > 0 ? (
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
                {filteredVideos.map((video) => (
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
                          <div className="line-clamp-2 font-medium text-gray-900">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(video.id)}
                          disabled={deleting === video.id}
                        >
                          {deleting === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
              {videos.length === 0 ? "No videos yet" : "No videos match your filters"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {videos.length === 0 ? "Upload your first video to get started" : "Try adjusting your filters"}
            </p>
            {videos.length === 0 && (
              <Link href="/studio/upload">
                <Button className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
