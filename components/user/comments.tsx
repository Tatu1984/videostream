"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import {
  ThumbsUp,
  MessageSquare,
  MoreVertical,
  Pin,
  Heart,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Edit2,
  X,
} from "lucide-react"
import { Button } from "@/components/shared/ui/button"

interface User {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

interface Comment {
  id: string
  content: string
  userId: string
  user: User
  likeCount: number
  pinned: boolean
  hearted: boolean
  createdAt: string
  replies?: Comment[]
}

interface CommentsProps {
  videoId: string
  channelOwnerId: string
  commentCount: number
}

export function Comments({ videoId, channelOwnerId, commentCount }: CommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"top" | "newest">("top")
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [videoId, sortBy])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/comments?sort=${sortBy}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        const comment = await res.json()
        setComments([comment, ...comments])
        setNewComment("")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !session?.user) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId }),
      })

      if (res.ok) {
        const reply = await res.json()
        setComments(
          comments.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c
          )
        )
        setReplyingTo(null)
        setReplyContent("")
        setExpandedReplies((prev) => new Set(prev).add(parentId))
      }
    } catch (error) {
      console.error("Error posting reply:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/videos/${videoId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
    setShowDropdown(null)
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (res.ok) {
        const updated = await res.json()
        setComments(
          comments.map((c) => (c.id === commentId ? { ...c, content: updated.content } : c))
        )
        setEditingComment(null)
        setEditContent("")
      }
    } catch (error) {
      console.error("Error editing comment:", error)
    }
  }

  const handlePinComment = async (commentId: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      })

      if (res.ok) {
        setComments(
          comments.map((c) => ({
            ...c,
            pinned: c.id === commentId ? !pinned : false,
          }))
        )
      }
    } catch (error) {
      console.error("Error pinning comment:", error)
    }
    setShowDropdown(null)
  }

  const handleHeartComment = async (commentId: string, hearted: boolean) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hearted: !hearted }),
      })

      if (res.ok) {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, hearted: !hearted } : c
          )
        )
      }
    } catch (error) {
      console.error("Error hearting comment:", error)
    }
    setShowDropdown(null)
  }

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user) return

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      })

      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, likeCount: c.likeCount + 1 } : c
        )
      )
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const isChannelOwner = session?.user?.id === channelOwnerId

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment
    isReply?: boolean
  }) => {
    const isOwner = session?.user?.id === comment.userId

    return (
      <div className={`flex gap-3 ${isReply ? "ml-12 mt-3" : ""}`}>
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-300">
          {comment.user.image ? (
            <img
              src={comment.user.image}
              alt={comment.user.name || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-medium text-gray-600">
              {(comment.user.name || "U")[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              @{comment.user.username || comment.user.name || "user"}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
            {comment.pinned && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
          </div>

          {editingComment === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                rows={3}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEditComment(comment.id)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingComment(null)
                    setEditContent("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ThumbsUp className="h-4 w-4" />
              {comment.likeCount > 0 && (
                <span className="text-xs">{comment.likeCount}</span>
              )}
            </button>

            {comment.hearted && (
              <span className="flex items-center gap-1 text-red-500">
                <Heart className="h-4 w-4 fill-current" />
              </span>
            )}

            {!isReply && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id)
                  setReplyContent("")
                }}
                className="text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Reply
              </button>
            )}

            {(isOwner || isChannelOwner) && (
              <div className="relative">
                <button
                  onClick={() =>
                    setShowDropdown(
                      showDropdown === comment.id ? null : comment.id
                    )
                  }
                  className="text-gray-600 hover:text-gray-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showDropdown === comment.id && (
                  <div className="absolute right-0 top-6 z-10 w-40 rounded-lg border bg-white py-1 shadow-lg">
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditingComment(comment.id)
                          setEditContent(comment.content)
                          setShowDropdown(null)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                    )}
                    {isChannelOwner && !isReply && (
                      <>
                        <button
                          onClick={() =>
                            handlePinComment(comment.id, comment.pinned)
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Pin className="h-4 w-4" />
                          {comment.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() =>
                            handleHeartComment(comment.id, comment.hearted)
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Heart className="h-4 w-4" />
                          {comment.hearted ? "Remove heart" : "Heart"}
                        </button>
                      </>
                    )}
                    {(isOwner || isChannelOwner) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim() || submitting}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyContent("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Replies */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => toggleReplies(comment.id)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {expandedReplies.has(comment.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {comment.replies.length}{" "}
                {comment.replies.length === 1 ? "reply" : "replies"}
              </button>

              {expandedReplies.has(comment.id) && (
                <div className="mt-2 space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium">{commentCount} Comments</h3>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{commentCount} Comments</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "top" | "newest")}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="top">Top comments</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {/* Add comment form */}
      {session?.user ? (
        <form onSubmit={handleSubmitComment} className="mt-4 flex gap-3">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-300">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "You"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-medium text-gray-600">
                {(session.user.name || "U")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border-b border-gray-300 pb-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            {newComment && (
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewComment("")}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  Comment
                </Button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-gray-600">
          Please sign in to comment
        </p>
      )}

      {/* Comments list */}
      <div className="mt-6 space-y-6">
        {comments
          .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
          .map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

        {comments.length === 0 && (
          <p className="py-8 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}
