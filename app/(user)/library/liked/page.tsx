import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import LikedVideosClient from "./LikedVideosClient"

export default async function LikedVideosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const likes = await prisma.like.findMany({
    where: {
      userId: session.user.id,
      type: "LIKE",
    },
    include: {
      video: {
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
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return <LikedVideosClient initialLikes={likes} />
}
