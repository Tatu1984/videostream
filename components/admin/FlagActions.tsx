"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { XCircle, AlertTriangle, Ban, Shield, CheckCircle } from "lucide-react"

interface FlagActionsProps {
  flagId: string
  status: string
}

export function FlagActions({ flagId, status }: FlagActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [strikeType, setStrikeType] = useState("COMMUNITY_GUIDELINES")
  const [strikeSeverity, setStrikeSeverity] = useState("STRIKE")

  const handleDecision = async (decision: string) => {
    const confirmMessage = {
      dismiss: "Are you sure you want to dismiss this flag? No action will be taken.",
      warn: "Are you sure you want to issue a warning?",
      age_restrict: "Are you sure you want to age-restrict this content?",
      remove: "Are you sure you want to remove this content?",
      remove_with_strike: "Are you sure you want to remove this content AND issue a strike?",
    }[decision]

    if (!confirm(confirmMessage || "Are you sure?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes,
          strikeType: decision === "remove_with_strike" ? strikeType : undefined,
          strikeSeverity: decision === "remove_with_strike" ? strikeSeverity : undefined,
        }),
      })

      if (res.ok) {
        router.push("/admin/moderation/flags")
        router.refresh()
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

  if (status === "RESOLVED" || status === "DISMISSED") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Status</h2>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
          status === "RESOLVED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          <CheckCircle className="h-4 w-4" />
          {status}
        </div>
        <p className="mt-2 text-sm text-gray-500">This flag has already been processed.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Take Action</h2>

      <div className="space-y-3">
        <button
          onClick={() => handleDecision("dismiss")}
          disabled={loading}
          className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          No Violation - Dismiss
        </button>

        <button
          onClick={() => handleDecision("warn")}
          disabled={loading}
          className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          Send Warning
        </button>

        <button
          onClick={() => handleDecision("age_restrict")}
          disabled={loading}
          className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          Age Restrict
        </button>

        <button
          onClick={() => handleDecision("remove")}
          disabled={loading}
          className="flex w-full items-center justify-start gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          <Ban className="h-4 w-4" />
          Remove Content
        </button>

        <div className="border-t border-gray-200 pt-3">
          <p className="mb-2 text-sm font-medium text-gray-700">Remove with Strike:</p>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <select
              value={strikeType}
              onChange={(e) => setStrikeType(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="COMMUNITY_GUIDELINES">Community Guidelines</option>
              <option value="COPYRIGHT">Copyright</option>
              <option value="SPAM">Spam</option>
              <option value="MISLEADING">Misleading</option>
              <option value="TERMS_OF_SERVICE">TOS</option>
            </select>
            <select
              value={strikeSeverity}
              onChange={(e) => setStrikeSeverity(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="WARNING">Warning</option>
              <option value="STRIKE">Strike</option>
              <option value="SUSPENSION">Suspension</option>
            </select>
          </div>
          <button
            onClick={() => handleDecision("remove_with_strike")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Shield className="h-4 w-4" />
            Remove + Issue Strike
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
          rows={3}
          placeholder="Add notes about this decision..."
        />
      </div>
    </div>
  )
}
