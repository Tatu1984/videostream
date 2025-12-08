"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload as UploadIcon } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState("PRIVATE")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !title) {
      alert("Please select a file and enter a title")
      return
    }

    setUploading(true)

    try {
      // In a real app, you would:
      // 1. Upload the file to cloud storage (S3/CloudFlare/etc)
      // 2. Create the video record in the database
      // 3. Trigger background job for transcoding

      // For now, just create a placeholder video record
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          visibility,
          channelId: "placeholder", // Get from user's channel
        }),
      })

      if (response.ok) {
        alert("Video uploaded successfully!")
        router.push("/studio/videos")
      } else {
        alert("Failed to upload video")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("An error occurred during upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Upload Video</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="rounded-lg border border-gray-200 bg-white p-8">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 transition-colors hover:border-blue-500 hover:bg-blue-50">
              <UploadIcon className="mb-4 h-12 w-12 text-gray-400" />
              <span className="mb-2 text-sm font-medium text-gray-700">
                {file ? file.name : "Click to upload or drag and drop"}
              </span>
              <span className="text-xs text-gray-500">
                MP4, MOV, AVI up to 10GB
              </span>
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Video Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Video Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  maxLength={100}
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {title.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  maxLength={5000}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/5000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="PRIVATE">Private</option>
                  <option value="UNLISTED">Unlisted</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file || !title}>
              {uploading ? "Uploading..." : "Upload Video"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
