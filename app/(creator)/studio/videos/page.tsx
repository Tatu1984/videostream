import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import StudioVideosClient from "./StudioVideosClient"

export default async function StudioVideosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's channels
  const channels = await prisma.channel.findMany({
    where: { ownerId: session.user.id },
  })

  if (channels.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">No channel found</p>
          <p className="mt-1 text-sm text-gray-600">Create a channel to upload videos</p>
        </div>
      </div>
    )
  }

  const channelIds = channels.map((c) => c.id)

  // Get all videos from user's channels
  const videos = await prisma.video.findMany({
    where: {
      channelId: { in: channelIds },
    },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          handle: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const videosData = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    visibility: v.visibility,
    processingStatus: v.processingStatus,
    viewCount: Number(v.viewCount),
    likeCount: v.likeCount,
    commentCount: v.commentCount,
    createdAt: v.createdAt.toISOString(),
    channel: v.channel,
  }))

  return <StudioVideosClient videos={videosData} channels={channels} />
}
