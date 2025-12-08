"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react"

interface CopyrightClaimActionsProps {
  claimId: string
  status: string
}

export function CopyrightClaimActions({ claimId, status }: CopyrightClaimActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [action, setAction] = useState("no_action")
  const [applyStrike, setApplyStrike] = useState(false)

  const handleDecision = async (decision: string) => {
    const confirmMessage = {
      uphold: "Are you sure you want to uphold this copyright claim?",
      reject: "Are you sure you want to reject this copyright claim?",
      partial: "Are you sure you want to partially uphold this claim?",
    }[decision]

    if (!confirm(confirmMessage || "Are you sure?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/copyright/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes,
          action: decision === "uphold" ? action : undefined,
          applyStrike: decision === "uphold" ? applyStrike : undefined,
        }),
      })

      if (res.ok) {
        router.push("/admin/copyright/claims")
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

  if (status === "UPHELD" || status === "REJECTED") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Status</h2>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
          status === "UPHELD" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
        }`}>
          {status === "UPHELD" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {status}
        </div>
        <p className="mt-2 text-sm text-gray-500">This claim has already been decided.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Make Decision</h2>

      {/* Uphold Options */}
      <div className="mb-4 rounded-lg border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-900">If Upholding:</h3>

        <div className="mb-3">
          <label className="block text-sm text-gray-600">Action to take:</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="no_action">No additional action</option>
            <option value="block">Block video</option>
            <option value="mute_audio">Mute audio</option>
            <option value="monetize_for_claimant">Monetize for claimant</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={applyStrike}
            onChange={(e) => setApplyStrike(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>Issue copyright strike</span>
        </label>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleDecision("uphold")}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          Uphold Claim
        </button>

        <button
          onClick={() => handleDecision("reject")}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Reject Claim
        </button>

        <button
          onClick={() => handleDecision("partial")}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Shield className="h-4 w-4" />
          Partially Uphold
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Decision Notes</label>
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
