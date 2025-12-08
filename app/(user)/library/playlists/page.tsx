import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { ListVideo, Lock, Globe } from "lucide-react"
import { Button } from "@/components/shared/ui/button"

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playlists</h1>
          <p className="mt-1 text-gray-600">
            {playlists.length} playlists
          </p>
        </div>
        <Button>New Playlist</Button>
      </div>

      {playlists.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group rounded-lg border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-200">
                {playlist.videos[0]?.video?.thumbnailUrl ? (
                  <img
                    src={playlist.videos[0].video.thumbnailUrl}
                    alt={playlist.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ListVideo className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <ListVideo className="mx-auto h-8 w-8 mb-1" />
                    <p className="text-sm font-medium">{playlist._count.videos} videos</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {playlist.title}
                </h3>
                {playlist.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {playlist.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  {playlist.visibility === "PRIVATE" ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <ListVideo className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              No playlists yet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Create playlists to organize your favorite videos
            </p>
            <Button className="mt-4">Create Playlist</Button>
          </div>
        </div>
      )}
    </div>
  )
}
