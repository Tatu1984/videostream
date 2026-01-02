import { prisma } from "@/lib/db/prisma"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { Search, Eye, Trash2, Ban } from "lucide-react"

export default async function AdminShortsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string }
}) {
  const search = searchParams.search || ""
  const status = searchParams.status || "all"
  const page = parseInt(searchParams.page || "1")
  const perPage = 20

  const where: any = {
    videoType: "SHORT",
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { channel: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (status !== "all") {
    where.processingStatus = status.toUpperCase()
  }

  const [shorts, total] = await Promise.all([
    prisma.video.findMany({
      where,
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
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.video.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shorts Management</h1>
        <div className="text-sm text-gray-500">{total} total shorts</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            name="search"
            placeholder="Search shorts..."
            defaultValue={search}
            className="pl-10"
          />
        </form>

        <div className="flex gap-2">
          <Link href="/admin/shorts?status=all">
            <Button variant={status === "all" ? "default" : "outline"} size="sm">
              All
            </Button>
          </Link>
          <Link href="/admin/shorts?status=completed">
            <Button variant={status === "completed" ? "default" : "outline"} size="sm">
              Published
            </Button>
          </Link>
          <Link href="/admin/shorts?status=processing">
            <Button variant={status === "processing" ? "default" : "outline"} size="sm">
              Processing
            </Button>
          </Link>
          <Link href="/admin/shorts?status=failed">
            <Button variant={status === "failed" ? "default" : "outline"} size="sm">
              Failed
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {shorts.map((short) => (
          <div
            key={short.id}
            className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800"
          >
            {short.thumbnailUrl ? (
              <img
                src={short.thumbnailUrl}
                alt={short.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                No thumbnail
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium line-clamp-2">{short.title}</p>
                <p className="text-gray-300 text-xs mt-1">@{short.channel.handle}</p>
                <div className="flex items-center gap-1 mt-1 text-gray-300 text-xs">
                  <Eye className="h-3 w-3" />
                  {Number(short.viewCount).toLocaleString()} views
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  short.processingStatus === "COMPLETED"
                    ? "bg-green-500 text-white"
                    : short.processingStatus === "PROCESSING"
                    ? "bg-yellow-500 text-black"
                    : short.processingStatus === "FAILED"
                    ? "bg-red-500 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {short.processingStatus}
              </span>
            </div>

            {/* Visibility badge */}
            <div className="absolute top-2 right-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  short.visibility === "PUBLIC"
                    ? "bg-blue-500 text-white"
                    : short.visibility === "PRIVATE"
                    ? "bg-gray-500 text-white"
                    : "bg-purple-500 text-white"
                }`}
              >
                {short.visibility}
              </span>
            </div>

            {/* Action buttons */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/watch/${short.id}`}>
                <Button size="sm" variant="secondary">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <form action={`/api/admin/videos/${short.id}/delete`} method="POST">
                <Button size="sm" variant="destructive" type="submit">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {shorts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No shorts found
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
              <Link href={`/admin/shorts?page=${page - 1}&status=${status}&search=${search}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/shorts?page=${page + 1}&status=${status}&search=${search}`}>
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
