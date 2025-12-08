import { prisma } from "@/lib/db/prisma"
import { HelpCircle, Search, Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react"

export default async function AdminFAQPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1")
  const search = params.search || ""
  const perPage = 10

  const where = {
    ...(search && {
      OR: [
        { question: { contains: search, mode: "insensitive" as const } },
        { answer: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [faqs, total] = await Promise.all([
    prisma.fAQ.findMany({
      where,
      orderBy: { order: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.fAQ.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <form>
              <input
                type="text"
                name="search"
                placeholder="Search FAQs..."
                defaultValue={search}
                className="h-10 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </form>
          </div>
          <button className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 text-sm font-medium text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40">
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-50 p-3">
              <HelpCircle className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total FAQs</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={faq.id}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-sm font-semibold text-pink-600">
                    {(page - 1) * perPage + index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                </div>
                <p className="mt-3 text-gray-600 pl-11">{faq.answer}</p>
                <div className="mt-3 flex items-center gap-4 pl-11">
                  <span className="text-xs text-gray-400">
                    Category: <span className="font-medium text-gray-600">{faq.category}</span>
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      faq.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {faq.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-gray-400 hover:bg-pink-50 hover:text-pink-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {faqs.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No FAQs found</p>
          <button className="mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white">
            Add your first FAQ
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} FAQs
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a
                href={`/admin/faq?page=${page - 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/faq?page=${page + 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
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
