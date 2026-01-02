"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shared/ui/button"
import { X, Loader2, Plus, Check } from "lucide-react"

interface Playlist {
  id: string
  title: string
  visibility: string
  hasVideo?: boolean
}

interface AddToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
}

export function AddToPlaylistModal({ isOpen, onClose, videoId }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists()
    }
  }, [isOpen, videoId])

  const fetchPlaylists = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/playlists?videoId=${videoId}`)
      if (res.ok) {
        const data = await res.json()
        setPlaylists(data.playlists || [])
      }
    } catch (err) {
      console.error("Failed to fetch playlists:", err)
    } finally {
      setLoading(false)
    }
  }

  const togglePlaylist = async (playlistId: string, hasVideo: boolean) => {
    setSaving(playlistId)
    try {
      if (hasVideo) {
        await fetch(`/api/playlists/${playlistId}/videos?videoId=${videoId}`, {
          method: "DELETE",
        })
      } else {
        await fetch(`/api/playlists/${playlistId}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        })
      }
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, hasVideo: !hasVideo } : p))
      )
    } catch (err) {
      console.error("Failed to update playlist:", err)
    } finally {
      setSaving(null)
    }
  }

  const createPlaylist = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, visibility: "PRIVATE" }),
      })
      if (res.ok) {
        const data = await res.json()
        // Add video to new playlist
        await fetch(`/api/playlists/${data.playlist.id}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        })
        setPlaylists((prev) => [{ ...data.playlist, hasVideo: true }, ...prev])
        setNewTitle("")
        setShowCreate(false)
      }
    } catch (err) {
      console.error("Failed to create playlist:", err)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Save to playlist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => togglePlaylist(playlist.id, !!playlist.hasVideo)}
                  disabled={saving === playlist.id}
                  className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{playlist.title}</p>
                    <p className="text-xs text-gray-500">{playlist.visibility}</p>
                  </div>
                  {saving === playlist.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : playlist.hasVideo ? (
                    <Check className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              ))}

              {playlists.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">
                  No playlists yet
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          {showCreate ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playlist name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={createPlaylist} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create new playlist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
