import { prisma } from "@/lib/db/prisma"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Shield, Clock, CheckCircle, XCircle, Eye, PlaySquare, AlertTriangle } from "lucide-react"

export default async function CopyrightClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status || ""

  const where = {
    ...(statusFilter && { status: statusFilter as any }),
  }

  const [claims, total, pendingCount, upheldCount, rejectedCount] = await Promise.all([
    prisma.copyrightClaim.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            channel: {
              select: { name: true },
            },
          },
        },
        rightsHolder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.copyrightClaim.count({ where }),
    prisma.copyrightClaim.count({ where: { status: "PENDING" } }),
    prisma.copyrightClaim.count({ where: { status: "UPHELD" } }),
    prisma.copyrightClaim.count({ where: { status: "REJECTED" } }),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Copyright Claims</h1>
          <p className="text-gray-500">Review and manage copyright infringement claims</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900">{total}</p>
              <p className="mt-1 text-sm text-gray-500">Total Claims</p>
            </div>
            <div className="text-[#FF6B8A]">
              <Shield className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#FF6B8A]" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-orange-600">{pendingCount}</p>
              <p className="mt-1 text-sm text-gray-500">Pending Review</p>
            </div>
            <div className="text-orange-500">
              <Clock className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${total > 0 ? (pendingCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-red-600">{upheldCount}</p>
              <p className="mt-1 text-sm text-gray-500">Upheld</p>
            </div>
            <div className="text-red-500">
              <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${total > 0 ? (upheldCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-green-600">{rejectedCount}</p>
              <p className="mt-1 text-sm text-gray-500">Rejected</p>
            </div>
            <div className="text-green-500">
              <CheckCircle className="h-8 w-8" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${total > 0 ? (rejectedCount / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Link
          href="/admin/copyright/claims"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            !statusFilter ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/copyright/claims?status=PENDING"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            statusFilter === "PENDING" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending
        </Link>
        <Link
          href="/admin/copyright/claims?status=UPHELD"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            statusFilter === "UPHELD" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Upheld
        </Link>
        <Link
          href="/admin/copyright/claims?status=REJECTED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            statusFilter === "REJECTED" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Rejected
        </Link>
        <Link
          href="/admin/copyright/claims?status=APPEALED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            statusFilter === "APPEALED" ? "bg-[#FF6B8A] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Appealed
        </Link>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="rounded-lg border border-gray-100 bg-white p-6"
          >
            <div className="flex gap-4">
              {/* Video Thumbnail */}
              <div className="h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {claim.video.thumbnailUrl ? (
                  <img
                    src={claim.video.thumbnailUrl}
                    alt={claim.video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <PlaySquare className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Claim Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          claim.status === "PENDING"
                            ? "bg-orange-50 text-orange-700"
                            : claim.status === "UPHELD"
                            ? "bg-red-50 text-red-700"
                            : claim.status === "REJECTED"
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {claim.status}
                      </span>
                      <span className="text-sm text-gray-500">{claim.claimType}</span>
                    </div>

                    <h3 className="mt-2 font-semibold text-gray-900">
                      {claim.video.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Channel: {claim.video.channel?.name || "Unknown"}
                    </p>

                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {claim.description}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {claim.rightsHolder && (
                        <>
                          <span>Claimant: <span className="font-medium text-gray-700">{claim.rightsHolder.name}</span></span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {claim.counterNotice && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3">
                        <p className="text-sm font-medium text-blue-900">Counter Notice Filed</p>
                        <p className="mt-1 text-sm text-blue-700">{claim.counterNotice}</p>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/admin/copyright/claims/${claim.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#FF6B8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#e85a79]"
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {claims.length === 0 && (
          <div className="rounded-lg border border-gray-100 bg-white py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No copyright claims found</p>
          </div>
        )}
      </div>
    </div>
  )
}
