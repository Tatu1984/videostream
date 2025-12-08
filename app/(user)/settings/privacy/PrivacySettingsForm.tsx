"use client"

import { useState } from "react"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface PrivacySettings {
  subscriptionsPrivate: boolean
  likedVideosPrivate: boolean
}

interface BlockedUser {
  id: string
  userId: string
  name: string
  username: string | null
  image: string | null
  createdAt: string
}

interface Props {
  initialSettings: PrivacySettings
  blockedUsers: BlockedUser[]
}

export default function PrivacySettingsForm({ initialSettings, blockedUsers: initialBlockedUsers }: Props) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleToggle = (field: keyof PrivacySettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/user/privacy-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      setMessage({ type: "success", text: "Privacy settings saved successfully!" })
      router.refresh()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const handleUnblock = async (blockId: string, userId: string) => {
    try {
      const response = await fetch(`/api/user/blocked-users/${blockId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to unblock user")
      }

      // Remove from local state
      setBlockedUsers((prev) => prev.filter((user) => user.id !== blockId))
      setMessage({ type: "success", text: "User unblocked successfully!" })
      router.refresh()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to unblock user. Please try again." })
    }
  }

  return (
    <>
      {/* Profile Visibility */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Profile Visibility</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={settings.subscriptionsPrivate}
                onChange={() => handleToggle("subscriptionsPrivate")}
              />
              <span className="text-sm font-medium text-gray-900">
                Keep all my subscriptions private
              </span>
            </label>
            <p className="ml-6 mt-1 text-sm text-gray-600">
              Hide your subscription list from others
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={settings.likedVideosPrivate}
                onChange={() => handleToggle("likedVideosPrivate")}
              />
              <span className="text-sm font-medium text-gray-900">
                Keep all my liked videos private
              </span>
            </label>
            <p className="ml-6 mt-1 text-sm text-gray-600">
              Don't show your liked videos to others
            </p>
          </div>
        </div>
      </Card>

      {/* Blocked Users */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Blocked Users</h3>
        <p className="mb-4 text-sm text-gray-600">
          Blocked users can't comment on your videos or interact with you
        </p>

        {blockedUsers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">You haven't blocked any users</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-medium text-gray-600">
                        {user.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    {user.username && (
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(user.id, user.userId)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </>
  )
}
