"use client"

import { useState } from "react"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { useRouter } from "next/navigation"

interface NotificationPreferences {
  id: string
  userId: string
  newVideosEmail: boolean
  newVideosPush: boolean
  newVideosInApp: boolean
  commentsEmail: boolean
  commentsPush: boolean
  commentsInApp: boolean
  mentionsEmail: boolean
  mentionsPush: boolean
  mentionsInApp: boolean
  recommendationsEmail: boolean
  recommendationsPush: boolean
  recommendationsInApp: boolean
}

interface Props {
  initialPreferences: NotificationPreferences
}

export default function NotificationPreferencesForm({ initialPreferences }: Props) {
  const router = useRouter()
  const [preferences, setPreferences] = useState(initialPreferences)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleToggle = (field: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error("Failed to save preferences")
      }

      setMessage({ type: "success", text: "Preferences saved successfully!" })
      router.refresh()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save preferences. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const notificationSettings = [
    {
      title: "Subscriptions",
      settings: [
        {
          label: "New videos from subscriptions",
          description: "Get notified when channels you subscribe to upload new videos",
          emailField: "newVideosEmail" as const,
          pushField: "newVideosPush" as const,
          inAppField: "newVideosInApp" as const,
        },
      ],
    },
    {
      title: "Community",
      settings: [
        {
          label: "Comments & replies",
          description: "When someone replies to your comment",
          emailField: "commentsEmail" as const,
          pushField: "commentsPush" as const,
          inAppField: "commentsInApp" as const,
        },
        {
          label: "Mentions",
          description: "When someone mentions you in a comment",
          emailField: "mentionsEmail" as const,
          pushField: "mentionsPush" as const,
          inAppField: "mentionsInApp" as const,
        },
      ],
    },
    {
      title: "Recommendations",
      settings: [
        {
          label: "Recommended videos",
          description: "Videos we think you might like based on your activity",
          emailField: "recommendationsEmail" as const,
          pushField: "recommendationsPush" as const,
          inAppField: "recommendationsInApp" as const,
        },
      ],
    },
  ]

  return (
    <>
      {notificationSettings.map((section) => (
        <Card key={section.title} className="p-6">
          <h3 className="mb-4 text-lg font-semibold">{section.title}</h3>
          <div className="space-y-6">
            {section.settings.map((setting, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900">{setting.label}</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {setting.description}
                  </p>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={preferences[setting.emailField]}
                      onChange={() => handleToggle(setting.emailField)}
                    />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={preferences[setting.pushField]}
                      onChange={() => handleToggle(setting.pushField)}
                    />
                    <span className="text-sm text-gray-700">Push</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={preferences[setting.inAppField]}
                      onChange={() => handleToggle(setting.inAppField)}
                    />
                    <span className="text-sm text-gray-700">In-app</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

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
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </>
  )
}
