import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Button } from "@/components/shared/ui/button"
import { ArrowLeft } from "lucide-react"
import ChannelSettingsForm from "./ChannelSettingsForm"

export default async function ChannelPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's channel
  const channel = await prisma.channel.findFirst({
    where: { ownerId: session.user.id },
  })

  // If no channel exists, redirect to creation page
  if (!channel) {
    redirect("/studio/channel/new")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link href="/studio">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold">Channel Settings</h1>
            <p className="mt-1 text-gray-600">Manage your channel information</p>
          </div>
        </div>

        <ChannelSettingsForm channel={channel} />
      </div>
    </div>
  )
}
