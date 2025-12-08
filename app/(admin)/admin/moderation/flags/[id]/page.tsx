import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { FlagActions } from "@/components/admin/FlagActions"
import Link from "next/link"

export default async function FlagReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const flag = await prisma.flag.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      video: {
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              handle: true,
              verified: true,
            },
          },
        },
      },
      flaggedComment: {
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
          video: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  })

  if (!flag) {
    notFound()
  }

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    DISMISSED: "bg-gray-100 text-gray-800",
  }

  const reasonLabels: Record<string, string> = {
    SEXUAL_CONTENT: "Sexual Content",
    VIOLENT_CONTENT: "Violent Content",
    HATEFUL_CONTENT: "Hateful Content",
    SPAM: "Spam or Misleading",
    HARMFUL_CONTENT: "Harmful or Dangerous",
    CHILD_SAFETY: "Child Safety",
    MISLEADING: "Misleading Content",
    COPYRIGHT: "Copyright Issue",
    OTHER: "Other",
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Flag Review</h1>
        <p className="mt-1 text-gray-600">ID: {flag.id}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Content */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Flagged Content</h2>

            {flag.targetType === "VIDEO" && flag.video ? (
              <div>
                <div className="flex gap-4">
                  <div className="relative aspect-video w-64 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    {flag.video.thumbnailUrl ? (
                      <img
                        src={flag.video.thumbnailUrl}
                        alt={flag.video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {flag.video.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {flag.video.channel.name}
                    </p>
                    <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                      {flag.video.description}
                    </p>
                    <div className="mt-4">
                      <Button size="sm" variant="outline">
                        Watch Video
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : flag.targetType === "COMMENT" && flag.flaggedComment ? (
              <div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">{flag.flaggedComment.user.name}</span>
                    <span>on</span>
                    <span className="italic">{flag.flaggedComment.video?.title}</span>
                  </div>
                  <p className="text-gray-900">{flag.flaggedComment.content}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Content not found or deleted</p>
            )}
          </Card>

          {/* Flag Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Flag Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Reason</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                    {reasonLabels[flag.reason] || flag.reason}
                  </span>
                </dd>
              </div>
              {flag.comment && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reporter's Comment</dt>
                  <dd className="mt-1 text-gray-900">{flag.comment}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Reported By</dt>
                <dd className="mt-1">
                  <div className="text-gray-900">{flag.reporter.name}</div>
                  <div className="text-sm text-gray-600">@{flag.reporter.username}</div>
                  <div className="text-sm text-gray-600">{flag.reporter.email}</div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Reported At</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(flag.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Review History */}
          {flag.reviewedAt && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Review History</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reviewed At</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(flag.reviewedAt).toLocaleString()}
                  </dd>
                </div>
                {flag.decision && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Decision</dt>
                    <dd className="mt-1 text-gray-900">{flag.decision}</dd>
                  </div>
                )}
                {flag.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-gray-900">{flag.notes}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Status</h2>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusColors[flag.status]}`}>
              {flag.status === "PENDING" && <Clock className="h-4 w-4" />}
              {flag.status === "RESOLVED" && <CheckCircle className="h-4 w-4" />}
              {flag.status === "DISMISSED" && <XCircle className="h-4 w-4" />}
              {flag.status === "UNDER_REVIEW" && <AlertTriangle className="h-4 w-4" />}
              {flag.status.replace("_", " ")}
            </div>
          </Card>

          {/* Flag Actions Component */}
          <FlagActions flagId={flag.id} status={flag.status} />

          {/* Quick Links */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
            <div className="space-y-2">
              {flag.video && (
                <>
                  <Link
                    href={`/admin/videos/${flag.video.id}`}
                    className="block rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    View Video Details
                  </Link>
                  <Link
                    href={`/admin/channels/${flag.video.channel.id}`}
                    className="block rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    View Channel
                  </Link>
                </>
              )}
              <Link
                href="/admin/moderation/flags"
                className="block rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Back to All Flags
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
