"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Clock, Check } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface WatchLaterButtonProps {
  videoId: string
  variant?: "icon" | "full"
}

export function WatchLaterButton({
  videoId,
  variant = "icon",
}: WatchLaterButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [inWatchLater, setInWatchLater] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      checkWatchLater()
    }
  }, [session?.user, videoId])

  const checkWatchLater = async () => {
    try {
      const res = await fetch(`/api/watch-later?videoId=${videoId}`)
      if (res.ok) {
        const data = await res.json()
        setInWatchLater(data.inWatchLater)
      }
    } catch (error) {
      console.error("Error checking watch later:", error)
    }
  }

  const handleToggle = async () => {
    if (!session?.user) {
      router.push("/auth/signin")
      return
    }

    setLoading(true)
    try {
      if (inWatchLater) {
        const res = await fetch(`/api/watch-later?videoId=${videoId}`, {
          method: "DELETE",
        })
        if (res.ok) {
          setInWatchLater(false)
        }
      } else {
        const res = await fetch("/api/watch-later", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        })
        if (res.ok) {
          setInWatchLater(true)
        }
      }
    } catch (error) {
      console.error("Error toggling watch later:", error)
    } finally {
      setLoading(false)
    }
  }

  if (variant === "full") {
    return (
      <Button
        variant={inWatchLater ? "outline" : "ghost"}
        onClick={handleToggle}
        disabled={loading}
        className="gap-2"
      >
        {inWatchLater ? (
          <>
            <Check className="h-4 w-4" />
            Saved
          </>
        ) : (
          <>
            <Clock className="h-4 w-4" />
            Save
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      title={inWatchLater ? "Remove from Watch Later" : "Save to Watch Later"}
    >
      {inWatchLater ? (
        <Check className="h-5 w-5 text-blue-600" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
    </Button>
  )
}
