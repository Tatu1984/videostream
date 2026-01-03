"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Upload, User, Menu, Video, Settings, Shield, LogOut } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { NotificationBell } from "@/components/user/notification-bell"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { signOut } from "next-auth/react"

interface HeaderProps {
  user?: {
    id: string
    name?: string | null
    image?: string | null
    role?: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0f0f0f]">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center space-x-1">
            <PlaySquare className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold">MeTube</span>
          </Link>
        </div>

        {/* Center - Search */}
        <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl mx-8">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 flex h-full w-12 items-center justify-center border-l border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              {/* Create button with dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                >
                  <Upload className="h-5 w-5" />
                </Button>

                {showCreateMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#282828]">
                    <Link
                      href="/studio/upload"
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4" />
                      Upload video
                    </Link>
                    <Link
                      href="/studio/shorts/create"
                      onClick={() => setShowCreateMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Video className="h-4 w-4" />
                      Create Short
                    </Link>
                  </div>
                )}
              </div>

              <ThemeToggle />
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-[#282828]">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">{user.name || "User"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{user.name?.toLowerCase().replace(/\s/g, "") || "user"}</p>
                    </div>

                    {/* Admin Link - Only show for admins */}
                    {user.role === "ADMIN" && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#FF6B8A] hover:bg-pink-50 dark:hover:bg-pink-900/20"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                        <div className="border-b border-gray-100 dark:border-gray-700 my-1" />
                      </>
                    )}

                    {/* Creator Studio */}
                    <Link
                      href="/studio"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Video className="h-4 w-4" />
                      Creator Studio
                    </Link>

                    {/* Settings */}
                    <Link
                      href="/settings/account"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <div className="border-b border-gray-100 dark:border-gray-700 my-1" />

                    {/* Sign Out */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        signOut({ callbackUrl: "/" })
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function PlaySquare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 3H3v18h18V3zm-10 12.5v-7l6 3.5-6 3.5z" />
    </svg>
  )
}
