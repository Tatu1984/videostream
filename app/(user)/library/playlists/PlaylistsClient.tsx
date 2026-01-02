"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ListVideo, Lock, Globe } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { CreatePlaylistModal } from "@/components/shared/modals/create-playlist-modal"

interface Playlist {
  id: string
  title: string
  description: string | null
  visibility: string
  videoCount: number
  thumbnailUrl: string | null
}

interface PlaylistsClientProps {
  initialPlaylists: Playlist[]
}

export default function PlaylistsClient({ initialPlaylists }: PlaylistsClientProps) {
  const router = useRouter()
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [showCreate, setShowCreate] = useState(false)

  const handleCreated = (playlist: { id: string; title: string }) => {
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playlists</h1>
          <p className="mt-1 text-gray-600">{playlists.length} playlists</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>New Playlist</Button>
      </div>

      {playlists.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group rounded-lg border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-200">
                {playlist.thumbnailUrl ? (
                  <img
                    src={playlist.thumbnailUrl}
                    alt={playlist.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ListVideo className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center text-white">
                    <ListVideo className="mx-auto mb-1 h-8 w-8" />
                    <p className="text-sm font-medium">{playlist.videoCount} videos</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {playlist.title}
                </h3>
                {playlist.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {playlist.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  {playlist.visibility === "PRIVATE" ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <ListVideo className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">No playlists yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Create playlists to organize your favorite videos
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              Create Playlist
            </Button>
          </div>
        </div>
      )}

      <CreatePlaylistModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
