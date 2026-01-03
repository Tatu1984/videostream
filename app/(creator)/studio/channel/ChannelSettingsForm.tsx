"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { Loader2, Upload } from "lucide-react"
import Link from "next/link"

interface Channel {
  id: string
  name: string
  handle: string
  description: string | null
  avatar: string | null
  banner: string | null
  status: string
  verified: boolean
  subscriberCount: number
  videoCount: number
}

interface Props {
  channel: Channel
}

export default function ChannelSettingsForm({ channel }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: channel.name,
    handle: channel.handle.replace("@", ""),
    description: channel.description || "",
  })

  const [avatarUrl, setAvatarUrl] = useState(channel.avatar)
  const [bannerUrl, setBannerUrl] = useState(channel.banner)

  const handleImageUpload = async (file: File, type: "avatar" | "banner") => {
    const isAvatar = type === "avatar"
    isAvatar ? setUploadingAvatar(true) : setUploadingBanner(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      const { url } = await res.json()

      // Update local state
      if (isAvatar) {
        setAvatarUrl(url)
      } else {
        setBannerUrl(url)
      }

      // Update channel in database
      const updateRes = await fetch("/api/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: url }),
      })

      if (updateRes.ok) {
        setMessage({ type: "success", text: `${isAvatar ? "Avatar" : "Banner"} updated successfully!` })
        router.refresh()
      } else {
        const data = await updateRes.json()
        throw new Error(data.error || "Failed to update channel")
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Upload failed" })
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingBanner(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          handle: formData.handle,
          description: formData.description,
        }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Channel updated successfully!" })
        router.refresh()
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to update channel" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === "success" ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
        <h2 className="mb-6 text-xl font-semibold dark:text-gray-100">Basic Information</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Channel Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter channel name"
              maxLength={50}
              className="mt-1 dark:bg-[#121212] dark:border-gray-600 dark:text-gray-100"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This is how viewers will see your channel
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Handle *
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                @
              </span>
              <Input
                type="text"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                placeholder="your-handle"
                maxLength={30}
                className="pl-8 dark:bg-[#121212] dark:border-gray-600 dark:text-gray-100"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your unique identifier across the platform
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell viewers about your channel"
              maxLength={1000}
              rows={5}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-[#121212] dark:text-gray-100 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Help people understand what your channel is about
            </p>
          </div>
        </div>
      </div>

      {/* Channel Art */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
        <h2 className="mb-6 text-xl font-semibold dark:text-gray-100">Channel Art</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Channel Avatar
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={channel.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-500">
                    {channel.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "avatar")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-[#282828]"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Avatar
                    </>
                  )}
                </Button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recommended: 800x800px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Channel Banner
            </label>
            <div className="mt-2 space-y-2">
              <div className="h-32 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={`${channel.name} banner`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                    No banner uploaded
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "banner")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                  className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-[#282828]"
                >
                  {uploadingBanner ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Banner
                    </>
                  )}
                </Button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recommended: 2560x1440px, PNG or JPG
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Status */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
        <h2 className="mb-6 text-xl font-semibold dark:text-gray-100">Channel Status</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
            <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
              {channel.status}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Verified</p>
            <p className="mt-1 text-lg font-semibold dark:text-gray-100">
              {channel.verified ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscribers</p>
            <p className="mt-1 text-lg font-semibold dark:text-gray-100">
              {channel.subscriberCount.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Videos</p>
            <p className="mt-1 text-lg font-semibold dark:text-gray-100">
              {channel.videoCount}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Link href="/studio">
          <Button type="button" variant="ghost" className="dark:text-gray-300 dark:hover:bg-[#282828]">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
