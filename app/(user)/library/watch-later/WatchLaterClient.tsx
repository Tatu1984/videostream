"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VideoCard } from "@/components/user/video-card"
import { Button } from "@/components/shared/ui/button"
import { Loader2, X } from "lucide-react"

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  duration: number | null
  viewCount: bigint
  createdAt: Date
  channel: {
    id: string
    name: string
    handle: string
    avatar: string | null
    verified: boolean
  }
}

interface WatchLaterItem {
  id: string
  video: Video
}

interface WatchLaterClientProps {
  initialItems: WatchLaterItem[]
}

export default function WatchLaterClient({ initialItems }: WatchLaterClientProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [clearing, setClearing] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (videoId: string) => {
    setRemovingId(videoId)
    try {
      const res = await fetch(`/api/user/watch-later?videoId=${videoId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setItems(items.filter((item) => item.video.id !== videoId))
      }
    } catch (err) {
      console.error("Failed to remove from watch later:", err)
    } finally {
      setRemovingId(null)
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your watch later list?")) {
      return
    }

    setClearing(true)
    try {
      const res = await fetch("/api/user/watch-later", {
        method: "DELETE",
      })
      if (res.ok) {
        setItems([])
        router.refresh()
      }
    } catch (err) {
      console.error("Failed to clear watch later:", err)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Watch Later</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{items.length} videos saved</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={handleClearAll} disabled={clearing}>
            {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Clear All
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <VideoCard video={item.video} />
              <button
                onClick={() => handleRemove(item.video.id)}
                disabled={removingId === item.video.id}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100 disabled:opacity-50"
                title="Remove from Watch Later"
              >
                {removingId === item.video.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No videos saved</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Videos you save for later will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
