"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface LikeButtonProps {
  videoId: string
  initialLikeCount: number
  initialDislikeCount: number
}

type LikeState = "LIKE" | "DISLIKE" | null

export function LikeButton({
  videoId,
  initialLikeCount,
  initialDislikeCount,
}: LikeButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [likeState, setLikeState] = useState<LikeState>(null)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount)
  const [loading, setLoading] = useState(false)

  const handleLike = async (type: "LIKE" | "DISLIKE") => {
    if (!session?.user) {
      router.push("/auth/signin")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (res.ok) {
        const data = await res.json()

        if (data.message === "Removed") {
          // Removed the like/dislike
          if (type === "LIKE") {
            setLikeCount((c) => c - 1)
          } else {
            setDislikeCount((c) => c - 1)
          }
          setLikeState(null)
        } else if (data.message === "Updated") {
          // Changed from like to dislike or vice versa
          if (type === "LIKE") {
            setLikeCount((c) => c + 1)
            setDislikeCount((c) => c - 1)
          } else {
            setLikeCount((c) => c - 1)
            setDislikeCount((c) => c + 1)
          }
          setLikeState(type)
        } else {
          // New like/dislike
          if (type === "LIKE") {
            setLikeCount((c) => c + 1)
          } else {
            setDislikeCount((c) => c + 1)
          }
          setLikeState(type)
        }
      }
    } catch (error) {
      console.error("Error liking video:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center divide-x divide-gray-300 rounded-full bg-gray-100">
      <button
        onClick={() => handleLike("LIKE")}
        disabled={loading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-l-full transition-colors ${
          likeState === "LIKE"
            ? "bg-gray-200 text-blue-600"
            : "hover:bg-gray-200"
        }`}
      >
        <ThumbsUp
          className={`h-5 w-5 ${likeState === "LIKE" ? "fill-current" : ""}`}
        />
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
      <button
        onClick={() => handleLike("DISLIKE")}
        disabled={loading}
        className={`px-4 py-2 rounded-r-full transition-colors ${
          likeState === "DISLIKE"
            ? "bg-gray-200 text-blue-600"
            : "hover:bg-gray-200"
        }`}
      >
        <ThumbsDown
          className={`h-5 w-5 ${likeState === "DISLIKE" ? "fill-current" : ""}`}
        />
      </button>
    </div>
  )
}
