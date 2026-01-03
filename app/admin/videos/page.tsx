import { prisma } from "@/lib/db/prisma"
import { Search, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { VideoActions } from "@/components/admin/VideoActions"

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
          <h1 className="text-2xl font-bold dark:text-white">Videos</h1>
          <p className="text-gray-600 dark:text-gray-400">{total} total videos</p>
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
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] py-2.5 pl-10 pr-4 text-sm focus:border-[#FF6B8A] focus:outline-none focus:ring-1 focus:ring-[#FF6B8A] dark:text-white dark:placeholder-gray-400"
            />
          </form>
        </div>
        <select
          defaultValue={visibility || ""}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-4 py-2 text-sm dark:text-white"
        >
          <option value="">All visibility</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
          <option value="UNLISTED">Unlisted</option>
        </select>
      </div>

      {/* Videos Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#282828]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Video
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Channel
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Visibility
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Views
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Flags
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Uploaded
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-20 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
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
                      <p className="font-medium line-clamp-1 dark:text-white">{video.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {video.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm dark:text-gray-300">{video.channel.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{video.channel.handle}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      video.visibility === "PUBLIC"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : video.visibility === "PRIVATE"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {video.visibility}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm dark:text-gray-300">
                  {formatViews(video.viewCount)}
                </td>
                <td className="px-6 py-4">
                  {video._count.flags > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-800 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {video._count.flags}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(video.createdAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4">
                  <VideoActions videoId={video.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {videos.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No videos found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pageNum - 1) * perPage + 1} to{" "}
            {Math.min(pageNum * perPage, total)} of {total} videos
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`/admin/videos?page=${pageNum - 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-3 py-1.5 text-sm dark:text-white hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors"
              >
                Previous
              </a>
            )}
            {pageNum < totalPages && (
              <a
                href={`/admin/videos?page=${pageNum + 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-3 py-1.5 text-sm dark:text-white hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors"
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
