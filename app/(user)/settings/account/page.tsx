"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    phone: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        username: "",
        bio: "",
        phone: "",
      })
    }
  }, [session, status, router])

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await update()
        setMessage({ type: "success", text: "Profile updated successfully!" })
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to update profile" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 rounded-lg p-4 ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-300">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-gray-600">
                    {formData.name?.[0] || session?.user?.email?.[0] || "U"}
                  </div>
                )}
              </div>
              <div>
                <Button size="sm" variant="outline">
                  Change Photo
                </Button>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1"
              placeholder="username"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your unique username. This will be shown in your profile URL.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Tell us about yourself..."
              maxLength={160}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.bio.length}/160 characters
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              type="email"
              value={session?.user?.email || ""}
              className="mt-1"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              Update Contact Info
            </Button>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Security</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                type="password"
                value="••••••••••"
                disabled
                className="flex-1"
              />
              <Button variant="outline">Change Password</Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  Two-Factor Authentication
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 p-6">
        <h2 className="mb-4 text-xl font-semibold text-red-600">
          Danger Zone
        </h2>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="mt-1 text-sm text-red-700">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
