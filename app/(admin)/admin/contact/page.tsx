import { prisma } from "@/lib/db/prisma"
import { MessageSquare, Search, Mail, Clock, CheckCircle, XCircle, Eye } from "lucide-react"
import Link from "next/link"
import { ContactStatus } from "@prisma/client"

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const statusFilter = params.status as ContactStatus | undefined
  const perPage = 10

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { subject: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(statusFilter && { status: statusFilter }),
  }

  const [contacts, total, pendingCount, resolvedCount] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contactSubmission.count({ where }),
    prisma.contactSubmission.count({ where: { status: "PENDING" } }),
    prisma.contactSubmission.count({ where: { status: "RESOLVED" } }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600">Manage user inquiries and support requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form>
              <input
                type="text"
                name="search"
                placeholder="Search messages..."
                defaultValue={search}
                className="h-10 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </form>
          </div>
          <select
            defaultValue={statusFilter}
            className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm focus:border-pink-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-50 p-3">
              <MessageSquare className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  From
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
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
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="truncate text-sm text-gray-900 max-w-xs">{contact.subject}</p>
                    <p className="truncate text-sm text-gray-500 max-w-xs">{contact.message}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        contact.status === "RESOLVED"
                          ? "bg-green-50 text-green-700"
                          : contact.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {contact.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-pink-50 hover:text-pink-600">
                        <Mail className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600">
                        <CheckCircle className="h-4 w-4" />
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
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} messages
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/contact?page=${page - 1}${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/contact?page=${page + 1}${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

        {contacts.length === 0 && (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No messages found</p>
          </div>
        )}
      </div>
    </div>
  )
}
