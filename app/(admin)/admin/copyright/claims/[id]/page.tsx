import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/shared/ui/card"
import { AlertTriangle, CheckCircle, XCircle, Clock, FileText } from "lucide-react"
import Link from "next/link"
import { CopyrightClaimActions } from "@/components/admin/CopyrightClaimActions"

export default async function CopyrightClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const claim = await prisma.copyrightClaim.findUnique({
    where: { id },
    include: {
      video: {
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              handle: true,
              verified: true,
              ownerId: true,
            },
          },
        },
      },
      rightsHolder: true,
    },
  })

  if (!claim) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    UPHELD: "bg-red-100 text-red-800",
    REJECTED: "bg-green-100 text-green-800",
    APPEALED: "bg-orange-100 text-orange-800",
    COUNTER_NOTICED: "bg-purple-100 text-purple-800",
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Copyright Claim</h1>
          <p className="text-sm text-gray-600">Claim ID: {claim.id}</p>
        </div>
        <Link
          href="/admin/copyright/claims"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Claims
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claimed Video */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Claimed Content</h2>

            {claim.video ? (
              <div className="flex gap-4">
                <div className="relative aspect-video w-64 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                  {claim.video.thumbnailUrl ? (
                    <img
                      src={claim.video.thumbnailUrl}
                      alt={claim.video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      No thumbnail
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{claim.video.title}</h3>
                  <Link
                    href={`/admin/channels/${claim.video.channel.id}`}
                    className="mt-1 text-sm text-blue-600 hover:underline"
                  >
                    {claim.video.channel.name}
                  </Link>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Views: {claim.video.viewCount.toLocaleString()}</p>
                    <p>Published: {new Date(claim.video.publishedAt || claim.video.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/videos/${claim.video.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      View in Admin
                    </Link>
                    <a
                      href={`/watch/${claim.video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Watch Video
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Video not found or deleted</p>
            )}
          </Card>

          {/* Claim Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Claim Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Claim Type</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    claim.claimType === "MANUAL" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {claim.claimType === "MANUAL" ? "Manual Claim" : "Automated Detection"}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-gray-900">{claim.description}</dd>
              </div>

              {claim.timestamps && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timestamps</dt>
                  <dd className="mt-1 text-gray-900">{claim.timestamps}</dd>
                </div>
              )}

              {claim.proof && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Proof/Evidence</dt>
                  <dd className="mt-1 text-gray-900">{claim.proof}</dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Filed At</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(claim.createdAt).toLocaleString()}
                </dd>
              </div>

              {claim.counterNotice && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Counter Notice</dt>
                  <dd className="mt-1 rounded-lg bg-yellow-50 p-3 text-gray-900">
                    {claim.counterNotice}
                    {claim.counterNoticedAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        Filed: {new Date(claim.counterNoticedAt).toLocaleString()}
                      </p>
                    )}
                  </dd>
                </div>
              )}

              {claim.decision && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Decision</dt>
                  <dd className="mt-1 text-gray-900">{claim.decision}</dd>
                </div>
              )}

              {claim.decidedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Decided At</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(claim.decidedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Rights Holder */}
          {claim.rightsHolder && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Rights Holder</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-gray-900">{claim.rightsHolder.name}</dd>
                </div>
                {claim.rightsHolder.companyName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company</dt>
                    <dd className="mt-1 text-gray-900">{claim.rightsHolder.companyName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-gray-900">{claim.rightsHolder.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Verified</dt>
                  <dd className="mt-1">
                    {claim.rightsHolder.verified ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <XCircle className="h-4 w-4" />
                        Not Verified
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
        </div>

        {/* Sidebar - Status & Actions */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Claim Status</h2>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusColors[claim.status] || "bg-gray-100 text-gray-800"}`}>
              {claim.status === "PENDING" && <Clock className="h-4 w-4" />}
              {claim.status === "UPHELD" && <CheckCircle className="h-4 w-4" />}
              {claim.status === "REJECTED" && <XCircle className="h-4 w-4" />}
              {(claim.status === "APPEALED" || claim.status === "COUNTER_NOTICED") && <AlertTriangle className="h-4 w-4" />}
              {claim.status.replace("_", " ")}
            </div>
          </Card>

          {/* Copyright Claim Actions Component */}
          <CopyrightClaimActions claimId={claim.id} status={claim.status} />

          {/* Quick Links */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
            <div className="space-y-2">
              {claim.video && (
                <>
                  <Link
                    href={`/admin/videos/${claim.video.id}`}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" />
                    View Video Details
                  </Link>
                  <Link
                    href={`/admin/channels/${claim.video.channel.id}`}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" />
                    View Channel
                  </Link>
                </>
              )}
              <Link
                href="/admin/copyright/claims"
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                Back to All Claims
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
