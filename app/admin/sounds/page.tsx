import { prisma } from "@/lib/db/prisma"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { Search, Music, Play, Trash2, Plus } from "lucide-react"

export default async function AdminSoundsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string }
}) {
  const search = searchParams.search || ""
  const status = searchParams.status || "all"
  const page = parseInt(searchParams.page || "1")
  const perPage = 20

  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { artist: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status === "active") {
    where.isActive = true
  } else if (status === "inactive") {
    where.isActive = false
  } else if (status === "original") {
    where.isOriginal = true
  }

  const [sounds, total] = await Promise.all([
    prisma.sound.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.sound.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sound Library</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">{total} total sounds</div>
          <Link href="/admin/sounds/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Sound
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            name="search"
            placeholder="Search sounds..."
            defaultValue={search}
            className="pl-10"
          />
        </form>

        <div className="flex gap-2">
          <Link href="/admin/sounds?status=all">
            <Button variant={status === "all" ? "default" : "outline"} size="sm">
              All
            </Button>
          </Link>
          <Link href="/admin/sounds?status=active">
            <Button variant={status === "active" ? "default" : "outline"} size="sm">
              Active
            </Button>
          </Link>
          <Link href="/admin/sounds?status=inactive">
            <Button variant={status === "inactive" ? "default" : "outline"} size="sm">
              Inactive
            </Button>
          </Link>
          <Link href="/admin/sounds?status=original">
            <Button variant={status === "original" ? "default" : "outline"} size="sm">
              Original
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Sound</th>
              <th className="px-4 py-3 text-left font-medium">Artist</th>
              <th className="px-4 py-3 text-left font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Usage</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sounds.map((sound) => (
              <tr key={sound.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {sound.coverUrl ? (
                        <img
                          src={sound.coverUrl}
                          alt={sound.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{sound.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{sound.artist || "Unknown"}</td>
                <td className="px-4 py-3">{formatDuration(sound.duration)}</td>
                <td className="px-4 py-3">{sound.usageCount.toLocaleString()} videos</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      sound.isOriginal
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {sound.isOriginal ? "Original" : "Library"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      sound.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                  >
                    {sound.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(sound.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="Preview">
                      <Play className="h-4 w-4" />
                    </Button>
                    <form action={`/api/admin/sounds/${sound.id}/toggle`} method="POST">
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className={sound.isActive ? "text-yellow-600" : "text-green-600"}
                      >
                        {sound.isActive ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={`/api/admin/sounds/${sound.id}/delete`} method="POST">
                      <Button type="submit" variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sounds.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No sounds found
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/sounds?page=${page - 1}&status=${status}&search=${search}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/sounds?page=${page + 1}&status=${status}&search=${search}`}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
