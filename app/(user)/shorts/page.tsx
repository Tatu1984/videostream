"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MessageCircle, Share2 } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

// Mock data for demonstration
const mockShorts = [
  {
    id: "1",
    title: "Amazing Dance Moves",
    url: "/placeholder-short.mp4",
    likes: 12500,
    comments: 340,
    channel: {
      name: "DanceStudio",
      avatar: null,
    },
  },
  {
    id: "2",
    title: "Quick Cooking Hack",
    url: "/placeholder-short2.mp4",
    likes: 8900,
    comments: 156,
    channel: {
      name: "CookingPro",
      avatar: null,
    },
  },
]

export default function ShortsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentShort = mockShorts[currentIndex]

  const handleNextShort = () => {
    if (currentIndex < mockShorts.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevShort = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black pt-14">
      <div className="relative mx-auto h-[calc(100vh-3.5rem)] max-w-md">
        {/* Video Container */}
        <div className="relative h-full w-full overflow-hidden bg-gray-900">
          {/* Placeholder for video */}
          <div className="flex h-full w-full items-center justify-center text-white">
            <div className="text-center">
              <p className="text-lg">Short Video Player</p>
              <p className="mt-2 text-sm text-gray-400">{currentShort.title}</p>
              <p className="mt-1 text-xs text-gray-500">
                Video {currentIndex + 1} of {mockShorts.length}
              </p>
            </div>
          </div>

          {/* Overlay Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <div className="flex items-end justify-between">
              {/* Left side - Info */}
              <div className="flex-1 text-white">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-700">
                    {currentShort.channel.avatar ? (
                      <img
                        src={currentShort.channel.avatar}
                        alt={currentShort.channel.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs">
                        {currentShort.channel.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {currentShort.channel.name}
                  </span>
                  <Button size="sm" className="h-7 rounded-full px-4 text-xs">
                    Follow
                  </Button>
                </div>
                <p className="text-sm">{currentShort.title}</p>
              </div>

              {/* Right side - Actions */}
              <div className="ml-4 flex flex-col items-center space-y-4">
                <button className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80">
                    <ThumbsUp className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-xs text-white">
                    {(currentShort.likes / 1000).toFixed(1)}K
                  </span>
                </button>

                <button className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80">
                    <ThumbsDown className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-xs text-white">Dislike</span>
                </button>

                <button className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-1 text-xs text-white">
                    {currentShort.comments}
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

          {/* Navigation (optional) */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-64 opacity-0 transition-opacity hover:opacity-100">
            {currentIndex > 0 && (
              <button
                onClick={handlePrevShort}
                className="rounded-full bg-white/20 p-2 backdrop-blur-sm"
              >
                ↑
              </button>
            )}
            {currentIndex < mockShorts.length - 1 && (
              <button
                onClick={handleNextShort}
                className="rounded-full bg-white/20 p-2 backdrop-blur-sm"
              >
                ↓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
