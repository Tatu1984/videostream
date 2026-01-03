"use client"

import { useState } from "react"
import { VideoCard } from "@/components/user/video-card"
import { Loader2, ThumbsDown } from "lucide-react"

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

interface LikeItem {
  id: string
  video: Video | null
}

interface LikedVideosClientProps {
  initialLikes: LikeItem[]
}

export default function LikedVideosClient({ initialLikes }: LikedVideosClientProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleUnlike = async (videoId: string) => {
    setRemovingId(videoId)
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LIKE" }),
      })
      if (res.ok) {
        setLikes(likes.filter((like) => like.video?.id !== videoId))
      }
    } catch (err) {
      console.error("Failed to unlike video:", err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Liked Videos</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{likes.length} videos</p>
      </div>

      {likes.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likes.map(
            (like) =>
              like.video && (
                <div key={like.id} className="group relative">
                  <VideoCard video={like.video} />
                  <button
                    onClick={() => handleUnlike(like.video!.id)}
                    disabled={removingId === like.video.id}
                    className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100 disabled:opacity-50"
                    title="Unlike video"
                  >
                    {removingId === like.video.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )
          )}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No liked videos yet</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Videos you like will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
