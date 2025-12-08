import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"
import { Button } from "@/components/shared/ui/button"

export default async function WatchLaterPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const watchLater = await prisma.watchLater.findMany({
    where: { userId: session.user.id },
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
    orderBy: { addedAt: "desc" },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watch Later</h1>
          <p className="mt-1 text-gray-600">
            {watchLater.length} videos saved
          </p>
        </div>
        {watchLater.length > 0 && (
          <Button variant="outline">Clear All</Button>
        )}
      </div>

      {watchLater.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchLater.map((item) => (
            <VideoCard key={item.id} video={item.video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              No videos saved
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Videos you save for later will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
