"use client"

import { Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"

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
    <header className="fixed left-64 right-0 top-0 z-30 h-16 bg-white border-b border-gray-100">
      <div className="flex h-full items-center justify-between px-6">
        {/* Menu Toggle */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-50">
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {/* Right side - Admin with avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-full p-1.5 hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">
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
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user.name || "Admin"}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
