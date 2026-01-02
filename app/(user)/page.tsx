import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"

const categories = ["All", "Music", "Gaming", "Sports", "News", "Education"]

export default async function HomePage() {
  const videos = await prisma.video.findMany({
    where: {
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
    orderBy: {
      createdAt: "desc",
    },
    take: 24,
  })

  return (
    <div>
      {/* Category chips */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              category === "All"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Video grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No videos yet</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Check back later for new content
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
