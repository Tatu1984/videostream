import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VideoPlayer } from "@/components/shared/video/video-player"
import { Share2, Flag, MoreHorizontal, Clock, ListPlus } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { VideoCard } from "@/components/user/video-card"
import { Comments } from "@/components/user/comments"
import { SubscribeButton } from "@/components/user/subscribe-button"
import { LikeButton } from "@/components/user/like-button"
import { WatchLaterButton } from "@/components/user/watch-later-button"
import { formatDistanceToNow } from "date-fns"
import { auth } from "@/lib/auth/auth"

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
  const session = await auth()

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
          ownerId: true,
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

  // Increment view count
  await prisma.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  })

  // Record watch history if user is logged in
  if (session?.user?.id) {
    await prisma.watchHistory.upsert({
      where: {
        id: `${session.user.id}-${videoId}`,
      },
      create: {
        id: `${session.user.id}-${videoId}`,
        userId: session.user.id,
        videoId: videoId,
      },
      update: {
        watchedAt: new Date(),
      },
    }).catch(() => {
      // Ignore errors if watch history doesn't exist
    })
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
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
                    <a
                      href={`/channel/${video.channel.id}`}
                      className="font-medium text-gray-900 hover:text-gray-700"
                    >
                      {video.channel.name}
                    </a>
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

              <SubscribeButton
                channelId={video.channel.id}
                channelName={video.channel.name}
              />
            </div>

            <div className="flex items-center space-x-2">
              <LikeButton
                videoId={video.id}
                initialLikeCount={video.likeCount}
                initialDislikeCount={video.dislikeCount}
              />

              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>

              <WatchLaterButton videoId={video.id} />

              <Button variant="ghost" size="icon">
                <ListPlus className="h-5 w-5" />
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

            {video.tags && video.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Chapters */}
          {video.chapters && video.chapters.length > 0 && (
            <div className="mt-4 rounded-lg border p-4">
              <h3 className="mb-3 font-medium">Chapters</h3>
              <div className="space-y-2">
                {video.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="font-mono text-blue-600">
                      {Math.floor(chapter.timestamp / 60)}:
                      {(chapter.timestamp % 60).toString().padStart(2, "0")}
                    </span>
                    <span>{chapter.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments section */}
          <Comments
            videoId={video.id}
            channelOwnerId={video.channel.ownerId}
            commentCount={video.commentCount}
          />
        </div>
      </div>

      {/* Sidebar - Suggested videos */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Up next</h3>
        {suggestedVideos.map((suggestedVideo) => (
          <VideoCard key={suggestedVideo.id} video={suggestedVideo} layout="horizontal" />
        ))}
      </div>
    </div>
  )
}
