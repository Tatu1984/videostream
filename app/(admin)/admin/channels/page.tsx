import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { CheckCircle, Users, Video, Tv, ChevronLeft, ChevronRight, XCircle } from "lucide-react"

const CHANNELS_PER_PAGE = 20

export default async function AdminChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; verified?: string; status?: string }>
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1")
  const search = resolvedParams.search || ""
  const verifiedFilter = resolvedParams.verified || ""
  const statusFilter = resolvedParams.status || ""

  // Build where clause
  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { handle: { contains: search, mode: "insensitive" } },
    ]
  }

  if (verifiedFilter === "true") {
    where.verified = true
  } else if (verifiedFilter === "false") {
    where.verified = false
  }

  if (statusFilter) {
    where.status = statusFilter
  }

  const [channels, totalCount, verifiedCount, totalSubs, totalVideos] = await Promise.all([
    prisma.channel.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            videos: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { subscriberCount: "desc" },
      skip: (page - 1) * CHANNELS_PER_PAGE,
      take: CHANNELS_PER_PAGE,
    }),
    prisma.channel.count({ where }),
    prisma.channel.count({ where: { verified: true } }),
    prisma.channel.aggregate({ _sum: { subscriberCount: true } }),
    prisma.video.count(),
  ])

  const totalPages = Math.ceil(totalCount / CHANNELS_PER_PAGE)

  const stats = {
    total: totalCount,
    verified: verifiedCount,
    totalSubs: totalSubs._sum.subscriberCount || 0,
    totalVideos: totalVideos,
  }

  // Build query string for pagination
  const buildQueryString = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (verifiedFilter) params.set("verified", verifiedFilter)
    if (statusFilter) params.set("status", statusFilter)
    params.set("page", newPage.toString())
    return params.toString()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Channel Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage all platform channels ({totalCount.toLocaleString()} total)
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Channels</p>
              <p className="mt-1 text-2xl font-bold">{stats.total.toLocaleString()}</p>
            </div>
            <Tv className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="mt-1 text-2xl font-bold">{stats.verified.toLocaleString()}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subscribers</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.totalSubs.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Videos</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.totalVideos.toLocaleString()}
              </p>
            </div>
            <Video className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search channels by name or handle..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <select
            name="verified"
            defaultValue={verifiedFilter}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="true">Verified Only</option>
            <option value="false">Not Verified</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Channels Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subscribers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Videos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {channels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No channels found
                  </td>
                </tr>
              ) : (
                channels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0">
                          {channel.avatar ? (
                            <img
                              src={channel.avatar}
                              alt={channel.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-600">
                              {channel.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {channel.name}
                            </div>
                            {channel.verified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{channel.handle}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${channel.owner.id}`} className="hover:underline">
                        <div className="text-sm text-gray-900">
                          {channel.owner.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {channel.owner.email}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {channel.subscriberCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {channel._count.videos}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          channel.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : channel.status === "SUSPENDED"
                            ? "bg-orange-100 text-orange-800"
                            : channel.status === "TERMINATED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {channel.status === "ACTIVE" && <CheckCircle className="h-3 w-3" />}
                        {channel.status === "SUSPENDED" && <XCircle className="h-3 w-3" />}
                        {channel.status === "TERMINATED" && <XCircle className="h-3 w-3" />}
                        {channel.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(channel.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/channels/${channel.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * CHANNELS_PER_PAGE) + 1} to {Math.min(page * CHANNELS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} channels
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/channels?${buildQueryString(page - 1)}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              )}
              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/admin/channels?${buildQueryString(page + 1)}`}>
                  <Button variant="outline" size="sm">
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
