"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VideoCard } from "@/components/user/video-card"
import { Button } from "@/components/shared/ui/button"
import { Share2, Edit, Trash2, Lock, Globe, X, Loader2 } from "lucide-react"

interface Channel {
  id: string
  name: string
  handle: string
  avatar: string | null
  verified: boolean
}

interface Video {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  duration: number | null
  viewCount: bigint
  likeCount: number
  createdAt: Date
  channel: Channel
}

interface Playlist {
  id: string
  title: string
  description: string | null
  visibility: string
  videoCount: number
  user: {
    id: string
    name: string | null
    username: string | null
  }
  videos: Video[]
}

interface PlaylistDetailClientProps {
  playlist: Playlist
  isOwner: boolean
}

export default function PlaylistDetailClient({
  playlist: initialPlaylist,
  isOwner,
}: PlaylistDetailClientProps) {
  const router = useRouter()
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState(playlist.title)
  const [editDescription, setEditDescription] = useState(playlist.description || "")
  const [editVisibility, setEditVisibility] = useState(playlist.visibility)
  const [saving, setSaving] = useState(false)

  // Share state
  const [copied, setCopied] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist? This cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/library/playlists")
      } else {
        alert("Failed to delete playlist")
      }
    } catch (err) {
      console.error("Failed to delete playlist:", err)
      alert("Failed to delete playlist")
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          visibility: editVisibility,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setPlaylist({
          ...playlist,
          title: updated.title,
          description: updated.description,
          visibility: updated.visibility,
        })
        setShowEditModal(false)
      } else {
        alert("Failed to update playlist")
      }
    } catch (err) {
      console.error("Failed to update playlist:", err)
      alert("Failed to update playlist")
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/playlist/${playlist.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Playlist Header */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{playlist.title}</h1>
              {playlist.visibility === "PRIVATE" ? (
                <Lock className="h-5 w-5 text-gray-500" />
              ) : (
                <Globe className="h-5 w-5 text-gray-500" />
              )}
            </div>
            {playlist.description && (
              <p className="mt-2 text-gray-600">{playlist.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <span>{playlist.user.name}</span>
              <span>-</span>
              <span>{playlist.videoCount} videos</span>
              <span>-</span>
              <span>
                {playlist.visibility === "PRIVATE" ? "Private" : "Public"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video List */}
      {playlist.videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlist.videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              No videos in this playlist
            </p>
            {isOwner && (
              <p className="mt-1 text-sm text-gray-600">
                Add videos to get started
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Playlist</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Playlist title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Visibility</label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="UNLISTED">Unlisted</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving || !editTitle.trim()}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Share Playlist</h2>
              <button onClick={() => setShowShareModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Share this playlist with others</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/playlist/${playlist.id}`}
                className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <Button onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/playlist/${playlist.id}`)}&text=${encodeURIComponent(`Check out this playlist: ${playlist.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-blue-400 p-3 text-white hover:bg-blue-500"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/playlist/${playlist.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-blue-600 p-3 text-white hover:bg-blue-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
