import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { ArrowLeft } from "lucide-react"

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

        {/* Channel Settings Form */}
        <form className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold">Basic Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Name *
                </label>
                <Input
                  type="text"
                  defaultValue={channel.name}
                  placeholder="Enter channel name"
                  maxLength={50}
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This is how viewers will see your channel
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Handle *
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    @
                  </span>
                  <Input
                    type="text"
                    defaultValue={channel.handle.replace("@", "")}
                    placeholder="your-handle"
                    maxLength={30}
                    className="pl-8"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your unique identifier across the platform
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  defaultValue={channel.description || ""}
                  placeholder="Tell viewers about your channel"
                  maxLength={1000}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Help people understand what your channel is about
                </p>
              </div>
            </div>
          </div>

          {/* Channel Art */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold">Channel Art</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Avatar
                </label>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-200">
                    {channel.avatar ? (
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                        {channel.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm">
                      Upload Avatar
                    </Button>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended: 800x800px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Channel Banner
                </label>
                <div className="mt-2 space-y-2">
                  <div className="h-32 w-full overflow-hidden rounded-lg bg-gray-200">
                    {channel.banner ? (
                      <img
                        src={channel.banner}
                        alt={`${channel.name} banner`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        No banner uploaded
                      </div>
                    )}
                  </div>
                  <div>
                    <Button type="button" variant="outline" size="sm">
                      Upload Banner
                    </Button>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended: 2560x1440px, PNG or JPG
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold">Channel Status</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  {channel.status}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Verified</p>
                <p className="mt-1 text-lg font-semibold">
                  {channel.verified ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Subscribers</p>
                <p className="mt-1 text-lg font-semibold">
                  {channel.subscriberCount.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Videos</p>
                <p className="mt-1 text-lg font-semibold">
                  {channel.videoCount}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/studio">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
