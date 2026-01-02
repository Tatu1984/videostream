"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, BellOff, BellRing, ChevronDown } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface SubscribeButtonProps {
  channelId: string
  channelName: string
  initialSubscribed?: boolean
}

type NotificationLevel = "ALL" | "PERSONALIZED" | "NONE"

export function SubscribeButton({
  channelId,
  channelName,
  initialSubscribed = false,
}: SubscribeButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed)
  const [notificationLevel, setNotificationLevel] =
    useState<NotificationLevel>("PERSONALIZED")
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (session?.user) {
      checkSubscription()
    }
  }, [session?.user, channelId])

  const checkSubscription = async () => {
    try {
      const res = await fetch(`/api/subscriptions?channelId=${channelId}`)
      if (res.ok) {
        const data = await res.json()
        setIsSubscribed(data.isSubscribed)
        if (data.notificationLevel) {
          setNotificationLevel(data.notificationLevel)
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
    }
  }

  const handleSubscribe = async () => {
    if (!session?.user) {
      router.push("/auth/signin")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, notificationLevel }),
      })

      if (res.ok) {
        const data = await res.json()
        setIsSubscribed(data.isSubscribed)
      }
    } catch (error) {
      console.error("Error managing subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNotificationLevel = async (level: NotificationLevel) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, notificationLevel: level }),
      })

      if (res.ok) {
        setNotificationLevel(level)
      }
    } catch (error) {
      console.error("Error updating notification level:", error)
    }
    setShowDropdown(false)
  }

  const NotificationIcon = () => {
    switch (notificationLevel) {
      case "ALL":
        return <BellRing className="h-4 w-4" />
      case "NONE":
        return <BellOff className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (!isSubscribed) {
    return (
      <Button onClick={handleSubscribe} disabled={loading}>
        {loading ? "..." : "Subscribe"}
      </Button>
    )
  }

  return (
    <div className="relative flex">
      <Button
        variant="outline"
        onClick={handleSubscribe}
        disabled={loading}
        className="rounded-r-none border-r-0"
      >
        Subscribed
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="rounded-l-none px-2"
      >
        <NotificationIcon />
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg">
          <button
            onClick={() => handleUpdateNotificationLevel("ALL")}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
              notificationLevel === "ALL" ? "bg-gray-50 font-medium" : ""
            }`}
          >
            <BellRing className="h-4 w-4" />
            All notifications
          </button>
          <button
            onClick={() => handleUpdateNotificationLevel("PERSONALIZED")}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
              notificationLevel === "PERSONALIZED" ? "bg-gray-50 font-medium" : ""
            }`}
          >
            <Bell className="h-4 w-4" />
            Personalized
          </button>
          <button
            onClick={() => handleUpdateNotificationLevel("NONE")}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
              notificationLevel === "NONE" ? "bg-gray-50 font-medium" : ""
            }`}
          >
            <BellOff className="h-4 w-4" />
            None
          </button>
          <hr className="my-1" />
          <button
            onClick={handleSubscribe}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Unsubscribe
          </button>
        </div>
      )}
    </div>
  )
}
