"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, User, Hash, FileText, Tag } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import Link from "next/link"

const CHANNEL_CATEGORIES = [
  "Education",
  "Entertainment",
  "Gaming",
  "Music",
  "Sports",
  "Technology",
  "Science",
  "News & Politics",
  "Film & Animation",
  "Autos & Vehicles",
  "Pets & Animals",
  "Comedy",
  "Travel & Events",
  "Howto & Style",
  "People & Blogs",
  "Nonprofits & Activism",
]

export default function NewChannelPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    description: "",
    category: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Channel name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Channel name must be at least 3 characters"
    } else if (formData.name.length > 50) {
      newErrors.name = "Channel name must not exceed 50 characters"
    }

    if (!formData.handle.trim()) {
      newErrors.handle = "Handle is required"
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.handle)) {
      newErrors.handle = "Handle can only contain letters, numbers, hyphens, and underscores"
    } else if (formData.handle.length < 3) {
      newErrors.handle = "Handle must be at least 3 characters"
    } else if (formData.handle.length > 30) {
      newErrors.handle = "Handle must not exceed 30 characters"
    }

    if (formData.description.length > 1000) {
      newErrors.description = "Description must not exceed 1000 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          handle: `@${formData.handle.trim()}`,
          description: formData.description.trim() || null,
          category: formData.category || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/studio")
        router.refresh()
      } else {
        if (data.error) {
          setErrors({ submit: data.error })
        } else {
          setErrors({ submit: "Failed to create channel" })
        }
      }
    } catch (error) {
      console.error("Channel creation error:", error)
      setErrors({ submit: "An error occurred while creating your channel" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link href="/studio">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold">Create Your Channel</h1>
            <p className="mt-1 text-gray-600">
              Set up your channel to start sharing content
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold">Basic Information</h2>

            <div className="space-y-6">
              {/* Channel Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Channel Name *
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your channel name"
                    maxLength={50}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.name.length}/50 - This is how viewers will see your
                  channel
                </p>
              </div>

              {/* Handle */}
              <div>
                <label
                  htmlFor="handle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Handle *
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="absolute inset-y-0 left-10 flex items-center text-gray-500">
                    @
                  </span>
                  <Input
                    id="handle"
                    name="handle"
                    type="text"
                    value={formData.handle}
                    onChange={handleChange}
                    placeholder="your-unique-handle"
                    maxLength={30}
                    className="pl-14"
                    required
                  />
                </div>
                {errors.handle && (
                  <p className="mt-1 text-xs text-red-600">{errors.handle}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.handle.length}/30 - Your unique identifier (letters,
                  numbers, hyphens, and underscores only)
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="relative mt-1">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell viewers about your channel"
                    maxLength={1000}
                    rows={5}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/1000 - Help people understand
                  what your channel is about
                </p>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select a category</option>
                    {CHANNEL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Help viewers find your channel
                </p>
              </div>
            </div>
          </div>

          {/* Channel Art Placeholders */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold">Channel Art</h2>

            <div className="space-y-6">
              {/* Avatar Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Avatar
                </label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <span className="text-3xl font-bold text-white">
                      {formData.name.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm" disabled>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Avatar
                    </Button>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended: 800x800px, PNG or JPG (Available after
                      creation)
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Banner
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex h-32 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500">
                    <FileText className="h-12 w-12 text-white opacity-50" />
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm" disabled>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Banner
                    </Button>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended: 2560x1440px, PNG or JPG (Available after
                      creation)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/studio">
              <Button type="button" variant="ghost" disabled={creating}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating Channel..." : "Create Channel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
