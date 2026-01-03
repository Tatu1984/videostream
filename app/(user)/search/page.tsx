import { prisma } from "@/lib/db/prisma"
import { VideoCard } from "@/components/user/video-card"
import Link from "next/link"
import { Suspense } from "react"
import { SearchFilters } from "./search-filters"
import { SearchBar } from "./search-bar"

interface SearchParams {
  q?: string
  type?: string
  date?: string
  duration?: string
  features?: string
  sort?: string
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const query = params.q || ""

  if (!query) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <svg
          className="mb-4 h-24 w-24 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Start searching</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Find videos, channels, and playlists</p>
      </div>
    )
  }

  // Build where clause for videos based on filters
  const videoWhere: any = {
    AND: [
      {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      { visibility: "PUBLIC" },
      { processingStatus: "COMPLETED" },
    ],
  }

  // Apply type filter
  if (params.type && params.type !== "all") {
    if (params.type === "video") {
      videoWhere.AND.push({ videoType: "STANDARD" })
    } else if (params.type === "short") {
      videoWhere.AND.push({ videoType: "SHORT" })
    } else if (params.type === "live") {
      videoWhere.AND.push({ videoType: "LIVE" })
    }
  }

  // Apply date filter
  if (params.date) {
    const now = new Date()
    let dateFilter: Date | undefined

    if (params.date === "hour") {
      dateFilter = new Date(now.getTime() - 60 * 60 * 1000)
    } else if (params.date === "today") {
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else if (params.date === "week") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (params.date === "month") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (params.date === "year") {
      dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }

    if (dateFilter) {
      videoWhere.AND.push({ createdAt: { gte: dateFilter } })
    }
  }

  // Apply duration filter
  if (params.duration) {
    if (params.duration === "short") {
      videoWhere.AND.push({ duration: { lt: 240 } }) // Less than 4 minutes
    } else if (params.duration === "medium") {
      videoWhere.AND.push({ duration: { gte: 240, lt: 1200 } }) // 4-20 minutes
    } else if (params.duration === "long") {
      videoWhere.AND.push({ duration: { gte: 1200 } }) // More than 20 minutes
    }
  }

  // Apply features filter
  if (params.features) {
    const features = params.features.split(",")
    // Note: HD and CC filters would require additional schema fields
    // For now, we can filter by live streams
    if (features.includes("live")) {
      videoWhere.AND.push({ videoType: "LIVE" })
    }
  }

  // Determine sort order
  let orderBy: any = { viewCount: "desc" } // Default: Most viewed
  if (params.sort === "date") {
    orderBy = { createdAt: "desc" }
  } else if (params.sort === "rating") {
    orderBy = { likeCount: "desc" }
  }

  // Execute searches in parallel
  const [videos, channels, playlists] = await Promise.all([
    // Search videos
    prisma.video.findMany({
      where: videoWhere,
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
      orderBy,
      take: 50,
    }),
    // Search channels
    params.type === "video" || params.type === "short" || params.type === "live"
      ? []
      : prisma.channel.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { handle: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: { subscriberCount: "desc" },
          take: 10,
        }),
    // Search playlists
    params.type === "video" || params.type === "short" || params.type === "live" || params.type === "channel"
      ? []
      : prisma.playlist.findMany({
          where: {
            AND: [
              {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
              { visibility: "PUBLIC" },
            ],
          },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
  ])

  // Determine which sections to show
  const showAll = !params.type || params.type === "all"
  const showChannels = showAll || params.type === "channel"
  const showPlaylists = showAll || params.type === "playlist"
  const showVideos = showAll || params.type === "video" || params.type === "short" || params.type === "live"

  // Get top results (mix of channels and top videos)
  const topResults = showAll
    ? [...channels.slice(0, 2), ...videos.slice(0, 3)]
    : []

  return (
    <div>
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-10 -mx-6 bg-white dark:bg-[#0f0f0f] px-6 py-4 shadow-sm dark:shadow-gray-800">
        <SearchBar initialQuery={query} />
      </div>

      {/* Filter Bar */}
      <SearchFilters currentParams={params} />

      {/* Results summary */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Search results for "{query}"</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {videos.length} videos
          {showChannels && channels.length > 0 && ` • ${channels.length} channels`}
          {showPlaylists && playlists.length > 0 && ` • ${playlists.length} playlists`}
        </p>
      </div>

      {/* Top results section (only when showing all) */}
      {showAll && topResults.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Top results</h2>
          <div className="space-y-4">
            {topResults.map((item) => {
              // Check if it's a channel or video
              if ("subscriberCount" in item) {
                // It's a channel
                const channel = item as any
                return (
                  <Link
                    key={`channel-${channel.id}`}
                    href={`/channel/${channel.handle}`}
                    className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#1f1f1f]"
                  >
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                      {channel.avatar ? (
                        <img
                          src={channel.avatar}
                          alt={channel.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-gray-600 dark:text-gray-400">
                          {channel.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{channel.name}</h3>
                        {channel.verified && (
                          <svg
                            className="ml-1 h-4 w-4 text-gray-600"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{channel.handle}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {channel.subscriberCount.toLocaleString()} subscribers •{" "}
                        {channel.videoCount} videos
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                      Channel
                    </span>
                  </Link>
                )
              } else {
                // It's a video - show in horizontal layout for top results
                const video = item as any
                return (
                  <Link
                    key={`video-${video.id}`}
                    href={`/watch/${video.id}`}
                    className="flex gap-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#1f1f1f]"
                  >
                    <div className="relative aspect-video w-60 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-700">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          No thumbnail
                        </div>
                      )}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                          {Math.floor(video.duration / 60)}:
                          {(video.duration % 60).toString().padStart(2, "0")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 py-1">
                      <h3 className="line-clamp-2 text-base font-medium text-gray-900 dark:text-gray-100">
                        {video.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {Number(video.viewCount).toLocaleString()} views
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
                          {video.channel.avatar ? (
                            <img
                              src={video.channel.avatar}
                              alt={video.channel.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                              {video.channel.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{video.channel.name}</span>
                      </div>
                    </div>
                  </Link>
                )
              }
            })}
          </div>
        </div>
      )}

      {/* Channels results */}
      {showChannels && channels.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Channels</h2>
          <div className="space-y-4">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/channel/${channel.handle}`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#1f1f1f]"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                  {channel.avatar ? (
                    <img
                      src={channel.avatar}
                      alt={channel.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-gray-600 dark:text-gray-400">
                      {channel.name[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{channel.name}</h3>
                    {channel.verified && (
                      <svg
                        className="ml-1 h-4 w-4 text-gray-600"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{channel.handle}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {channel.subscriberCount.toLocaleString()} subscribers •{" "}
                    {channel.videoCount} videos
                  </p>
                  {channel.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {channel.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Playlists results */}
      {showPlaylists && playlists.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Playlists</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="group rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#1f1f1f]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded bg-blue-100 dark:bg-blue-900/30 p-2">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {playlist.videoCount} videos
                  </span>
                </div>
                <h3 className="line-clamp-2 font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600">
                  {playlist.title}
                </h3>
                {playlist.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {playlist.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {playlist.user.image && (
                    <img
                      src={playlist.user.image}
                      alt={playlist.user.name || "User"}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    by {playlist.user.name || "Unknown"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos results */}
      {showVideos && (
        <div>
          <h2 className="mb-4 text-lg font-semibold dark:text-gray-100">Videos</h2>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">No videos found</p>
            </div>
          )}
        </div>
      )}

      {/* No results at all */}
      {videos.length === 0 && channels.length === 0 && playlists.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center">
          <svg
            className="mb-4 h-24 w-24 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">No results found</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Try different keywords or remove search filters
          </p>
        </div>
      )}
    </div>
  )
}
