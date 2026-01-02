"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Check, Trash2, Settings, CheckCheck } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  videoId?: string
  channelId?: string
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchNotifications()
    }
  }, [status, router])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=50")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setTotal(data.total || 0)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      })

      const notification = notifications.find((n) => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      setNotifications(notifications.filter((n) => n.id !== notificationId))
      setTotal((t) => t - 1)
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await fetch("/api/notifications?all=true", {
        method: "DELETE",
      })

      setNotifications([])
      setTotal(0)
      setUnreadCount(0)
    } catch (error) {
      console.error("Error deleting all notifications:", error)
    }
  }

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    if (notification.videoId) {
      router.push(`/watch/${notification.videoId}`)
    } else if (notification.channelId) {
      router.push(`/channel/${notification.channelId}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_VIDEO":
        return "🎬"
      case "LIVE_STREAM":
        return "🔴"
      case "COMMENT_REPLY":
        return "💬"
      case "MENTION":
        return "@"
      case "SUBSCRIPTION":
        return "🔔"
      case "LIKE":
        return "👍"
      case "CHANNEL_UPDATE":
        return "📢"
      default:
        return "📌"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Link href="/settings/notifications">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h2 className="text-xl font-semibold">No notifications</h2>
            <p className="mt-2 text-gray-600">
              You&apos;ll see notifications for new videos, comments, and more here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group flex items-start gap-4 rounded-lg border bg-white p-4 transition-colors ${
                  notification.read ? "" : "border-blue-200 bg-blue-50"
                }`}
              >
                {/* Icon */}
                <span className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </span>

                {/* Content */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleClick(notification)}
                >
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="rounded p-2 hover:bg-gray-100"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="rounded p-2 text-red-600 hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Delete All Button */}
            {notifications.length > 0 && (
              <div className="pt-4 text-center">
                <Button variant="ghost" onClick={handleDeleteAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear all notifications
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
