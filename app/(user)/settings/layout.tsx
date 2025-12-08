import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { User, Bell, Lock, Clock } from "lucide-react"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const navItems = [
    {
      href: "/settings/account",
      label: "Account",
      icon: User,
    },
    {
      href: "/settings/notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      href: "/settings/privacy",
      label: "Privacy",
      icon: Lock,
    },
    {
      href: "/settings/wellbeing",
      label: "Time Watched",
      icon: Clock,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-gray-600">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1 rounded-lg border border-gray-200 bg-white p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
