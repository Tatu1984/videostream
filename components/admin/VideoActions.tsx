"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Trash2 } from "lucide-react"
import Link from "next/link"

interface VideoActionsProps {
  videoId: string
}

export function VideoActions({ videoId }: VideoActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete video")
      }
    } catch (error) {
      console.error("Failed to delete video:", error)
      alert("Failed to delete video")
    }
    setDeleting(false)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/watch/${videoId}`}
        target="_blank"
        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
