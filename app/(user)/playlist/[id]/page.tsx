import { auth } from "@/lib/auth/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"
import { Button } from "@/components/shared/ui/button"
import { Share2, Edit, Trash2, Lock, Globe } from "lucide-react"

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      videos: {
        include: {
          video: {
            include: {
              channel: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                  avatar: true,
                  verified: true,
                },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  })

  if (!playlist) {
    notFound()
  }

  // Check if user has access to this playlist
  if (playlist.visibility === "PRIVATE" && playlist.userId !== session?.user?.id) {
    redirect("/")
  }

  const isOwner = session?.user?.id === playlist.userId

  return (
    <div>
      {/* Playlist Header */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{playlist.title}</h1>
              {playlist.visibility === "PRIVATE" ? (
                <Lock className="h-5 w-5 text-gray-500" />
              ) : (
                <Globe className="h-5 w-5 text-gray-500" />
              )}
            </div>
            {playlist.description && (
              <p className="mt-2 text-gray-600">{playlist.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <span>{playlist.user.name}</span>
              <span>•</span>
              <span>{playlist.videoCount} videos</span>
              <span>•</span>
              <span>
                {playlist.visibility === "PRIVATE" ? "Private" : "Public"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video List */}
      {playlist.videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlist.videos.map((item) => (
            <VideoCard key={item.id} video={item.video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              No videos in this playlist
            </p>
            {isOwner && (
              <p className="mt-1 text-sm text-gray-600">
                Add videos to get started
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
