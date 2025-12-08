"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PlaySquare,
  Tv,
  Music,
  Flag,
  HelpCircle,
  MessageSquare,
  Coins,
  Film,
  Shield,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function AdminSidebar() {
  const pathname = usePathname()

  const navSections: NavSection[] = [
    {
      title: "MENU",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        { label: "User", href: "/admin/users", icon: Users },
      ],
    },
    {
      title: "CONTENT MANAGEMENT",
      items: [
        { label: "Channel", href: "/admin/channels", icon: Tv },
        { label: "Videos", href: "/admin/videos", icon: PlaySquare },
        { label: "Shorts", href: "/admin/shorts", icon: Film },
        { label: "Sound", href: "/admin/sounds", icon: Music },
      ],
    },
    {
      title: "REPORT & SUPPORT",
      items: [
        { label: "Report", href: "/admin/moderation/flags", icon: Flag },
        { label: "Copyright", href: "/admin/copyright/claims", icon: Shield },
        { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
        { label: "Contact Us", href: "/admin/contact", icon: MessageSquare },
      ],
    },
    {
      title: "FINANCIAL & PLANS",
      items: [
        { label: "Coin Plan", href: "/admin/plans", icon: Coins },
      ],
    },
  ]

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B8A]">
          <PlaySquare className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">Metube</span>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href} className="relative">
                    {/* Pink vertical bar on left when active */}
                    {active && (
                      <div className="absolute right-0 top-0 h-full w-1 rounded-l-full bg-[#FF6B8A]" />
                    )}
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-[#FF6B8A] text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
