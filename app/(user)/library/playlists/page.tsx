import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import PlaylistsClient from "./PlaylistsClient"

export default async function PlaylistsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id },
    include: {
      videos: {
        take: 1,
        include: {
          video: {
            select: {
              thumbnailUrl: true,
            },
          },
        },
      },
      _count: {
        select: { videos: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const playlistsData = playlists.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    visibility: p.visibility,
    videoCount: p._count.videos,
    thumbnailUrl: p.videos[0]?.video?.thumbnailUrl || null,
  }))

  return <PlaylistsClient initialPlaylists={playlistsData} />
}
