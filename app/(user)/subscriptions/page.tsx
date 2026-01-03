import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"

export default async function SubscriptionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: {
      channel: true,
    },
  })

  const channelIds = subscriptions.map((sub) => sub.channelId)

  const videos = await prisma.video.findMany({
    where: {
      channelId: { in: channelIds },
      visibility: "PUBLIC",
      processingStatus: "COMPLETED",
    },
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
    orderBy: { publishedAt: "desc" },
    take: 30,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Subscriptions</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Latest from your subscribed channels
        </p>
      </div>

      {/* Channel list */}
      {subscriptions.length > 0 && (
        <div className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex-shrink-0 text-center"
              >
                <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                  {sub.channel.avatar ? (
                    <img
                      src={sub.channel.avatar}
                      alt={sub.channel.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-medium text-gray-600 dark:text-gray-400">
                      {sub.channel.name[0]}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                  {sub.channel.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f]">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No subscriptions yet
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Subscribe to channels to see their latest videos here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
