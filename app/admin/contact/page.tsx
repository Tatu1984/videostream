import { prisma } from "@/lib/db/prisma"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { Search, Mail, MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react"

export default async function AdminContactPage({
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
      { email: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contactSubmission.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contact Submissions</h1>
        <div className="text-sm text-gray-500">{total} total submissions</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            name="search"
            placeholder="Search submissions..."
            defaultValue={search}
            className="pl-10"
          />
        </form>

        <div className="flex gap-2">
          <Link href="/admin/contact?status=all">
            <Button variant={status === "all" ? "default" : "outline"} size="sm">
              All
            </Button>
          </Link>
          <Link href="/admin/contact?status=pending">
            <Button variant={status === "pending" ? "default" : "outline"} size="sm">
              Pending
            </Button>
          </Link>
          <Link href="/admin/contact?status=in_progress">
            <Button variant={status === "in_progress" ? "default" : "outline"} size="sm">
              In Progress
            </Button>
          </Link>
          <Link href="/admin/contact?status=resolved">
            <Button variant={status === "resolved" ? "default" : "outline"} size="sm">
              Resolved
            </Button>
          </Link>
          <Link href="/admin/contact?status=closed">
            <Button variant={status === "closed" ? "default" : "outline"} size="sm">
              Closed
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Subject</th>
              <th className="px-4 py-3 text-left font-medium">Message</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Assigned To</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium">{submission.name}</div>
                      <div className="text-gray-500 text-xs">{submission.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium truncate max-w-[200px]">{submission.subject}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="truncate max-w-[250px] text-gray-600 dark:text-gray-400">
                    {submission.message}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      submission.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : submission.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : submission.status === "RESOLVED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                  >
                    {submission.status === "PENDING" && <Clock className="h-3 w-3" />}
                    {submission.status === "IN_PROGRESS" && <MessageSquare className="h-3 w-3" />}
                    {submission.status === "RESOLVED" && <CheckCircle className="h-3 w-3" />}
                    {submission.status === "CLOSED" && <XCircle className="h-3 w-3" />}
                    {submission.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {submission.assignedTo || "-"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <ContactActions submission={submission} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No contact submissions found
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
              <Link href={`/admin/contact?page=${page - 1}&status=${status}&search=${search}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/contact?page=${page + 1}&status=${status}&search=${search}`}>
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

function ContactActions({ submission }: { submission: any }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/contact/${submission.id}`}>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </Link>
      {submission.status === "PENDING" && (
        <form action={`/api/admin/contact/${submission.id}/claim`} method="POST">
          <Button type="submit" variant="ghost" size="sm" className="text-blue-600">
            Claim
          </Button>
        </form>
      )}
      {submission.status === "IN_PROGRESS" && (
        <form action={`/api/admin/contact/${submission.id}/resolve`} method="POST">
          <Button type="submit" variant="ghost" size="sm" className="text-green-600">
            Resolve
          </Button>
        </form>
      )}
    </div>
  )
}
