import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const searchParamsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  type: z.enum(["all", "video", "channel", "playlist", "short", "live"]).default("all"),
  uploadDate: z.enum(["all", "hour", "today", "week", "month", "year"]).default("all"),
  duration: z.enum(["all", "short", "medium", "long"]).default("all"), // short: <4min, medium: 4-20min, long: >20min
  sortBy: z.enum(["relevance", "uploadDate", "views", "rating"]).default("relevance"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  resolution: z.enum(["all", "4k", "hd", "sd"]).default("all"),
  features: z.array(z.enum(["cc", "hdr", "4k", "360", "vr180", "3d", "live", "location"])).default([]),
})

type SearchParams = z.infer<typeof searchParamsSchema>

interface SearchResult {
  type: "video" | "channel" | "playlist"
  id: string
  data: any
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Parse and validate query parameters
    const validatedParams = searchParamsSchema.parse({
      q: searchParams.get("q"),
      type: searchParams.get("type") || "all",
      uploadDate: searchParams.get("uploadDate") || "all",
      duration: searchParams.get("duration") || "all",
      sortBy: searchParams.get("sortBy") || "relevance",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      resolution: searchParams.get("resolution") || "all",
      features: searchParams.get("features")?.split(",").filter(Boolean) || [],
    })

    const { q, type, uploadDate, duration, sortBy, page, limit, resolution, features } = validatedParams
    const skip = (page - 1) * limit

    const results: SearchResult[] = []
    let totalResults = 0

    // Search based on type
    const shouldSearchVideos = type === "all" || type === "video" || type === "short" || type === "live"
    const shouldSearchChannels = type === "all" || type === "channel"
    const shouldSearchPlaylists = type === "all" || type === "playlist"

    // SEARCH VIDEOS
    if (shouldSearchVideos) {
      const videoWhere: Prisma.VideoWhereInput = {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          },
          // Only show public and completed videos
          { visibility: "PUBLIC" },
          { processingStatus: "COMPLETED" },
        ],
      }

      // Filter by video type
      if (type === "short") {
        videoWhere.videoType = "SHORT"
      } else if (type === "live") {
        videoWhere.videoType = "LIVE"
      } else if (type === "video") {
        videoWhere.videoType = { in: ["STANDARD", "PREMIERE"] }
      }

      // Filter by upload date
      if (uploadDate !== "all") {
        const now = new Date()
        let startDate: Date

        switch (uploadDate) {
          case "hour":
            startDate = new Date(now.getTime() - 60 * 60 * 1000)
            break
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0))
            break
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
        }

        videoWhere.publishedAt = { gte: startDate }
      }

      // Filter by duration
      if (duration !== "all") {
        const durationFilters = videoWhere.AND as Prisma.VideoWhereInput[]
        switch (duration) {
          case "short": // < 4 minutes
            durationFilters.push({ duration: { lt: 240 } })
            break
          case "medium": // 4-20 minutes
            durationFilters.push({ duration: { gte: 240, lte: 1200 } })
            break
          case "long": // > 20 minutes
            durationFilters.push({ duration: { gt: 1200 } })
            break
        }
      }

      // Filter by resolution (check video assets)
      if (resolution !== "all") {
        let resolutionFilter: string[]
        switch (resolution) {
          case "4k":
            resolutionFilter = ["2160p", "4320p"]
            break
          case "hd":
            resolutionFilter = ["720p", "1080p", "1440p"]
            break
          case "sd":
            resolutionFilter = ["144p", "240p", "360p", "480p"]
            break
          default:
            resolutionFilter = []
        }

        if (resolutionFilter.length > 0) {
          videoWhere.assets = {
            some: {
              type: "VIDEO",
              resolution: { in: resolutionFilter },
            },
          }
        }
      }

      // Filter by features (CC, 4K, etc.)
      if (features.includes("cc")) {
        videoWhere.assets = {
          some: { type: "SUBTITLE" },
        }
      }

      if (features.includes("4k")) {
        videoWhere.assets = {
          some: {
            type: "VIDEO",
            resolution: { in: ["2160p", "4320p"] },
          },
        }
      }

      if (features.includes("live")) {
        videoWhere.videoType = "LIVE"
      }

      // Determine sort order
      let videoOrderBy: Prisma.VideoOrderByWithRelationInput = { createdAt: "desc" }

      switch (sortBy) {
        case "uploadDate":
          videoOrderBy = { publishedAt: "desc" }
          break
        case "views":
          videoOrderBy = { viewCount: "desc" }
          break
        case "rating":
          videoOrderBy = { likeCount: "desc" }
          break
        case "relevance":
          // For relevance, we'll prioritize title matches over description/tags
          // This is a simplified approach; a full-text search would be better
          videoOrderBy = { viewCount: "desc" } // Fallback to popular videos
          break
      }

      // Get video count for pagination
      const videoCount = await prisma.video.count({ where: videoWhere })
      totalResults += videoCount

      // Fetch videos
      if (type === "all") {
        // For "all" type, limit videos to make room for other content types
        const videosToFetch = Math.ceil(limit * 0.6) // 60% of limit for videos

        const videos = await prisma.video.findMany({
          where: videoWhere,
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
              select: {
                resolution: true,
                type: true,
              },
              take: 1,
            },
          },
          orderBy: videoOrderBy,
          take: videosToFetch,
          skip: skip,
        })

        results.push(
          ...videos.map((video) => ({
            type: "video" as const,
            id: video.id,
            data: {
              id: video.id,
              title: video.title,
              description: video.description,
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              viewCount: video.viewCount.toString(),
              likeCount: video.likeCount,
              publishedAt: video.publishedAt,
              videoType: video.videoType,
              channel: video.channel,
              hasCC: video.assets.length > 0,
              createdAt: video.createdAt,
            },
          }))
        )
      } else {
        // For specific video type searches, use full limit
        const videos = await prisma.video.findMany({
          where: videoWhere,
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
              select: {
                resolution: true,
                type: true,
              },
              take: 1,
            },
          },
          orderBy: videoOrderBy,
          take: limit,
          skip: skip,
        })

        results.push(
          ...videos.map((video) => ({
            type: "video" as const,
            id: video.id,
            data: {
              id: video.id,
              title: video.title,
              description: video.description,
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              viewCount: video.viewCount.toString(),
              likeCount: video.likeCount,
              publishedAt: video.publishedAt,
              videoType: video.videoType,
              channel: video.channel,
              hasCC: video.assets.length > 0,
              createdAt: video.createdAt,
            },
          }))
        )
      }
    }

    // SEARCH CHANNELS
    if (shouldSearchChannels) {
      const channelWhere: Prisma.ChannelWhereInput = {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { handle: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          { status: "ACTIVE" },
        ],
      }

      let channelOrderBy: Prisma.ChannelOrderByWithRelationInput = { subscriberCount: "desc" }

      if (sortBy === "uploadDate") {
        channelOrderBy = { createdAt: "desc" }
      } else if (sortBy === "relevance") {
        channelOrderBy = { subscriberCount: "desc" }
      }

      const channelCount = await prisma.channel.count({ where: channelWhere })
      totalResults += channelCount

      const channelsToFetch = type === "all" ? Math.ceil(limit * 0.2) : limit
      const channelSkip = type === "all" ? 0 : skip

      const channels = await prisma.channel.findMany({
        where: channelWhere,
        include: {
          _count: {
            select: {
              videos: true,
            },
          },
        },
        orderBy: channelOrderBy,
        take: channelsToFetch,
        skip: channelSkip,
      })

      results.push(
        ...channels.map((channel) => ({
          type: "channel" as const,
          id: channel.id,
          data: {
            id: channel.id,
            name: channel.name,
            handle: channel.handle,
            description: channel.description,
            avatar: channel.avatar,
            banner: channel.banner,
            verified: channel.verified,
            subscriberCount: channel.subscriberCount,
            videoCount: channel._count.videos,
            createdAt: channel.createdAt,
          },
        }))
      )
    }

    // SEARCH PLAYLISTS
    if (shouldSearchPlaylists) {
      const playlistWhere: Prisma.PlaylistWhereInput = {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          { visibility: "PUBLIC" },
        ],
      }

      let playlistOrderBy: Prisma.PlaylistOrderByWithRelationInput = { updatedAt: "desc" }

      if (sortBy === "uploadDate") {
        playlistOrderBy = { createdAt: "desc" }
      }

      const playlistCount = await prisma.playlist.count({ where: playlistWhere })
      totalResults += playlistCount

      const playlistsToFetch = type === "all" ? Math.ceil(limit * 0.2) : limit
      const playlistSkip = type === "all" ? 0 : skip

      const playlists = await prisma.playlist.findMany({
        where: playlistWhere,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          videos: {
            include: {
              video: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                  duration: true,
                },
              },
            },
            orderBy: { position: "asc" },
            take: 3, // Get first 3 videos for preview
          },
        },
        orderBy: playlistOrderBy,
        take: playlistsToFetch,
        skip: playlistSkip,
      })

      results.push(
        ...playlists.map((playlist) => ({
          type: "playlist" as const,
          id: playlist.id,
          data: {
            id: playlist.id,
            title: playlist.title,
            description: playlist.description,
            visibility: playlist.visibility,
            videoCount: playlist.videoCount,
            creator: playlist.user,
            previewVideos: playlist.videos.map((pv) => pv.video),
            createdAt: playlist.createdAt,
            updatedAt: playlist.updatedAt,
          },
        }))
      )
    }

    // Sort mixed results if searching "all"
    if (type === "all") {
      // Shuffle results to mix videos, channels, and playlists
      // In a real app, you might want more sophisticated relevance scoring
      results.sort((a, b) => {
        if (sortBy === "relevance") {
          // Prioritize based on engagement metrics
          if (a.type === "video" && b.type === "video") {
            return Number(b.data.viewCount) - Number(a.data.viewCount)
          }
          if (a.type === "channel" && b.type === "channel") {
            return b.data.subscriberCount - a.data.subscriberCount
          }
          // Mix content types
          return 0
        }
        return 0
      })

      // Limit to requested page size
      const paginatedResults = results.slice(0, limit)

      return NextResponse.json({
        results: paginatedResults,
        pagination: {
          total: totalResults,
          page,
          limit,
          totalPages: Math.ceil(totalResults / limit),
        },
        filters: {
          query: q,
          type,
          uploadDate,
          duration,
          sortBy,
          resolution,
          features,
        },
      })
    }

    // Return results for specific type searches
    return NextResponse.json({
      results,
      pagination: {
        total: totalResults,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
      },
      filters: {
        query: q,
        type,
        uploadDate,
        duration,
        sortBy,
        resolution,
        features,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid search parameters",
          details: error.issues
        },
        { status: 400 }
      )
    }

    console.error("Error performing search:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
}
