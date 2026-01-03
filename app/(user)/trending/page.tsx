import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"

const tabs = ["All", "Music", "Gaming", "Sports", "News", "Movies"]

export default async function TrendingPage() {
  // Get trending videos (sorted by views in last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const videos = await prisma.video.findMany({
    where: {
      visibility: "PUBLIC",
      processingStatus: "COMPLETED",
      createdAt: {
        gte: sevenDaysAgo,
      },
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
    orderBy: {
      viewCount: "desc",
    },
    take: 50,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Trending</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          See what's trending across MeTube
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              index === 0
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Videos */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No trending videos yet
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Check back later
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
