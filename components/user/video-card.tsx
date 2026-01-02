import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface VideoCardProps {
  video: {
    id: string
    title: string
    thumbnailUrl?: string | null
    duration?: number | null
    viewCount: bigint
    createdAt: Date
    channel: {
      id: string
      name: string
      handle: string
      avatar?: string | null
      verified: boolean
    }
  }
  layout?: "vertical" | "horizontal"
}

function formatViews(views: bigint): string {
  const num = Number(views)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "0:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function VideoCard({ video, layout = "vertical" }: VideoCardProps) {
  if (layout === "horizontal") {
    return (
      <div className="group flex cursor-pointer gap-2">
        <Link href={`/watch/${video.id}`} className="flex-shrink-0">
          <div className="relative h-24 w-40 overflow-hidden rounded-lg bg-gray-200">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                No thumbnail
              </div>
            )}

            {video.duration && (
              <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-blue-600">
              {video.title}
            </h3>
          </Link>

          <Link href={`/channel/${video.channel.handle}`}>
            <div className="mt-1 flex items-center">
              <p className="text-xs text-gray-600 hover:text-gray-900">
                {video.channel.name}
              </p>
              {video.channel.verified && (
                <svg
                  className="ml-1 h-3 w-3 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
          </Link>

          <p className="mt-0.5 text-xs text-gray-600">
            {formatViews(video.viewCount)} views •{" "}
            {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="group cursor-pointer">
      <Link href={`/watch/${video.id}`}>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-200">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              No thumbnail
            </div>
          )}

          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 flex gap-3">
        <Link href={`/channel/${video.channel.handle}`}>
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-gray-300">
            {video.channel.avatar ? (
              <img
                src={video.channel.avatar}
                alt={video.channel.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600">
                {video.channel.name[0]}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-blue-600">
              {video.title}
            </h3>
          </Link>

          <Link href={`/channel/${video.channel.handle}`}>
            <div className="mt-1 flex items-center">
              <p className="text-sm text-gray-600 hover:text-gray-900">
                {video.channel.name}
              </p>
              {video.channel.verified && (
                <svg
                  className="ml-1 h-3.5 w-3.5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
          </Link>

          <p className="mt-0.5 text-sm text-gray-600">
            {formatViews(video.viewCount)} views •{" "}
            {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  )
}
