import { prisma } from "@/lib/db/prisma"
import { FlagActions } from "@/components/admin/FlagActions"
import { Search, Filter } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function AdminFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; reason?: string }>
}) {
  const { page = "1", status, reason } = await searchParams
  const pageNum = parseInt(page)
  const perPage = 20

  const where: any = {}
  if (status) {
    where.status = status
  }
  if (reason) {
    where.reason = reason
  }

  const [flags, total] = await Promise.all([
    prisma.flag.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        video: {
          select: { id: true, title: true, thumbnailUrl: true },
        },
        flaggedComment: {
          select: { id: true, content: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (pageNum - 1) * perPage,
    }),
    prisma.flag.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    UNDER_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    DISMISSED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  }

  const reasonColors: Record<string, string> = {
    SEXUAL_CONTENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    VIOLENT_CONTENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    HATEFUL_CONTENT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    SPAM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    MISLEADING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    COPYRIGHT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    HARASSMENT: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Content Flags</h1>
          <p className="text-gray-600 dark:text-gray-400">{total} total flags</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          defaultValue={status || ""}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-4 py-2 text-sm dark:text-white"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <select
          defaultValue={reason || ""}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-4 py-2 text-sm dark:text-white"
        >
          <option value="">All reasons</option>
          <option value="SEXUAL_CONTENT">Sexual Content</option>
          <option value="VIOLENT_CONTENT">Violent Content</option>
          <option value="HATEFUL_CONTENT">Hateful Content</option>
          <option value="SPAM">Spam</option>
          <option value="MISLEADING">Misleading</option>
          <option value="COPYRIGHT">Copyright</option>
          <option value="HARASSMENT">Harassment</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {flags.map((flag) => (
          <div key={flag.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      reasonColors[flag.reason] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {flag.reason.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusColors[flag.status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {flag.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {flag.targetType}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Reported by{" "}
                  <span className="font-medium dark:text-gray-300">
                    {flag.reporter.name || flag.reporter.email}
                  </span>{" "}
                  {formatDistanceToNow(new Date(flag.createdAt), {
                    addSuffix: true,
                  })}
                </p>

                {flag.comment && (
                  <p className="mt-2 rounded-lg bg-gray-50 dark:bg-[#282828] p-3 text-sm dark:text-gray-300">
                    &quot;{flag.comment}&quot;
                  </p>
                )}

                {/* Flagged Content */}
                <div className="mt-4">
                  {flag.video && (
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-28 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                        {flag.video.thumbnailUrl ? (
                          <img
                            src={flag.video.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No thumb
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{flag.video.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Video ID: {flag.video.id}
                        </p>
                      </div>
                    </div>
                  )}

                  {flag.flaggedComment && (
                    <div className="rounded-lg bg-gray-50 dark:bg-[#282828] p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Comment:</p>
                      <p className="mt-1 text-sm dark:text-gray-300">
                        {flag.flaggedComment.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <FlagActions flagId={flag.id} status={flag.status} />
            </div>

            {flag.reviewedAt && (
              <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium dark:text-gray-300">Reviewed:</span>{" "}
                  {formatDistanceToNow(new Date(flag.reviewedAt), {
                    addSuffix: true,
                  })}
                </p>
                {flag.decision && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium dark:text-gray-300">Decision:</span>{" "}
                    {flag.decision}
                  </p>
                )}
                {flag.notes && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{flag.notes}</p>
                )}
              </div>
            )}
          </div>
        ))}

        {flags.length === 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] py-12 text-center text-gray-500 dark:text-gray-400">
            No flags found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pageNum - 1) * perPage + 1} to{" "}
            {Math.min(pageNum * perPage, total)} of {total} flags
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`/admin/flags?page=${pageNum - 1}${status ? `&status=${status}` : ""}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-3 py-1.5 text-sm dark:text-white hover:bg-gray-50 dark:hover:bg-[#282828] transition-colors"
              >
                Previous
              </a>
            )}
            {pageNum < totalPages && (
              <a
                href={`/admin/flags?page=${pageNum + 1}${status ? `&status=${status}` : ""}`}
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
