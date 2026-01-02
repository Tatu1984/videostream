"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import {
  FileText,
  DollarSign,
  Shield,
  MessageSquare,
  BarChart3,
  Save,
  Eye,
  Upload,
  Trash2,
  Loader2
} from "lucide-react"

interface Video {
  id: string
  title: string
  description: string | null
  visibility: string
  category: string | null
  tags: string[]
  thumbnail: string | null
  monetizationEnabled: boolean
  adsEnabled: boolean
  viewCount: number
  likeCount: number
  commentCount: number
}

export default function VideoEditPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string

  const [activeTab, setActiveTab] = useState("details")
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "PUBLIC",
    category: "Technology",
    tags: "",
  })

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`)
        if (res.ok) {
          const data = await res.json()
          setVideo(data)
          setFormData({
            title: data.title || "",
            description: data.description || "",
            visibility: data.visibility || "PUBLIC",
            category: data.category || "Technology",
            tags: data.tags?.join(", ") || "",
          })
        }
      } catch (error) {
        console.error("Error fetching video:", error)
      } finally {
        setLoading(false)
      }
    }

    if (videoId) {
      fetchVideo()
    }
  }, [videoId])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          category: formData.category,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Video updated successfully!" })
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to update video" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return
    }

    setDeleting(true)

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/studio/videos")
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to delete video" })
        setDeleting(false)
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Video not found</p>
      </div>
    )
  }

  const tabs = [
    { id: "details", label: "Details", icon: FileText },
    { id: "monetization", label: "Monetization", icon: DollarSign },
    { id: "policies", label: "Policies & Flags", icon: Shield },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Video</h1>
          <p className="mt-1 text-gray-600">Manage video details and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/watch/${videoId}`, "_blank")}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 rounded-lg p-4 ${
          message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* Video Preview */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Video Preview</h2>
            <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-gray-900">
              <div className="flex h-full items-center justify-center text-white">
                Video Player Placeholder
              </div>
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  placeholder="Enter video title"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell viewers about your video..."
                  maxLength={5000}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Technology</option>
                    <option>Gaming</option>
                    <option>Music</option>
                    <option>Education</option>
                    <option>Entertainment</option>
                    <option>Sports</option>
                    <option>News</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">Unlisted</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <Input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="mt-1"
                  placeholder="Separate tags with commas"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Help viewers find your video by adding keywords
                </p>
              </div>
            </div>
          </Card>

          {/* Thumbnail */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Thumbnail</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-video cursor-pointer overflow-hidden rounded-lg border-2 border-transparent bg-gray-200 hover:border-blue-500"
                >
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    Auto {i}
                  </div>
                </div>
              ))}
              <label className="aspect-video cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-500">
                <div className="flex h-full flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-xs text-gray-500">Upload</p>
                </div>
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
          </Card>

          {/* Audience */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Audience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Is this video made for kids?
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="forKids"
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">
                      Yes, it's made for kids
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="forKids"
                      className="h-4 w-4 text-blue-600"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-900">
                      No, it's not made for kids
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Age restriction (18+)
                  </span>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "monetization" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Monetization Status</h2>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Monetization Enabled
                  </p>
                  <p className="text-sm text-green-700">
                    Your channel is eligible for monetization
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Ad Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    defaultChecked={video.adsEnabled}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Enable ads on this video
                  </span>
                </label>
              </div>

              <div className="ml-6 space-y-3">
                <p className="text-sm font-medium text-gray-700">Ad types:</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-900">Display ads</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-900">Overlay ads</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-900">Skippable video ads</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-900">
                    Non-skippable video ads
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-900">Bumper ads</span>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Revenue Estimate</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Estimated Earnings</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">$45.32</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">CPM</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">$3.67</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Ad Impressions</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "policies" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Video Status</h2>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">No Issues</p>
                  <p className="text-sm text-green-700">
                    This video is in good standing
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Flags & Reports</h2>
            <div className="rounded-lg border border-gray-200 p-8 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 font-medium text-gray-900">No flags on this video</p>
              <p className="mt-1 text-sm text-gray-600">
                Your video hasn't been flagged by users
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Copyright Claims</h2>
            <div className="rounded-lg border border-gray-200 p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 font-medium text-gray-900">
                No copyright claims
              </p>
              <p className="mt-1 text-sm text-gray-600">
                This video doesn't have any copyright claims
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Comment Settings</h2>
              <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option>All comments</option>
                <option>Approved comments</option>
                <option>Pending review</option>
                <option>Held for review</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  defaultChecked
                />
                <span className="text-sm font-medium text-gray-900">
                  Allow comments
                </span>
              </label>
              <label className="ml-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  defaultChecked
                />
                <span className="text-sm text-gray-900">
                  Hold potentially inappropriate comments for review
                </span>
              </label>
              <label className="ml-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-900">
                  Sort comments by newest first
                </span>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Recent Comments</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 border-b border-gray-200 pb-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">User {i}</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      Great video! Really helpful content.
                    </p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-600">
                      <button className="hover:text-gray-900">Reply</button>
                      <button className="hover:text-gray-900">Like</button>
                      <button className="hover:text-red-600">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Views</p>
              <p className="mt-1 text-2xl font-bold">{video.viewCount.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Likes</p>
              <p className="mt-1 text-2xl font-bold">{video.likeCount.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Comments</p>
              <p className="mt-1 text-2xl font-bold">{video.commentCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Engagement</p>
              <p className="mt-1 text-2xl font-bold">
                {video.viewCount > 0 ? ((video.likeCount + video.commentCount) / video.viewCount * 100).toFixed(1) : 0}%
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Views Over Time</h2>
            <div className="space-y-1">
              {Array.from({ length: 7 }, (_, i) => ({
                day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
                views: Math.floor(Math.random() * 500) + 100,
              })).map((day) => (
                <div key={day.day} className="flex items-center gap-2">
                  <span className="w-12 text-xs text-gray-600">{day.day}</span>
                  <div className="h-6 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(day.views / 600) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs text-gray-600">
                    {day.views}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Traffic Sources</h2>
            <div className="space-y-3">
              {[
                { source: "YouTube Search", percentage: 45 },
                { source: "Suggested Videos", percentage: 30 },
                { source: "External", percentage: 15 },
                { source: "Direct", percentage: 10 },
              ].map((item) => (
                <div key={item.source}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{item.source}</span>
                    <span className="font-medium text-gray-900">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200 p-6">
        <h2 className="mb-4 text-xl font-semibold text-red-600">Danger Zone</h2>
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
          <div>
            <p className="font-medium text-red-900">Delete this video</p>
            <p className="text-sm text-red-700">
              This action cannot be undone
            </p>
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {deleting ? "Deleting..." : "Delete Video"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
