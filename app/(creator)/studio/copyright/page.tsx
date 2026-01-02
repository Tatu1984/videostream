"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Video {
  id: string
  title: string
  thumbnailUrl?: string
}

interface RightsHolder {
  name: string
  email: string
}

interface Claim {
  id: string
  videoId: string
  claimedContent: string
  claimType: string
  status: string
  createdAt: string
  counterNotice?: string
  counterNoticedAt?: string
  video: Video
  rightsHolder: RightsHolder
}

export default function StudioCopyrightPage() {
  const { data: session, status } = useSession()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)
  const [counterNotice, setCounterNotice] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin")
    }

    if (status === "authenticated") {
      fetchClaims()
    }
  }, [status, statusFilter])

  async function fetchClaims() {
    try {
      const url = statusFilter
        ? `/api/copyright/claims?status=${statusFilter}`
        : "/api/copyright/claims"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setClaims(data.claims)
      }
    } catch (err) {
      console.error("Error fetching claims:", err)
    } finally {
      setLoading(false)
    }
  }

  async function submitCounterNotice(claimId: string) {
    if (!counterNotice.trim()) {
      setError("Please provide a counter-notice explanation")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/copyright/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, counterNotice }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error)
        return
      }

      setSuccess("Counter-notice submitted successfully!")
      setCounterNotice("")
      setExpandedClaim(null)
      fetchClaims()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to submit counter-notice")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "ACTIVE":
        return "bg-red-100 text-red-800"
      case "COUNTER_NOTICED":
        return "bg-blue-100 text-blue-800"
      case "RESOLVED":
        return "bg-green-100 text-green-800"
      case "RELEASED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "ACTIVE":
        return <AlertTriangle className="h-4 w-4" />
      case "COUNTER_NOTICED":
        return <FileText className="h-4 w-4" />
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />
      case "RELEASED":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const pendingClaims = claims.filter(
    (c) => c.status === "PENDING" || c.status === "ACTIVE"
  )
  const resolvedClaims = claims.filter(
    (c) => c.status === "RESOLVED" || c.status === "RELEASED"
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Copyright Claims</h1>
        <p className="mt-1 text-gray-600">
          Manage copyright claims on your videos
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <p>{success}</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Claims</p>
              <p className="text-2xl font-bold">{pendingClaims.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold">{resolvedClaims.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold">{claims.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border bg-white px-4 py-2 text-sm"
        >
          <option value="">All Claims</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="COUNTER_NOTICED">Counter-Noticed</option>
          <option value="RESOLVED">Resolved</option>
          <option value="RELEASED">Released</option>
        </select>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.map((claim) => (
          <Card key={claim.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Video Thumbnail */}
                <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                  {claim.video.thumbnailUrl ? (
                    <img
                      src={claim.video.thumbnailUrl}
                      alt={claim.video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No thumbnail
                    </div>
                  )}
                </div>

                {/* Claim Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{claim.video.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Claimed content: {claim.claimedContent}
                      </p>
                      <p className="text-sm text-gray-500">
                        By: {claim.rightsHolder.name} ({claim.rightsHolder.email})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          claim.status
                        )}`}
                      >
                        {getStatusIcon(claim.status)}
                        {claim.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span>Type: {claim.claimType}</span>
                    <span>
                      Filed{" "}
                      {formatDistanceToNow(new Date(claim.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Counter Notice Section */}
                  {(claim.status === "PENDING" || claim.status === "ACTIVE") && (
                    <div className="mt-4">
                      <button
                        onClick={() =>
                          setExpandedClaim(
                            expandedClaim === claim.id ? null : claim.id
                          )
                        }
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {expandedClaim === claim.id ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide dispute form
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Dispute this claim
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {claim.counterNotice && (
                    <div className="mt-4 rounded-lg bg-blue-50 p-3">
                      <p className="text-sm font-medium text-blue-800">
                        Counter-Notice Submitted
                      </p>
                      <p className="mt-1 text-sm text-blue-600">
                        {claim.counterNotice}
                      </p>
                      {claim.counterNoticedAt && (
                        <p className="mt-2 text-xs text-blue-500">
                          Submitted{" "}
                          {formatDistanceToNow(new Date(claim.counterNoticedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Dispute Form */}
              {expandedClaim === claim.id && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-medium">Submit Counter-Notice</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Explain why you believe this claim is invalid. Provide
                    evidence of your rights to use this content.
                  </p>
                  <textarea
                    value={counterNotice}
                    onChange={(e) => setCounterNotice(e.target.value)}
                    placeholder="I have the rights to use this content because..."
                    rows={4}
                    className="mt-4 w-full rounded-lg border px-4 py-2 text-sm"
                  />
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => submitCounterNotice(claim.id)}
                      disabled={submitting}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Submit Counter-Notice
                    </button>
                    <button
                      onClick={() => {
                        setExpandedClaim(null)
                        setCounterNotice("")
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                    <p className="flex items-start gap-2 text-sm text-yellow-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        Warning: Filing a false counter-notice may result in legal
                        consequences. Only file if you have a good faith belief
                        that the material was removed by mistake.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        {claims.length === 0 && (
          <Card className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-600">No copyright claims found</p>
            <p className="text-sm text-gray-500">
              Your videos are in good standing
            </p>
          </Card>
        )}
      </div>

      {/* Info Section */}
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-semibold">Understanding Copyright Claims</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-gray-900">What is a copyright claim?</h3>
            <p className="mt-1 text-sm text-gray-600">
              A copyright claim occurs when a rights holder identifies their
              copyrighted content in your video. This may affect monetization or
              availability of your video.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">How to dispute a claim?</h3>
            <p className="mt-1 text-sm text-gray-600">
              If you believe the claim is incorrect, you can submit a
              counter-notice with evidence. The rights holder has 10 business
              days to respond.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Claim types</h3>
            <p className="mt-1 text-sm text-gray-600">
              <strong>Audio:</strong> Music or sound in your video.{" "}
              <strong>Visual:</strong> Images or video clips.{" "}
              <strong>Both:</strong> Audio and visual content.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Preventing claims</h3>
            <p className="mt-1 text-sm text-gray-600">
              Use royalty-free music and original content. Check the audio
              library for licensed music you can use freely.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
