import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import {
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Flag,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
} from "lucide-react"

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ""
  const visibility = resolvedParams.visibility || ""
  const videoType = resolvedParams.videoType || ""
  const page = parseInt(resolvedParams.page || "1")
  const limit = 20

  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  if (visibility) {
    where.visibility = visibility
  }

  if (videoType) {
    where.videoType = videoType
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            verified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            flags: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  const visibilityColors: Record<string, string> = {
    PUBLIC: "bg-green-100 text-green-800",
    PRIVATE: "bg-gray-100 text-gray-800",
    UNLISTED: "bg-yellow-100 text-yellow-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
  }

  const typeColors: Record<string, string> = {
    STANDARD: "bg-gray-100 text-gray-800",
    SHORT: "bg-purple-100 text-purple-800",
    LIVE: "bg-red-100 text-red-800",
    PREMIERE: "bg-blue-100 text-blue-800",
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
          <p className="text-sm text-gray-600">
            Manage and moderate all platform videos
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {total.toLocaleString()} total videos
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <form className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="search"
              placeholder="Search videos..."
              defaultValue={search}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <select
            name="visibility"
            defaultValue={visibility}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="UNLISTED">Unlisted</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>

          <select
            name="videoType"
            defaultValue={videoType}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="STANDARD">Standard</option>
            <option value="SHORT">Short</option>
            <option value="LIVE">Live</option>
            <option value="PREMIERE">Premiere</option>
          </select>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* Videos Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Video
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Visibility
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Stats
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Flags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Video className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        {video.ageRestricted && (
                          <span className="absolute bottom-0 right-0 bg-red-600 px-1 text-[10px] font-bold text-white">
                            18+
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 max-w-[200px]">
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, "0")}` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/channels/${video.channel.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {video.channel.name}
                    </Link>
                    <p className="text-xs text-gray-500">@{video.channel.handle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[video.videoType]}`}>
                      {video.videoType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${visibilityColors[video.visibility]}`}>
                      {video.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.viewCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {video.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {video._count.comments}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {video._count.flags > 0 ? (
                      <span className="flex items-center gap-1 text-sm text-red-600">
                        <Flag className="h-4 w-4" />
                        {video._count.flags}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/videos/${video.id}`}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Link>
                      <a
                        href={`/watch/${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} videos
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/videos?page=${page - 1}&search=${search}&visibility=${visibility}&videoType=${videoType}`}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/videos?page=${page + 1}&search=${search}&visibility=${visibility}&videoType=${videoType}`}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
