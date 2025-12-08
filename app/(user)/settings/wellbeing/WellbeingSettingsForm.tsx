"use client"

import { useState } from "react"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { useRouter } from "next/navigation"

interface WellbeingSettings {
  breakReminder: boolean
  breakInterval: number | null
}

interface Props {
  initialSettings: WellbeingSettings
}

export default function WellbeingSettingsForm({ initialSettings }: Props) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleToggle = (field: keyof WellbeingSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleIntervalChange = (minutes: number) => {
    setSettings((prev) => ({
      ...prev,
      breakInterval: minutes,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/user/wellbeing-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      setMessage({ type: "success", text: "Wellbeing settings saved successfully!" })
      router.refresh()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Reminders */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Take a Break Reminders</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={settings.breakReminder}
                onChange={() => handleToggle("breakReminder")}
              />
              <span className="text-sm font-medium text-gray-900">
                Remind me to take a break
              </span>
            </label>
            <p className="ml-6 mt-1 text-sm text-gray-600">
              Get a reminder to take a break from watching
            </p>
          </div>

          {settings.breakReminder && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700">
                Remind me every
              </label>
              <select
                className="mt-1 rounded-md border border-gray-300 p-2 text-sm"
                value={settings.breakInterval || 60}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          )}
        </div>
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
