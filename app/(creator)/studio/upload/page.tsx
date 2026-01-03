"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload as UploadIcon, X, CheckCircle, AlertCircle, Image, Film } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"

interface Channel {
  id: string
  name: string
  handle: string
}

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error"

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [loadingChannels, setLoadingChannels] = useState(true)

  // Video file state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState("PRIVATE")
  const [videoType, setVideoType] = useState("STANDARD")
  const [tags, setTags] = useState("")
  const [category, setCategory] = useState("")
  const [schedulePublish, setSchedulePublish] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)

  // Fetch user's channels on mount
  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch("/api/channels")
        if (response.ok) {
          const data = await response.json()
          setChannels(data.channels || [])
          if (data.channels?.length > 0) {
            setSelectedChannel(data.channels[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching channels:", error)
      } finally {
        setLoadingChannels(false)
      }
    }
    fetchChannels()
  }, [])

  // Handle video file selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"]
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV")
      return
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage("File too large. Maximum size is 500MB")
      return
    }

    setVideoFile(file)
    setErrorMessage("")

    // Create preview URL
    const url = URL.createObjectURL(file)
    setVideoPreviewUrl(url)

    // Auto-fill title from filename
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setTitle(nameWithoutExt)
    }
  }

  // Handle thumbnail selection
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Invalid thumbnail type. Please upload JPEG, PNG, or WebP")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Thumbnail too large. Maximum size is 5MB")
      return
    }

    setThumbnailFile(file)
    setErrorMessage("")

    // Create preview URL
    const url = URL.createObjectURL(file)
    setThumbnailPreviewUrl(url)
  }

  // Remove video file
  const removeVideo = () => {
    setVideoFile(null)
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
      setVideoPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove thumbnail
  const removeThumbnail = () => {
    setThumbnailFile(null)
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl)
      setThumbnailPreviewUrl(null)
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!videoFile) {
      setErrorMessage("Please select a video file")
      return
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a title")
      return
    }

    if (!selectedChannel) {
      setErrorMessage("Please select a channel")
      return
    }

    setUploadStatus("uploading")
    setUploadProgress(0)
    setErrorMessage("")

    try {
      // Create FormData for video upload
      const formData = new FormData()
      formData.append("video", videoFile)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("channelId", selectedChannel)
      formData.append("visibility", visibility)
      formData.append("videoType", videoType)
      if (tags.trim()) {
        formData.append("tags", tags)
      }
      if (category) {
        formData.append("category", category)
      }
      if (schedulePublish && scheduledDate && scheduledTime) {
        const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`)
        formData.append("scheduledFor", scheduledFor.toISOString())
      }

      // Upload video using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise<{ success: boolean; video?: { id: string } }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed"))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"))
        })

        xhr.open("POST", "/api/upload/video")
        xhr.send(formData)
      })

      const result = await uploadPromise

      if (result.success && result.video) {
        setUploadedVideoId(result.video.id)

        // Upload thumbnail if provided
        if (thumbnailFile) {
          setUploadStatus("processing")
          const thumbnailFormData = new FormData()
          thumbnailFormData.append("thumbnail", thumbnailFile)
          thumbnailFormData.append("videoId", result.video.id)

          await fetch("/api/upload/thumbnail", {
            method: "POST",
            body: thumbnailFormData,
          })
        }

        setUploadStatus("success")

        // Redirect after short delay
        setTimeout(() => {
          router.push("/studio/videos")
        }, 2000)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Upload failed")
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Loading state
  if (loadingChannels) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto dark:border-gray-600 dark:border-t-blue-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // No channels state
  if (channels.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <Film className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold dark:text-gray-100">No channel found</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">You need to create a channel before uploading videos</p>
        <Button className="mt-4" onClick={() => router.push("/studio/channel/new")}>
          Create Channel
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold dark:text-gray-100">Upload Video</h1>

        {/* Success State */}
        {uploadStatus === "success" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold text-green-900 dark:text-green-400">Upload Complete!</h2>
            <p className="mt-2 text-green-700 dark:text-green-300">Your video has been uploaded successfully.</p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">Redirecting to your videos...</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload Area */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-8">
            <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Video File</h2>

            {!videoFile ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#282828] p-12 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <UploadIcon className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                <span className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  MP4, WebM, MOV, AVI, MKV up to 500MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                  onChange={handleVideoSelect}
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                />
              </label>
            ) : (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                  {videoPreviewUrl && (
                    <video
                      src={videoPreviewUrl}
                      className="h-full w-full object-contain"
                      controls
                    />
                  )}
                  {uploadStatus === "idle" && (
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* File Info */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{videoFile.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatFileSize(videoFile.size)}</span>
                </div>

                {/* Upload Progress */}
                {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {uploadStatus === "uploading" ? "Uploading..." : "Processing..."}
                      </span>
                      <span className="font-medium dark:text-gray-200">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
            <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Thumbnail (Optional)</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Upload a custom thumbnail or one will be auto-generated
            </p>

            <div className="flex gap-4">
              {!thumbnailFile ? (
                <label className="flex h-32 w-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#282828] transition-colors hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <Image className="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Upload thumbnail</span>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailSelect}
                    disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  />
                </label>
              ) : (
                <div className="relative h-32 w-56 overflow-hidden rounded-lg">
                  {thumbnailPreviewUrl && (
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  {uploadStatus === "idle" && (
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Details */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
            <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Video Details</h2>

            <div className="space-y-4">
              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Channel *
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                >
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name} (@{channel.handle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{title.length}/100</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  maxLength={5000}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {description.length}/5000
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="gaming, tutorial, music (comma-separated)"
                  className="mt-1"
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Add tags separated by commas to help viewers find your video
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                >
                  <option value="">Select a category</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Music">Music</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                  <option value="Science & Technology">Science & Technology</option>
                  <option value="Sports">Sports</option>
                  <option value="News & Politics">News & Politics</option>
                  <option value="Howto & Style">Howto & Style</option>
                  <option value="People & Blogs">People & Blogs</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Film & Animation">Film & Animation</option>
                  <option value="Autos & Vehicles">Autos & Vehicles</option>
                  <option value="Pets & Animals">Pets & Animals</option>
                  <option value="Travel & Events">Travel & Events</option>
                </select>
              </div>

              {/* Visibility & Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="UNLISTED">Unlisted</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video Type
                  </label>
                  <select
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  >
                    <option value="STANDARD">Standard Video</option>
                    <option value="SHORT">Short (Vertical)</option>
                  </select>
                </div>
              </div>

              {/* Schedule Publishing */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#282828] p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="schedulePublish"
                    checked={schedulePublish}
                    onChange={(e) => setSchedulePublish(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  />
                  <label htmlFor="schedulePublish" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Schedule video for later
                  </label>
                </div>

                {schedulePublish && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                        required={schedulePublish}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#121212] px-3 py-2 text-sm dark:text-gray-100 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                        required={schedulePublish}
                      />
                    </div>
                    <p className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                      Your video will be automatically published at the scheduled time
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !videoFile ||
                !title.trim() ||
                !selectedChannel ||
                uploadStatus === "uploading" ||
                uploadStatus === "processing" ||
                uploadStatus === "success"
              }
            >
              {uploadStatus === "uploading"
                ? `Uploading ${uploadProgress}%`
                : uploadStatus === "processing"
                ? "Processing..."
                : "Upload Video"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
