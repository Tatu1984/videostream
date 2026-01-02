import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"
import { AlertTriangle, CheckCircle, XCircle, FileText, Shield } from "lucide-react"

export default async function StudioPoliciesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's channels
  const channels = await prisma.channel.findMany({
    where: { ownerId: session.user.id },
  })

  if (channels.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">No channel found</p>
          <p className="mt-1 text-sm text-gray-600">
            Create a channel to view policy information
          </p>
        </div>
      </div>
    )
  }

  const channelIds = channels.map((c) => c.id)

  // Get all videos from user's channels
  const videos = await prisma.video.findMany({
    where: {
      channelId: { in: channelIds },
    },
    select: {
      id: true,
    },
  })

  const videoIds = videos.map((v) => v.id)

  // Get flags on user's videos
  const flags = await prisma.flag.findMany({
    where: {
      OR: [
        { videoId: { in: videoIds } },
        {
          flaggedComment: {
            video: {
              channelId: { in: channelIds },
            },
          },
        },
      ],
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
        },
      },
      flaggedComment: {
        include: {
          video: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get copyright claims on user's videos
  const copyrightClaims = await prisma.copyrightClaim.findMany({
    where: {
      video: {
        channelId: { in: channelIds },
      },
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
        },
      },
      rightsHolder: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get strikes (mock data since we don't have actual strikes)
  const strikes = await prisma.strike.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = {
    pendingFlags: flags.filter((f) => f.status === "PENDING").length,
    resolvedFlags: flags.filter((f) => f.status === "RESOLVED").length,
    pendingClaims: copyrightClaims.filter((c) => c.status === "PENDING").length,
    upheldClaims: copyrightClaims.filter((c) => c.status === "UPHELD").length,
    activeStrikes: strikes.filter((s) => s.active).length,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Policy & Copyright Center</h1>
        <p className="mt-1 text-gray-600">
          Manage flags, strikes, and copyright claims
        </p>
      </div>

      {/* Channel Status Overview */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Channel Status</h2>
            <p className="mt-1 text-sm text-gray-600">{channels[0].name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Good Standing</span>
          </div>
        </div>

        {stats.activeStrikes > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  You have {stats.activeStrikes} active strike{stats.activeStrikes > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-sm text-red-700">
                  3 strikes will result in channel termination. Learn more about our policies.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Flags</p>
              <p className="mt-1 text-2xl font-bold">{stats.pendingFlags}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Copyright Claims</p>
              <p className="mt-1 text-2xl font-bold">{stats.pendingClaims}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Strikes</p>
              <p className="mt-1 text-2xl font-bold">{stats.activeStrikes}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved Issues</p>
              <p className="mt-1 text-2xl font-bold">{stats.resolvedFlags}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Flagged Content */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Flagged Content</h2>
          <Link href="/help/community-guidelines">
            <Button variant="outline" size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Community Guidelines
            </Button>
          </Link>
        </div>

        {flags.length > 0 ? (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                {flag.video && (
                  <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                    {flag.video.thumbnailUrl && (
                      <img
                        src={flag.video.thumbnailUrl}
                        alt={flag.video.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        flag.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : flag.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {flag.status}
                    </span>
                    <span className="text-xs text-gray-500">{flag.targetType}</span>
                  </div>
                  <h3 className="mt-1 font-medium text-gray-900">
                    {flag.video?.title || "Comment flagged"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Reason: {flag.reason.replace(/_/g, " ")}
                  </p>
                  {flag.decision && (
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">Decision:</span> {flag.decision}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Reported {new Date(flag.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-2 font-medium text-gray-900">No flags</p>
            <p className="mt-1 text-sm text-gray-600">
              Your content is in good standing
            </p>
          </div>
        )}
      </Card>

      {/* Copyright Claims */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Copyright Claims</h2>
          <Link href="/help/copyright">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Copyright Help
            </Button>
          </Link>
        </div>

        {copyrightClaims.length > 0 ? (
          <div className="space-y-3">
            {copyrightClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                  {claim.video.thumbnailUrl && (
                    <img
                      src={claim.video.thumbnailUrl}
                      alt={claim.video.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        claim.status === "PENDING"
                          ? "bg-orange-100 text-orange-800"
                          : claim.status === "UPHELD"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {claim.status}
                    </span>
                    <span className="text-xs text-gray-500">{claim.claimType}</span>
                  </div>
                  <h3 className="mt-1 font-medium text-gray-900">{claim.video.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Claimant: {claim.rightsHolder?.name || "Unknown"}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{claim.description}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Filed {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    {claim.status === "PENDING" ? "Respond" : "View Details"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-2 font-medium text-gray-900">No copyright claims</p>
            <p className="mt-1 text-sm text-gray-600">
              You don't have any active copyright claims
            </p>
          </div>
        )}
      </Card>

      {/* Educational Resources */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Educational Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/help/community-guidelines"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <Shield className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-medium text-gray-900">Community Guidelines</h3>
            <p className="mt-1 text-sm text-gray-600">
              Learn what content is allowed on the platform
            </p>
          </Link>

          <Link
            href="/help/copyright"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <FileText className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-medium text-gray-900">Copyright Basics</h3>
            <p className="mt-1 text-sm text-gray-600">
              Understand copyright and fair use
            </p>
          </Link>

          <Link
            href="/help/strikes"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <AlertTriangle className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-medium text-gray-900">Strike System</h3>
            <p className="mt-1 text-sm text-gray-600">
              How the strike system works and what happens
            </p>
          </Link>

          <Link
            href="/help/appeals"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-medium text-gray-900">Appeals Process</h3>
            <p className="mt-1 text-sm text-gray-600">
              How to appeal strikes and claims
            </p>
          </Link>
        </div>
      </Card>
    </div>
  )
}
