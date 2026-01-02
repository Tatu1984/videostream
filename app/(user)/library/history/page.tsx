import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import HistoryList from "./HistoryList"

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId: session.user.id },
    include: {
      video: {
        include: {
          channel: {
            select: {
              name: true,
              handle: true,
              avatar: true,
              verified: true,
            },
          },
        },
      },
    },
    orderBy: { watchedAt: "desc" },
    take: 50,
  })

  // Transform dates to strings for client component
  const historyData = history.map((item) => ({
    id: item.id,
    watchedAt: item.watchedAt.toISOString(),
    video: {
      id: item.video.id,
      title: item.video.title,
      thumbnailUrl: item.video.thumbnailUrl,
      channel: item.video.channel,
    },
  }))

  return <HistoryList initialHistory={historyData} />
}
