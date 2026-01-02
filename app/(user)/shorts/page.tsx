"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreVertical,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface Short {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  likeCount: number
  dislikeCount: number
  commentCount: number
  viewCount: bigint
  channel: {
    id: string
    name: string
    handle: string
    avatar: string | null
  }
  assets: {
    url: string
    type: string
  }[]
}

export default function ShortsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [shorts, setShorts] = useState<Short[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [muted, setMuted] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchShorts()
  }, [])

  const fetchShorts = async () => {
    try {
      const res = await fetch("/api/videos?type=SHORT&limit=20")
      if (res.ok) {
        const data = await res.json()
        setShorts(data.videos || [])
      }
    } catch (error) {
      console.error("Error fetching shorts:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentShort = shorts[currentIndex]

  const handleScroll = useCallback(
    (direction: "up" | "down") => {
      if (direction === "down" && currentIndex < shorts.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (direction === "up" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    },
    [currentIndex, shorts.length]
  )

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 50) {
        handleScroll("down")
      } else if (e.deltaY < -50) {
        handleScroll("up")
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        handleScroll("down")
      } else if (e.key === "ArrowUp") {
        handleScroll("up")
      } else if (e.key === " ") {
        e.preventDefault()
        togglePlay()
      } else if (e.key === "m") {
        setMuted((prev) => !prev)
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: true })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleScroll])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      if (playing) {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [currentIndex])

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  const handleLike = async (type: "LIKE" | "DISLIKE") => {
    if (!session?.user) {
      router.push("/auth/signin")
      return
    }

    if (!currentShort) return

    try {
      await fetch(`/api/videos/${currentShort.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (type === "LIKE") {
        setLikedShorts((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(currentShort.id)) {
            newSet.delete(currentShort.id)
          } else {
            newSet.add(currentShort.id)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error("Error liking short:", error)
    }
  }

  const handleSubscribe = async () => {
    if (!session?.user) {
      router.push("/auth/signin")
      return
    }

    if (!currentShort) return

    try {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: currentShort.channel.id }),
      })
    } catch (error) {
      console.error("Error subscribing:", error)
    }
  }

  const formatCount = (count: number | bigint) => {
    const num = Number(count)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black pt-14">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black pt-14 text-white">
        <Play className="mb-4 h-16 w-16 text-gray-500" />
        <h2 className="text-xl font-semibold">No Shorts available</h2>
        <p className="mt-2 text-gray-400">Check back later for new content</p>
      </div>
    )
  }

  const videoUrl = currentShort?.assets?.find((a) => a.type === "VIDEO")?.url

  return (
    <div className="fixed inset-0 bg-black pt-14" ref={containerRef}>
      <div className="relative mx-auto h-[calc(100vh-3.5rem)] max-w-md">
        {/* Video Container */}
        <div className="relative h-full w-full overflow-hidden bg-gray-900">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full object-contain"
              loop
              muted={muted}
              playsInline
              autoPlay
              onClick={togglePlay}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {currentShort?.thumbnailUrl ? (
                <img
                  src={currentShort.thumbnailUrl}
                  alt={currentShort.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-white">
                  <p className="text-lg">{currentShort?.title}</p>
                </div>
              )}
            </div>
          )}

          {/* Play/Pause Overlay */}
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-20 w-20 text-white/80" />
            </div>
          )}

          {/* Top Controls */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className="rounded-full bg-black/50 p-2"
            >
              {muted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
            <button className="rounded-full bg-black/50 p-2">
              <MoreVertical className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1">
            {shorts.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-1 rounded-full transition-all ${
                  index === currentIndex ? "h-4 bg-white" : "bg-gray-500"
                }`}
              />
            ))}
          </div>

          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <div className="flex items-end justify-between">
              {/* Left side - Info */}
              <div className="flex-1 text-white">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-700">
                    {currentShort?.channel.avatar ? (
                      <img
                        src={currentShort.channel.avatar}
                        alt={currentShort.channel.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm">
                        {currentShort?.channel.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    @{currentShort?.channel.handle}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSubscribe}
                    className="h-7 rounded-full px-4 text-xs"
                  >
                    Subscribe
                  </Button>
                </div>
                <p className="line-clamp-2 text-sm">{currentShort?.title}</p>
                {currentShort?.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-300">
                    {currentShort.description}
                  </p>
                )}
              </div>

              {/* Right side - Actions */}
              <div className="ml-4 flex flex-col items-center space-y-4">
                <button
                  onClick={() => handleLike("LIKE")}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      likedShorts.has(currentShort?.id || "")
                        ? "bg-blue-600"
                        : "bg-gray-800/80"
                    }`}
                  >
                    <ThumbsUp
                      className={`h-6 w-6 ${
                        likedShorts.has(currentShort?.id || "")
                          ? "fill-white text-white"
                          : "text-white"
                      }`}
                    />
                  </div>
                  <span className="mt-1 text-xs text-white">
                    {formatCount(currentShort?.likeCount || 0)}
                  </span>
                </button>

                <button
                  onClick={() => handleLike("DISLIKE")}
                  className="flex flex-col items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80">
                    <ThumbsDown className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-xs text-white">Dislike</span>
                </button>

                <button
                  onClick={() => router.push(`/watch/${currentShort?.id}`)}
                  className="flex flex-col items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-xs text-white">
                    {formatCount(currentShort?.commentCount || 0)}
                  </span>
                </button>

                <button className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-xs text-white">Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Hints */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            <p>↑ Previous</p>
            <p className="mt-2">↓ Next</p>
          </div>
        </div>
      </div>
    </div>
  )
}
