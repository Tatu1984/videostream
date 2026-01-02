import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"

export default async function AccountSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-300">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-gray-600">
                    {session.user.name?.[0] || session.user.email?.[0] || "U"}
                  </div>
                )}
              </div>
              <div>
                <Button size="sm" variant="outline">
                  Change Photo
                </Button>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <Input
              type="text"
              defaultValue={session.user.name || ""}
              className="mt-1"
              placeholder="Your name"
            />
            <p className="mt-1 text-xs text-gray-500">
              This is how your name will appear across the platform
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              type="text"
              defaultValue=""
              className="mt-1"
              placeholder="username"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your unique username. This will be shown in your profile URL.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Tell us about yourself..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Brief description for your profile. Max 160 characters.
            </p>
          </div>

          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              type="email"
              defaultValue={session.user.email || ""}
              className="mt-1"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Your email is verified and cannot be changed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              className="mt-1"
              placeholder="+1 (555) 000-0000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Used for account recovery and important notifications
            </p>
          </div>

          <div className="flex justify-end">
            <Button>Update Contact Info</Button>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Security</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                type="password"
                value="••••••••••"
                disabled
                className="flex-1"
              />
              <Button variant="outline">Change Password</Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  Two-Factor Authentication
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Active Sessions</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage devices where you're currently logged in
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Current Session
                  </p>
                  <p className="text-xs text-gray-500">
                    Last active: Just now
                  </p>
                </div>
                <span className="text-xs text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 p-6">
        <h2 className="mb-4 text-xl font-semibold text-red-600">
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="mt-1 text-sm text-red-700">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
