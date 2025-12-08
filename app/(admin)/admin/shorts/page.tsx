import { prisma } from "@/lib/db/prisma"
import { Film, Search, Eye, Trash2, MoreVertical } from "lucide-react"
import Link from "next/link"

export default async function AdminShortsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const perPage = 10

  const where = {
    videoType: "SHORT" as const,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { channel: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [shorts, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        channel: {
          select: { id: true, name: true, handle: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shorts Management</h1>
          <p className="text-gray-600">Manage all short-form videos on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form>
              <input
                type="text"
                name="search"
                placeholder="Search shorts..."
                defaultValue={search}
                className="h-10 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-50 p-3">
              <Film className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total Shorts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shorts Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Short
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Channel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Views
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Likes
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shorts.map((short) => (
                <tr key={short.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {short.thumbnailUrl && (
                          <img
                            src={short.thumbnailUrl}
                            alt={short.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{short.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(short.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/channels/${short.channel.id}`}
                      className="text-sm font-medium text-pink-600 hover:text-pink-700"
                    >
                      {short.channel.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {Number(short.viewCount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {short.likeCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        short.processingStatus === "COMPLETED"
                          ? "bg-green-50 text-green-700"
                          : short.processingStatus === "PROCESSING"
                          ? "bg-yellow-50 text-yellow-700"
                          : short.processingStatus === "FAILED"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {short.processingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/videos/${short.id}`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} shorts
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/shorts?page=${page - 1}${search ? `&search=${search}` : ""}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/shorts?page=${page + 1}${search ? `&search=${search}` : ""}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

        {shorts.length === 0 && (
          <div className="py-12 text-center">
            <Film className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No shorts found</p>
          </div>
        )}
      </div>
    </div>
  )
}
