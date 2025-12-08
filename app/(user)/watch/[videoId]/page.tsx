import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VideoPlayer } from "@/components/shared/video/video-player"
import { ThumbsUp, ThumbsDown, Share2, Flag, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { VideoCard } from "@/components/user/video-card"
import { formatDistanceToNow } from "date-fns"

function formatViews(views: bigint): string {
  const num = Number(views)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>
}) {
  const { videoId } = await params
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatar: true,
          verified: true,
          subscriberCount: true,
        },
      },
      assets: {
        where: { type: "VIDEO" },
        orderBy: { resolution: "desc" },
      },
      chapters: {
        orderBy: { timestamp: "asc" },
      },
    },
  })

  if (!video) {
    notFound()
  }

  // Get suggested videos
  const suggestedVideos = await prisma.video.findMany({
    where: {
      id: { not: video.id },
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
    take: 10,
    orderBy: { viewCount: "desc" },
  })

  const videoSource = video.assets.find((a) => a.type === "VIDEO")?.url

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2">
        <VideoPlayer
          src={videoSource}
          poster={video.thumbnailUrl || undefined}
          title={video.title}
        />

        {/* Video info */}
        <div className="mt-4">
          <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">
                  {video.channel.avatar ? (
                    <img
                      src={video.channel.avatar}
                      alt={video.channel.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-medium text-gray-600">
                      {video.channel.name[0]}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">
                      {video.channel.name}
                    </h3>
                    {video.channel.verified && (
                      <svg
                        className="ml-1 h-4 w-4 text-gray-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatViews(BigInt(video.channel.subscriberCount))} subscribers
                  </p>
                </div>
              </div>

              <Button>Subscribe</Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center divide-x divide-gray-300 rounded-full bg-gray-100">
                <button className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 rounded-l-full">
                  <ThumbsUp className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {video.likeCount}
                  </span>
                </button>
                <button className="px-4 py-2 hover:bg-gray-200 rounded-r-full">
                  <ThumbsDown className="h-5 w-5" />
                </button>
              </div>

              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <Flag className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 rounded-lg bg-gray-100 p-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
              <span>{formatViews(video.viewCount)} views</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(video.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {video.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {video.description}
              </p>
            )}
          </div>

          {/* Comments section placeholder */}
          <div className="mt-6">
            <h3 className="text-lg font-medium">Comments</h3>
            <p className="mt-2 text-sm text-gray-600">
              Comments feature coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar - Suggested videos */}
      <div className="space-y-4">
        {suggestedVideos.map((suggestedVideo) => (
          <div key={suggestedVideo.id} className="flex gap-2">
            <VideoCard video={suggestedVideo} />
          </div>
        ))}
      </div>
    </div>
  )
}
