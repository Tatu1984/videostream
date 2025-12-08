import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { prisma } from "@/lib/db/prisma"
import NotificationPreferencesForm from "./NotificationPreferencesForm"

export default async function NotificationsSettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Get user's notification preferences (create if doesn't exist)
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  })

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId: session.user.id,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-gray-600">
          Choose how you want to be notified about activity on the platform
        </p>
      </Card>

      <NotificationPreferencesForm initialPreferences={preferences} />
    </div>
  )
}
