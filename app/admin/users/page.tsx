import { prisma } from "@/lib/db/prisma"
import { UserActions } from "@/components/admin/UserActions"
import { Search, Filter, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const { page = "1", search, status } = await searchParams
  const pageNum = parseInt(page)
  const perPage = 20

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) {
    where.status = status
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            channels: true,
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (pageNum - 1) * perPage,
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">{total} total users</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#282828] dark:text-white transition-colors">
          <Download className="h-4 w-4" />
          Export
        </button>
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
              placeholder="Search users..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] py-2.5 pl-10 pr-4 text-sm focus:border-[#FF6B8A] focus:outline-none focus:ring-1 focus:ring-[#FF6B8A] dark:text-white dark:placeholder-gray-400"
            />
          </form>
        </div>
        <select
          defaultValue={status || ""}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-4 py-2 text-sm dark:text-white"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#282828]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Channels
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Joined
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-medium text-gray-500 dark:text-gray-400">
                          {(user.name || user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">{user.name || "No name"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : user.status === "SUSPENDED"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm dark:text-gray-300">{user.role}</td>
                <td className="px-6 py-4 text-sm dark:text-gray-300">{user._count.channels}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <UserActions userId={user.id} currentStatus={user.status} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No users found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pageNum - 1) * perPage + 1} to{" "}
            {Math.min(pageNum * perPage, total)} of {total} users
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`/admin/users?page=${pageNum - 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-3 py-1.5 text-sm dark:text-white hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors"
              >
                Previous
              </a>
            )}
            {pageNum < totalPages && (
              <a
                href={`/admin/users?page=${pageNum + 1}${search ? `&search=${search}` : ""}`}
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
