import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"
import { VideoCard } from "@/components/user/video-card"
import { SubscribeButton } from "@/components/user/subscribe-button"
import { Bell, Users, PlaySquare, Calendar, ListVideo } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

function formatCount(count: number | bigint): string {
  const num = Number(count)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = "videos" } = await searchParams
  const session = await auth()

  // Try to find channel by ID or handle
  const channel = await prisma.channel.findFirst({
    where: {
      OR: [{ id }, { handle: id }],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  if (!channel) {
    notFound()
  }

  // Get channel videos
  const videos = await prisma.video.findMany({
    where: {
      channelId: channel.id,
      visibility: session?.user?.id === channel.ownerId ? undefined : "PUBLIC",
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
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  // Get community posts
  const communityPosts = await prisma.communityPost.findMany({
    where: { channelId: channel.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // Get public playlists from channel owner
  const playlists = await prisma.playlist.findMany({
    where: {
      userId: channel.ownerId,
      visibility: session?.user?.id === channel.ownerId ? undefined : "PUBLIC",
    },
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
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  const isOwner = session?.user?.id === channel.ownerId

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 sm:h-48">
        {channel.banner && (
          <img
            src={channel.banner}
            alt="Channel banner"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Channel Info */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="-mt-12 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-300 sm:-mt-16 sm:h-32 sm:w-32">
            {channel.avatar ? (
              <img
                src={channel.avatar}
                alt={channel.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-600">
                {channel.name[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold">{channel.name}</h1>
              {channel.verified && (
                <svg
                  className="h-5 w-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">@{channel.handle}</p>
            <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 sm:justify-start">
              <span>{formatCount(channel.subscriberCount)} subscribers</span>
              <span>{channel.videoCount} videos</span>
            </div>
            {channel.description && (
              <p className="mt-3 max-w-2xl text-sm text-gray-700 dark:text-gray-300">
                {channel.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwner ? (
              <Link href="/studio/channel">
                <button className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
                  Customize channel
                </button>
              </Link>
            ) : (
              <SubscribeButton channelId={channel.id} channelName={channel.name} />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-gray-700">
          <div className="flex gap-6">
            <Link
              href={`/channel/${id}?tab=videos`}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                tab === "videos"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Videos
            </Link>
            <Link
              href={`/channel/${id}?tab=shorts`}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                tab === "shorts"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Shorts
            </Link>
            <Link
              href={`/channel/${id}?tab=playlists`}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                tab === "playlists"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Playlists
            </Link>
            <Link
              href={`/channel/${id}?tab=community`}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                tab === "community"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Community
            </Link>
            <Link
              href={`/channel/${id}?tab=about`}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                tab === "about"
                  ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              About
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          {tab === "videos" && (
            <>
              {videos.length === 0 ? (
                <div className="py-12 text-center">
                  <PlaySquare className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium dark:text-gray-100">No videos yet</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    This channel hasn&apos;t uploaded any videos
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {videos
                    .filter((v) => v.videoType !== "SHORT")
                    .map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                </div>
              )}
            </>
          )}

          {tab === "shorts" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {videos
                .filter((v) => v.videoType === "SHORT")
                .map((video) => (
                  <Link key={video.id} href={`/shorts?v=${video.id}`}>
                    <div className="aspect-[9/16] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          Short
                        </div>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium dark:text-gray-100">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCount(video.viewCount)} views
                    </p>
                  </Link>
                ))}
              {videos.filter((v) => v.videoType === "SHORT").length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-lg font-medium dark:text-gray-100">No shorts yet</p>
                </div>
              )}
            </div>
          )}

          {tab === "playlists" && (
            <>
              {playlists.length === 0 ? (
                <div className="py-12 text-center">
                  <ListVideo className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium dark:text-gray-100">No playlists yet</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {isOwner
                      ? "Create your first playlist to organize your videos"
                      : `${channel.name} hasn't created any public playlists`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      className="group"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                        {playlist.videos[0]?.video.thumbnailUrl ? (
                          <img
                            src={playlist.videos[0].video.thumbnailUrl}
                            alt={playlist.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ListVideo className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 flex items-center gap-1 rounded-tl bg-black/80 px-2 py-1 text-xs text-white">
                          <ListVideo className="h-3 w-3" />
                          {playlist.videoCount} videos
                        </div>
                      </div>
                      <h3 className="mt-2 line-clamp-2 font-medium dark:text-gray-100 group-hover:text-blue-600">
                        {playlist.title}
                      </h3>
                      {playlist.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                          {playlist.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {playlist.visibility === "PUBLIC" ? "Public" : "Private"} playlist
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "community" && (
            <div className="mx-auto max-w-2xl space-y-4">
              {communityPosts.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium dark:text-gray-100">No community posts</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    Community posts from {channel.name} will appear here
                  </p>
                </div>
              ) : (
                communityPosts.map((post) => (
                  <div key={post.id} className="rounded-lg border dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        {channel.avatar ? (
                          <img
                            src={channel.avatar}
                            alt={channel.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-medium dark:text-gray-400">
                            {channel.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium dark:text-gray-100">{channel.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap dark:text-gray-200">{post.content}</p>
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {post.mediaUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "about" && (
            <div className="mx-auto max-w-2xl">
              <h2 className="text-lg font-medium dark:text-gray-100">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {channel.description || "No description"}
              </p>

              <h2 className="mt-8 text-lg font-medium dark:text-gray-100">Stats</h2>
              <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined{" "}
                  {formatDistanceToNow(new Date(channel.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <PlaySquare className="h-4 w-4" />
                  {formatCount(channel.totalViews)} total views
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
