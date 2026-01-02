import { prisma } from "@/lib/db/prisma"
import { Search, Filter, Eye, Trash2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

function formatViews(views: bigint): string {
  const num = Number(views)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; visibility?: string }>
}) {
  const { page = "1", search, visibility } = await searchParams
  const pageNum = parseInt(page)
  const perPage = 20

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

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        channel: {
          select: { name: true, handle: true },
        },
        _count: {
          select: { flags: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (pageNum - 1) * perPage,
    }),
    prisma.video.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-gray-600">{total} total videos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <form>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search videos..."
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none"
            />
          </form>
        </div>
        <select
          defaultValue={visibility || ""}
          className="rounded-lg border bg-white px-4 py-2 text-sm"
        >
          <option value="">All visibility</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
          <option value="UNLISTED">Unlisted</option>
        </select>
      </div>

      {/* Videos Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Video
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Visibility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Uploaded
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
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
                    <div className="max-w-xs">
                      <p className="font-medium line-clamp-1">{video.title}</p>
                      <p className="text-xs text-gray-500">ID: {video.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm">{video.channel.name}</p>
                  <p className="text-xs text-gray-500">@{video.channel.handle}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      video.visibility === "PUBLIC"
                        ? "bg-green-100 text-green-800"
                        : video.visibility === "PRIVATE"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {video.visibility}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {formatViews(video.viewCount)}
                </td>
                <td className="px-6 py-4">
                  {video._count.flags > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                      <AlertTriangle className="h-3 w-3" />
                      {video._count.flags}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(video.createdAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/watch/${video.id}`}
                      target="_blank"
                      className="rounded-lg p-2 hover:bg-gray-100"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {videos.length === 0 && (
          <div className="py-12 text-center text-gray-500">No videos found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pageNum - 1) * perPage + 1} to{" "}
            {Math.min(pageNum * perPage, total)} of {total} videos
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`/admin/videos?page=${pageNum - 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            {pageNum < totalPages && (
              <a
                href={`/admin/videos?page=${pageNum + 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
