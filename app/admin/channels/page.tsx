import { prisma } from "@/lib/db/prisma"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { Search, CheckCircle, XCircle, MoreVertical } from "lucide-react"

export default async function AdminChannelsPage({
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
      { name: { contains: search, mode: "insensitive" } },
      { handle: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const [channels, total] = await Promise.all([
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.channel.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Channel Management</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">{total} total channels</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            name="search"
            placeholder="Search channels..."
            defaultValue={search}
            className="pl-10"
          />
        </form>

        <div className="flex gap-2">
          <Link href="/admin/channels?status=all">
            <Button variant={status === "all" ? "default" : "outline"} size="sm">
              All
            </Button>
          </Link>
          <Link href="/admin/channels?status=active">
            <Button variant={status === "active" ? "default" : "outline"} size="sm">
              Active
            </Button>
          </Link>
          <Link href="/admin/channels?status=suspended">
            <Button variant={status === "suspended" ? "default" : "outline"} size="sm">
              Suspended
            </Button>
          </Link>
          <Link href="/admin/channels?status=terminated">
            <Button variant={status === "terminated" ? "default" : "outline"} size="sm">
              Terminated
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#282828]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Channel</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Videos</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Subscribers</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Verified</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Created</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {channels.map((channel) => (
              <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {channel.avatar ? (
                        <img
                          src={channel.avatar}
                          alt={channel.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium dark:text-gray-400">
                          {channel.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium dark:text-white">{channel.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">@{channel.handle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm dark:text-gray-300">{channel.owner.name || "No name"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{channel.owner.email}</div>
                </td>
                <td className="px-4 py-3 dark:text-gray-300">{channel._count.videos}</td>
                <td className="px-4 py-3 dark:text-gray-300">{channel._count.subscriptions.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      channel.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : channel.status === "SUSPENDED"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {channel.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {channel.verified ? (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {new Date(channel.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <ChannelActions channelId={channel.id} status={channel.status} verified={channel.verified} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {channels.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No channels found</div>
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
              <Link href={`/admin/channels?page=${page - 1}&status=${status}&search=${search}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/channels?page=${page + 1}&status=${status}&search=${search}`}>
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

function ChannelActions({
  channelId,
  status,
  verified,
}: {
  channelId: string
  status: string
  verified: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <form action={`/api/admin/channels/${channelId}/verify`} method="POST">
        <Button type="submit" variant="ghost" size="sm" title={verified ? "Remove verification" : "Verify channel"}>
          {verified ? "Unverify" : "Verify"}
        </Button>
      </form>
      {status === "ACTIVE" ? (
        <form action={`/api/admin/channels/${channelId}/suspend`} method="POST">
          <Button type="submit" variant="ghost" size="sm" className="text-yellow-600">
            Suspend
          </Button>
        </form>
      ) : status === "SUSPENDED" ? (
        <form action={`/api/admin/channels/${channelId}/activate`} method="POST">
          <Button type="submit" variant="ghost" size="sm" className="text-green-600">
            Activate
          </Button>
        </form>
      ) : null}
    </div>
  )
}
