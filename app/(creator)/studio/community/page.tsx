"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  PenSquare,
  Image,
  BarChart3,
  Video,
  MoreVertical,
  Trash2,
  ThumbsUp,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { formatDistanceToNow } from "date-fns"

interface Channel {
  id: string
  name: string
  handle: string
  avatar: string | null
}

interface CommunityPost {
  id: string
  type: string
  content: string
  mediaUrls: string[]
  pollOptions: string[]
  likeCount: number
  commentCount: number
  createdAt: string
  channel: Channel
}

export default function CommunityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState("")
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  // New post form
  const [showForm, setShowForm] = useState(false)
  const [postType, setPostType] = useState("TEXT")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchChannels()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedChannel) {
      fetchPosts()
    }
  }, [selectedChannel])

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/channels")
      if (res.ok) {
        const data = await res.json()
        setChannels(data.channels || [])
        if (data.channels?.length > 0) {
          setSelectedChannel(data.channels[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching channels:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/community-posts?channelId=${selectedChannel}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
  }

  const handleCreatePost = async () => {
    if (!content.trim() || !selectedChannel) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/community-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannel,
          type: postType,
          content,
        }),
      })

      if (res.ok) {
        const post = await res.json()
        setPosts([post, ...posts])
        setContent("")
        setShowForm(false)
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community-posts?id=${postId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId))
      }
    } catch (error) {
      console.error("Error deleting post:", error)
    }
    setShowMenu(null)
  }

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community-posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      })

      if (res.ok) {
        const data = await res.json()
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, likeCount: data.likeCount } : p
          )
        )
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <PenSquare className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="text-xl font-semibold">No channel found</h2>
        <p className="mt-2 text-gray-600">Create a channel first</p>
        <Button className="mt-4" onClick={() => router.push("/studio/channel/new")}>
          Create Channel
        </Button>
      </div>
    )
  }

  const currentChannel = channels.find((c) => c.id === selectedChannel)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Community</h1>
            <p className="text-gray-600">Connect with your audience</p>
          </div>

          {channels.length > 1 && (
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Create Post */}
        {!showForm ? (
          <div
            className="mb-6 cursor-pointer rounded-lg border bg-white p-4 hover:bg-gray-50"
            onClick={() => setShowForm(true)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">
                {currentChannel?.avatar ? (
                  <img
                    src={currentChannel.avatar}
                    alt={currentChannel.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-medium">
                    {currentChannel?.name[0]}
                  </div>
                )}
              </div>
              <p className="text-gray-500">Create a post...</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">
                {currentChannel?.avatar ? (
                  <img
                    src={currentChannel.avatar}
                    alt={currentChannel.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-medium">
                    {currentChannel?.name[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{currentChannel?.name}</p>
                <p className="text-xs text-gray-500">@{currentChannel?.handle}</p>
              </div>
            </div>

            {/* Post Type Tabs */}
            <div className="mb-4 flex gap-2 border-b">
              <button
                onClick={() => setPostType("TEXT")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  postType === "TEXT"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <PenSquare className="h-4 w-4" />
                Text
              </button>
              <button
                onClick={() => setPostType("IMAGE")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  postType === "IMAGE"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <Image className="h-4 w-4" />
                Image
              </button>
              <button
                onClick={() => setPostType("POLL")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  postType === "POLL"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Poll
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost} disabled={!content.trim() || submitting}>
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-lg border bg-white py-12 text-center">
              <PenSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h2 className="text-xl font-semibold">No posts yet</h2>
              <p className="mt-2 text-gray-600">
                Create your first community post
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">
                      {post.channel.avatar ? (
                        <img
                          src={post.channel.avatar}
                          alt={post.channel.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-medium">
                          {post.channel.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{post.channel.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowMenu(showMenu === post.id ? null : post.id)
                      }
                      className="rounded-full p-2 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {showMenu === post.id && (
                      <div className="absolute right-0 top-full z-10 w-40 rounded-lg border bg-white py-1 shadow-lg">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap">{post.content}</p>

                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {post.mediaUrls.map((url, i) => (
                      <img key={i} src={url} alt="" className="rounded-lg" />
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-6 text-gray-600">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    {post.likeCount}
                  </button>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {post.commentCount}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
