"use client"

import { useState } from "react"
import { X, Copy, Check, Facebook, Twitter } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  title: string
}

export function ShareModal({ isOpen, onClose, videoId, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const videoUrl = typeof window !== "undefined"
    ? `${window.location.origin}/watch/${videoId}`
    : `/watch/${videoId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out this video: ${title}`)
    const url = encodeURIComponent(videoUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(videoUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Share</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Copy link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Copy link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrl}
                readOnly
                className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <Button onClick={handleCopy} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Social sharing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share to
            </label>
            <div className="flex gap-3">
              <button
                onClick={shareToTwitter}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50"
              >
                <Twitter className="h-5 w-5 text-blue-400" />
                <span className="text-sm">Twitter</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Facebook</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
