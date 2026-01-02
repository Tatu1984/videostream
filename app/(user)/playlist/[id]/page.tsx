import { auth } from "@/lib/auth/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import PlaylistDetailClient from "./PlaylistDetailClient"

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

  const playlistData = {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    visibility: playlist.visibility,
    videoCount: playlist.videoCount,
    user: playlist.user,
    videos: playlist.videos.map((item) => ({
      ...item.video,
      viewCount: item.video.viewCount,
      createdAt: item.video.createdAt,
    })),
  }

  return <PlaylistDetailClient playlist={playlistData} isOwner={isOwner} />
}
