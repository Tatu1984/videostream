"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  TrendingUp,
  Video,
  Clock,
  ThumbsUp,
  PlaySquare,
  History,
  ListVideo,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

const mainLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: Video },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/subscriptions", label: "Subscriptions", icon: PlaySquare },
]

const libraryLinks = [
  { href: "/library", label: "Library", icon: ListVideo },
  { href: "/history", label: "History", icon: History },
  { href: "/watch-later", label: "Watch Later", icon: Clock },
  { href: "/liked-videos", label: "Liked Videos", icon: ThumbsUp },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-14 z-10 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0f0f0f]">
      <nav className="flex flex-col space-y-6 p-3">
        <div>
          {mainLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center space-x-4 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          {libraryLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center space-x-4 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
