import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import WatchLaterClient from "./WatchLaterClient"

export default async function WatchLaterPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const watchLater = await prisma.watchLater.findMany({
    where: { userId: session.user.id },
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
    orderBy: { addedAt: "desc" },
  })

  return <WatchLaterClient initialItems={watchLater} />
}
