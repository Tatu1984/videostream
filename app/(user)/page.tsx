import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"
import { CategoryFilter } from "@/components/user/category-filter"
import { Suspense } from "react"

interface HomePageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category } = await searchParams

  const videos = await prisma.video.findMany({
    where: {
      visibility: "PUBLIC",
      processingStatus: "COMPLETED",
      ...(category && category !== "All" ? { category } : {}),
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
      <Suspense fallback={<div className="mb-6 h-10 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />}>
        <CategoryFilter />
      </Suspense>

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
