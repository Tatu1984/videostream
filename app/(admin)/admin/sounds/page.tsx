import { prisma } from "@/lib/db/prisma"
import { Music, Search, Play, Pause, Trash2, Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminSoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const perPage = 10

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { artist: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [sounds, total] = await Promise.all([
    prisma.sound.findMany({
      where,
      include: {
        _count: {
          select: { videos: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.sound.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sound Management</h1>
          <p className="text-gray-600">Manage audio tracks and sounds for shorts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form>
              <input
                type="text"
                name="search"
                placeholder="Search sounds..."
                defaultValue={search}
                className="h-10 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </form>
          </div>
          <button className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 text-sm font-medium text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40">
            <Plus className="h-4 w-4" />
            Add Sound
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-50 p-3">
              <Music className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total Sounds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sounds Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Sound
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Artist
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Used In
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
              {sounds.map((sound) => (
                <tr key={sound.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                        <Music className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{sound.title}</p>
                        <p className="text-sm text-gray-500">
                          Added {new Date(sound.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sound.artist || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {Math.floor(sound.duration / 60)}:{String(sound.duration % 60).padStart(2, "0")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sound._count.videos} videos
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        sound.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {sound.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Play className="h-4 w-4" />
                      </button>
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
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} sounds
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/sounds?page=${page - 1}${search ? `&search=${search}` : ""}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/sounds?page=${page + 1}${search ? `&search=${search}` : ""}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

        {sounds.length === 0 && (
          <div className="py-12 text-center">
            <Music className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No sounds found</p>
          </div>
        )}
      </div>
    </div>
  )
}
