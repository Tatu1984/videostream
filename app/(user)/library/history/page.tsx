import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Button } from "@/components/shared/ui/button"

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId: session.user.id },
    include: {
      video: {
        include: {
          channel: {
            select: {
              name: true,
              handle: true,
              avatar: true,
              verified: true,
            },
          },
        },
      },
    },
    orderBy: { watchedAt: "desc" },
    take: 50,
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watch History</h1>
          <p className="mt-1 text-gray-600">
            {history.length} videos
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="outline">Clear All History</Button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300"
            >
              <div className="relative aspect-video w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                {item.video.thumbnailUrl ? (
                  <img
                    src={item.video.thumbnailUrl}
                    alt={item.video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    No thumbnail
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="line-clamp-2 font-medium text-gray-900">
                  {item.video.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {item.video.channel.name}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Watched {new Date(item.watchedAt).toLocaleDateString()}
                </p>
              </div>

              <Button variant="ghost" size="icon">
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              No watch history
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Videos you watch will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
