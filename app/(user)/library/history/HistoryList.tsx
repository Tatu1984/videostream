"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shared/ui/button"
import Link from "next/link"

interface HistoryItem {
  id: string
  watchedAt: string
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
    channel: {
      name: string
      handle: string
      avatar: string | null
      verified: boolean
    }
  }
}

interface Props {
  initialHistory: HistoryItem[]
}

export default function HistoryList({ initialHistory }: Props) {
  const router = useRouter()
  const [history, setHistory] = useState(initialHistory)
  const [clearing, setClearing] = useState(false)

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all watch history?")) {
      return
    }

    setClearing(true)

    try {
      const res = await fetch("/api/user/history", {
        method: "DELETE",
      })

      if (res.ok) {
        setHistory([])
        router.refresh()
      }
    } catch (error) {
      console.error("Error clearing history:", error)
    } finally {
      setClearing(false)
    }
  }

  const handleRemoveItem = async (historyId: string) => {
    try {
      const res = await fetch(`/api/user/history?id=${historyId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== historyId))
      }
    } catch (error) {
      console.error("Error removing history item:", error)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watch History</h1>
          <p className="mt-1 text-gray-600">
            {history.length} videos
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" onClick={handleClearAll} disabled={clearing}>
            {clearing ? "Clearing..." : "Clear All History"}
          </Button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300"
            >
              <Link href={`/watch/${item.video.id}`} className="relative aspect-video w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                {item.video.thumbnailUrl ? (
                  <img
                    src={item.video.thumbnailUrl}
                    alt={item.video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    No thumbnail
                  </div>
                )}
              </Link>

              <div className="flex-1">
                <Link href={`/watch/${item.video.id}`}>
                  <h3 className="line-clamp-2 font-medium text-gray-900 hover:text-blue-600">
                    {item.video.title}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-gray-600">
                  {item.video.channel.name}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Watched {new Date(item.watchedAt).toLocaleDateString()}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id)}
                className="text-gray-400 hover:text-red-600"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              No watch history
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Videos you watch will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
