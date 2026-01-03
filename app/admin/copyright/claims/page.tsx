import { prisma } from "@/lib/db/prisma"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { Search, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default async function AdminCopyrightClaimsPage({
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
      { description: { contains: search, mode: "insensitive" } },
      { video: { title: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const [claims, total] = await Promise.all([
    prisma.copyrightClaim.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            channel: {
              select: {
                id: true,
                name: true,
                handle: true,
              },
            },
          },
        },
        rightsHolder: {
          select: {
            id: true,
            name: true,
            email: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.copyrightClaim.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Copyright Claims</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">{total} total claims</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            name="search"
            placeholder="Search claims..."
            defaultValue={search}
            className="pl-10"
          />
        </form>

        <div className="flex gap-2">
          <Link href="/admin/copyright/claims?status=all">
            <Button variant={status === "all" ? "default" : "outline"} size="sm">
              All
            </Button>
          </Link>
          <Link href="/admin/copyright/claims?status=pending">
            <Button variant={status === "pending" ? "default" : "outline"} size="sm">
              Pending
            </Button>
          </Link>
          <Link href="/admin/copyright/claims?status=upheld">
            <Button variant={status === "upheld" ? "default" : "outline"} size="sm">
              Upheld
            </Button>
          </Link>
          <Link href="/admin/copyright/claims?status=rejected">
            <Button variant={status === "rejected" ? "default" : "outline"} size="sm">
              Rejected
            </Button>
          </Link>
          <Link href="/admin/copyright/claims?status=appealed">
            <Button variant={status === "appealed" ? "default" : "outline"} size="sm">
              Appealed
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#282828]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Video</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Claimant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Created</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-20 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {claim.video.thumbnailUrl ? (
                        <img
                          src={claim.video.thumbnailUrl}
                          alt={claim.video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No thumb
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[200px] dark:text-white">{claim.video.title}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">@{claim.video.channel.handle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {claim.rightsHolder ? (
                    <div>
                      <div className="flex items-center gap-1 dark:text-gray-300">
                        <span>{claim.rightsHolder.name}</span>
                        {claim.rightsHolder.verified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{claim.rightsHolder.email}</div>
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Manual claim</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      claim.claimType === "AUTOMATED"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {claim.claimType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="truncate max-w-[200px] text-gray-600 dark:text-gray-400">
                    {claim.description}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      claim.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : claim.status === "UPHELD"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : claim.status === "REJECTED"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {claim.status === "PENDING" && <AlertTriangle className="h-3 w-3" />}
                    {claim.status === "UPHELD" && <CheckCircle className="h-3 w-3" />}
                    {claim.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                    {claim.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {new Date(claim.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/watch/${claim.video.id}`}>
                      <Button variant="ghost" size="sm" title="View video">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {claim.status === "PENDING" && (
                      <>
                        <form action={`/api/admin/copyright/${claim.id}/uphold`} method="POST">
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            title="Uphold claim"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action={`/api/admin/copyright/${claim.id}/reject`} method="POST">
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            title="Reject claim"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {claims.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No copyright claims found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/copyright/claims?page=${page - 1}&status=${status}&search=${search}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/copyright/claims?page=${page + 1}&status=${status}&search=${search}`}>
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
