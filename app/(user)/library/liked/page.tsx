import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"

export default async function LikedVideosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const likes = await prisma.like.findMany({
    where: {
      userId: session.user.id,
      type: "LIKE",
      targetType: "VIDEO",
    },
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
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Liked Videos</h1>
        <p className="mt-1 text-gray-600">
          {likes.length} videos
        </p>
      </div>

      {likes.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likes.map((like) => (
            like.video && <VideoCard key={like.id} video={like.video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              No liked videos yet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Videos you like will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
