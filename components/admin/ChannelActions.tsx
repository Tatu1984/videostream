"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Ban, DollarSign, AlertTriangle } from "lucide-react"

interface ChannelActionsProps {
  channelId: string
  isVerified: boolean
  status: string
  monetizationEnabled: boolean
}

export function ChannelActions({
  channelId,
  isVerified,
  status,
  monetizationEnabled,
}: ChannelActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")

  const handleAction = async (action: string) => {
    const confirmMessage = {
      verify: "Are you sure you want to verify this channel?",
      unverify: "Are you sure you want to remove verification?",
      suspend: "Are you sure you want to suspend this channel?",
      restore: "Are you sure you want to restore this channel?",
      enable_monetization: "Are you sure you want to enable monetization?",
      disable_monetization: "Are you sure you want to disable monetization?",
      warn: "Are you sure you want to issue a warning?",
    }[action]

    if (!confirm(confirmMessage || "Are you sure?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })

      if (res.ok) {
        router.refresh()
        setReason("")
      } else {
        const error = await res.json()
        alert(error.error || "Action failed")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Action failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Channel Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Channel Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verified</span>
            {isVerified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${
              status === "ACTIVE" ? "bg-green-100 text-green-800" :
              status === "SUSPENDED" ? "bg-orange-100 text-orange-800" :
              "bg-red-100 text-red-800"
            }`}>
              {status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Monetization</span>
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${
              monetizationEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}>
              {monetizationEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      {/* Verification */}
      {!isVerified && status === "ACTIVE" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Verification</h2>
          <p className="mb-4 text-sm text-gray-600">
            Grant verification badge to this channel
          </p>
          <button
            onClick={() => handleAction("verify")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Verify Channel
          </button>
        </div>
      )}

      {isVerified && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Verification</h2>
          <button
            onClick={() => handleAction("unverify")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Remove Verification
          </button>
        </div>
      )}

      {/* Admin Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Admin Actions</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
            rows={2}
            placeholder="Enter reason for this action..."
          />
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleAction("warn")}
            disabled={loading}
            className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" />
            Issue Warning
          </button>

          {monetizationEnabled ? (
            <button
              onClick={() => handleAction("disable_monetization")}
              disabled={loading}
              className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              <DollarSign className="h-4 w-4" />
              Disable Monetization
            </button>
          ) : (
            <button
              onClick={() => handleAction("enable_monetization")}
              disabled={loading}
              className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              <DollarSign className="h-4 w-4" />
              Enable Monetization
            </button>
          )}

          {status === "ACTIVE" ? (
            <button
              onClick={() => handleAction("suspend")}
              disabled={loading}
              className="flex w-full items-center justify-start gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              Suspend Channel
            </button>
          ) : (
            <button
              onClick={() => handleAction("restore")}
              disabled={loading}
              className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Restore Channel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
