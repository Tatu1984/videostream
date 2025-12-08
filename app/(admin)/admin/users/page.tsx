import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { UserCheck, UserX, Shield, Users, ChevronLeft, ChevronRight } from "lucide-react"

const USERS_PER_PAGE = 20

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; role?: string; status?: string }>
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1")
  const search = resolvedParams.search || ""
  const roleFilter = resolvedParams.role || ""
  const statusFilter = resolvedParams.status || ""

  // Build where clause
  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ]
  }

  if (roleFilter) {
    where.role = roleFilter
  }

  if (statusFilter) {
    where.status = statusFilter
  }

  const [users, totalCount, stats] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            channels: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(totalCount / USERS_PER_PAGE)

  // Calculate stats
  const roleStats = {
    total: totalCount,
    admins: stats.find(s => s.role === "ADMIN")?._count || 0,
    creators: stats.find(s => s.role === "CREATOR")?._count || 0,
    users: stats.find(s => s.role === "USER")?._count || 0,
  }

  // Build query string for pagination
  const buildQueryString = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (roleFilter) params.set("role", roleFilter)
    if (statusFilter) params.set("status", statusFilter)
    params.set("page", newPage.toString())
    return params.toString()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage all platform users ({totalCount.toLocaleString()} total)
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="mt-1 text-2xl font-bold">{roleStats.total.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Creators</p>
              <p className="mt-1 text-2xl font-bold">{roleStats.creators.toLocaleString()}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="mt-1 text-2xl font-bold">{roleStats.admins}</p>
            </div>
            <Shield className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regular Users</p>
              <p className="mt-1 text-2xl font-bold">{roleStats.users.toLocaleString()}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
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
              placeholder="Search users by name, email, or username..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <select
            name="role"
            defaultValue={roleFilter}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="CREATOR">Creator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Channels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || "User"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                              {user.name?.[0] || user.email?.[0] || "?"}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {user.name || "Unnamed"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.username && (
                            <div className="text-xs text-gray-400">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "CREATOR"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : user.status === "SUSPENDED"
                            ? "bg-orange-100 text-orange-800"
                            : user.status === "BANNED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status === "ACTIVE" && <UserCheck className="h-3 w-3" />}
                        {user.status === "SUSPENDED" && <UserX className="h-3 w-3" />}
                        {user.status === "BANNED" && <UserX className="h-3 w-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user._count.channels}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user._count.comments}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${user.id}`}>
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
              Showing {((page - 1) * USERS_PER_PAGE) + 1} to {Math.min(page * USERS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} users
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/users?${buildQueryString(page - 1)}`}>
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
                <Link href={`/admin/users?${buildQueryString(page + 1)}`}>
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
