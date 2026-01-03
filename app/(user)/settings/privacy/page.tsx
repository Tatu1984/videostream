import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { prisma } from "@/lib/db/prisma"
import PrivacySettingsForm from "./PrivacySettingsForm"

export default async function PrivacySettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Get user's privacy settings
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionsPrivate: true,
      likedVideosPrivate: true,
    },
  })

  // Get blocked users
  const blockedUsers = await prisma.blockedUser.findMany({
    where: { blockerId: session.user.id },
    include: {
      blocked: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold dark:text-gray-100">Privacy Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control your privacy and what others can see
        </p>
      </Card>

      <PrivacySettingsForm
        initialSettings={{
          subscriptionsPrivate: user.subscriptionsPrivate,
          likedVideosPrivate: user.likedVideosPrivate,
        }}
        blockedUsers={blockedUsers.map((bu) => ({
          id: bu.id,
          userId: bu.blocked.id,
          name: bu.blocked.name || "Unknown User",
          username: bu.blocked.username,
          image: bu.blocked.image,
          createdAt: bu.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
