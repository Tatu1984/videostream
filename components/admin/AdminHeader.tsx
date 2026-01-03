"use client"

import { Menu, Home, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

interface AdminHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 bg-white dark:bg-[#1f1f1f] border-b border-gray-100 dark:border-gray-800">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Menu toggle and back to site */}
        <div className="flex items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Site
          </Link>
        </div>

        {/* Right side - Admin with avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-full p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.name || "Admin"}
            </span>
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "Admin"}
                className="h-9 w-9 rounded-full object-cover border-2 border-[#FF6B8A]"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B8A] text-sm font-medium text-white border-2 border-[#FF6B8A]">
                {user.name?.[0] || user.email?.[0] || "A"}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-[#282828] py-2 shadow-lg">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || "Admin"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <Link
                href="/"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Home className="h-4 w-4" />
                Back to Site
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
