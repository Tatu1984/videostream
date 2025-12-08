"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, AlertTriangle, Ban, CheckCircle } from "lucide-react"

interface UserActionsProps {
  userId: string
  currentStatus: string
  currentRole: string
}

export function UserActions({ userId, currentStatus, currentRole }: UserActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [reason, setReason] = useState("")

  const handleAction = async (action: string, extraData?: Record<string, any>) => {
    // Extra confirmation for promoting to ADMIN
    if (action === "change_role" && extraData?.role === "ADMIN") {
      if (!confirm("WARNING: You are about to grant ADMIN privileges. This gives full platform access. Are you absolutely sure?")) {
        return
      }
    }

    const confirmMessage = {
      suspend: "Are you sure you want to suspend this user?",
      ban: "Are you sure you want to ban this user? This is a serious action.",
      restore: "Are you sure you want to restore this user?",
      warn: "Are you sure you want to issue a warning to this user?",
      change_role: "Are you sure you want to change this user's role?",
    }[action]

    if (!confirm(confirmMessage || "Are you sure?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, ...extraData }),
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
      {/* Account Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Account Status</h2>
        <div className="mb-4">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            currentStatus === "ACTIVE" ? "bg-green-100 text-green-800" :
            currentStatus === "SUSPENDED" ? "bg-orange-100 text-orange-800" :
            currentStatus === "BANNED" ? "bg-red-100 text-red-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {currentStatus}
          </span>
        </div>
      </div>

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

          {currentStatus === "ACTIVE" && (
            <>
              <button
                onClick={() => handleAction("suspend")}
                disabled={loading}
                className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Suspend Account
              </button>
              <button
                onClick={() => handleAction("ban")}
                disabled={loading}
                className="flex w-full items-center justify-start gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Ban Account
              </button>
            </>
          )}

          {(currentStatus === "SUSPENDED" || currentStatus === "BANNED") && (
            <button
              onClick={() => handleAction("restore")}
              disabled={loading}
              className="flex w-full items-center justify-start gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Restore Account
            </button>
          )}
        </div>
      </div>

      {/* Change Role */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Change Role</h2>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="USER">User</option>
          <option value="CREATOR">Creator</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={() => handleAction("change_role", { role: selectedRole })}
          disabled={loading || selectedRole === currentRole}
          className="mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Update Role
        </button>
      </div>
    </div>
  )
}
