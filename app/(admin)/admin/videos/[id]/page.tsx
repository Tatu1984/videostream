"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Flag,
  ArrowLeft,
  Ban,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
  User,
  Calendar,
} from "lucide-react"

interface VideoDetails {
  video: {
    id: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    visibility: string
    videoType: string
    ageRestricted: boolean
    commentsEnabled: boolean
    viewCount: bigint
    likeCount: number
    dislikeCount: number
    commentCount: number
    duration: number | null
    createdAt: string
    publishedAt: string | null
    channel: {
      id: string
      name: string
      handle: string
      verified: boolean
      owner: {
        id: string
        name: string
        email: string
        username: string | null
      }
    }
    flags: Array<{
      id: string
      reason: string
      status: string
      createdAt: string
      reporter: {
        id: string
        name: string
        username: string | null
      }
    }>
    copyrightClaims: Array<{
      id: string
      status: string
      description: string
      rightsHolder: {
        name: string
        email: string
      } | null
    }>
    _count: {
      likes: number
      comments: number
      flags: number
    }
  }
}

export default function AdminVideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<VideoDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchVideo()
  }, [params.id])

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/admin/videos/${params.id}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching video:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, extraData?: Record<string, any>) => {
    if (!confirm(`Are you sure you want to ${action.replace("_", " ")} this video?`)) {
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/videos/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes, ...extraData }),
      })

      if (res.ok) {
        fetchVideo()
        setNotes("")
      } else {
        const error = await res.json()
        alert(error.error || "Action failed")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!data?.video) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Video not found</p>
        <Link href="/admin/videos" className="mt-4 text-red-600 hover:underline">
          Back to videos
        </Link>
      </div>
    )
  }

  const { video } = data

  const visibilityColors: Record<string, string> = {
    PUBLIC: "bg-green-100 text-green-800",
    PRIVATE: "bg-gray-100 text-gray-800",
    UNLISTED: "bg-yellow-100 text-yellow-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/videos"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Videos
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex gap-6">
              <div className="relative aspect-video w-72 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {video.ageRestricted && (
                  <span className="absolute bottom-2 right-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                    18+
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${visibilityColors[video.visibility]}`}>
                    {video.visibility}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                    {video.videoType}
                  </span>
                  {video.ageRestricted && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                      Age Restricted
                    </span>
                  )}
                  {!video.commentsEnabled && (
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                      Comments Disabled
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                  {video.description || "No description"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="h-5 w-5" />
                <span className="text-sm">Views</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{video.viewCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <ThumbsUp className="h-5 w-5" />
                <span className="text-sm">Likes</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{video.likeCount}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm">Comments</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{video._count.comments}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Flag className="h-5 w-5" />
                <span className="text-sm">Flags</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{video._count.flags}</p>
            </div>
          </div>

          {/* Channel Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Channel Information</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-medium">
                  {video.channel.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/channels/${video.channel.id}`}
                      className="font-medium text-gray-900 hover:text-red-600"
                    >
                      {video.channel.name}
                    </Link>
                    {video.channel.verified && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{video.channel.handle}</p>
                </div>
              </div>
              <Link
                href={`/admin/users/${video.channel.owner.id}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <User className="h-4 w-4" />
                {video.channel.owner.name}
              </Link>
            </div>
          </div>

          {/* Flags */}
          {video.flags.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Flags ({video.flags.length})</h2>
              <div className="space-y-3">
                {video.flags.map((flag) => (
                  <Link
                    key={flag.id}
                    href={`/admin/moderation/flags/${flag.id}`}
                    className="block rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          {flag.reason.replace("_", " ")}
                        </span>
                        <p className="mt-2 text-sm text-gray-600">
                          Reported by {flag.reporter?.name || "Unknown"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        flag.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : flag.status === "RESOLVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {flag.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Copyright Claims */}
          {video.copyrightClaims.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Copyright Claims ({video.copyrightClaims.length})</h2>
              <div className="space-y-3">
                {video.copyrightClaims.map((claim) => (
                  <Link
                    key={claim.id}
                    href={`/admin/copyright/claims/${claim.id}`}
                    className="block rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {claim.rightsHolder?.name || "Unknown Claimant"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                          {claim.description}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        claim.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : claim.status === "UPHELD"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Video Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Video Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">
                  {video.duration
                    ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, "0")}`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">
                  {new Date(video.createdAt).toLocaleDateString()}
                </span>
              </div>
              {video.publishedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Published</span>
                  <span className="font-medium">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Admin Actions</h2>
            <div className="space-y-2">
              {video.visibility !== "PRIVATE" && (
                <button
                  onClick={() => handleAction("remove")}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  Remove Video
                </button>
              )}

              {video.visibility === "PRIVATE" && (
                <button
                  onClick={() => handleAction("restore")}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Restore Video
                </button>
              )}

              {!video.ageRestricted ? (
                <button
                  onClick={() => handleAction("age_restrict")}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Age Restrict
                </button>
              ) : (
                <button
                  onClick={() => handleAction("remove_age_restriction")}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Remove Age Restriction
                </button>
              )}

              {video.commentsEnabled ? (
                <button
                  onClick={() => handleAction("disable_comments")}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  Disable Comments
                </button>
              ) : (
                <button
                  onClick={() => handleAction("enable_comments")}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  Enable Comments
                </button>
              )}

              <button
                onClick={() => handleAction("remove", { applyStrike: true })}
                disabled={actionLoading}
                className="flex w-full items-center justify-start gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />
                Remove + Issue Strike
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                rows={3}
                placeholder="Add notes about this action..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
