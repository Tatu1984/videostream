"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Upload, Bell, User, Menu } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"

interface HeaderProps {
  user?: {
    id: string
    name?: string | null
    image?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white">
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
              className="absolute right-0 top-0 flex h-full w-12 items-center justify-center border-l border-gray-300 hover:bg-gray-50"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <Link href="/upload">
                <Button variant="ghost" size="icon">
                  <Upload className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
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
              </Link>
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
