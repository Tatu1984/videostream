import { prisma } from "@/lib/db/prisma"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Flag, AlertTriangle, CheckCircle, Clock, Eye, Video, MessageSquare } from "lucide-react"

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status || ""
  const typeFilter = params.type || ""

  const where = {
    ...(statusFilter && { status: statusFilter as any }),
    ...(typeFilter && { targetType: typeFilter as any }),
  }

  const [flags, total, pendingCount, reviewingCount, resolvedCount] = await Promise.all([
    prisma.flag.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            trustScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.flag.count({ where }),
    prisma.flag.count({ where: { status: "PENDING" } }),
    prisma.flag.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.flag.count({ where: { status: "RESOLVED" } }),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flagged Content</h1>
          <p className="text-gray-500">Review and moderate reported content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900">{total}</p>
              <p className="mt-1 text-sm text-gray-500">Total Reports</p>
            </div>
            <div className="text-[#FF6B8A]">
              <Flag className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#FF6B8A]" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-red-600">{pendingCount}</p>
              <p className="mt-1 text-sm text-gray-500">Pending</p>
            </div>
            <div className="text-red-500">
              <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${total > 0 ? (pendingCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-yellow-600">{reviewingCount}</p>
              <p className="mt-1 text-sm text-gray-500">Under Review</p>
            </div>
            <div className="text-yellow-500">
              <Clock className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-yellow-500" style={{ width: `${total > 0 ? (reviewingCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-green-600">{resolvedCount}</p>
              <p className="mt-1 text-sm text-gray-500">Resolved</p>
            </div>
            <div className="text-green-500">
              <CheckCircle className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${total > 0 ? (resolvedCount / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Link
          href="/admin/moderation/flags"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            !statusFilter ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/moderation/flags?status=PENDING"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            statusFilter === "PENDING" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending
        </Link>
        <Link
          href="/admin/moderation/flags?status=UNDER_REVIEW"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            statusFilter === "UNDER_REVIEW" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Under Review
        </Link>
        <Link
          href="/admin/moderation/flags?type=VIDEO"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            typeFilter === "VIDEO" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Videos
        </Link>
        <Link
          href="/admin/moderation/flags?type=COMMENT"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            typeFilter === "COMMENT" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Comments
        </Link>
      </div>

      {/* Flags Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Report
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reporter
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flags.map((flag) => (
                <tr key={flag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                        {flag.targetType === "VIDEO" ? (
                          <Video className="h-5 w-5 text-red-500" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">
                          {flag.targetId}
                        </p>
                        {flag.comment && (
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">
                            {flag.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {flag.targetType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {flag.reason.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {flag.reporter.image ? (
                        <img
                          src={flag.reporter.image}
                          alt={flag.reporter.name || ""}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B8A] text-sm font-medium text-white">
                          {flag.reporter.name?.[0] || "U"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{flag.reporter.name}</p>
                        <p className="text-xs text-gray-500">Trust: {flag.reporter.trustScore}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        flag.status === "PENDING"
                          ? "bg-red-50 text-red-700"
                          : flag.status === "UNDER_REVIEW"
                          ? "bg-yellow-50 text-yellow-700"
                          : flag.status === "RESOLVED"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {flag.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/moderation/flags/${flag.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#FF6B8A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#e85a79]"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {flags.length === 0 && (
          <div className="py-12 text-center">
            <Flag className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No flagged content found</p>
          </div>
        )}
      </div>
    </div>
  )
}
