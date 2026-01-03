import Link from "next/link"
import { History, Clock, ThumbsUp, ListVideo } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

export default async function LibraryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const sections = [
    {
      title: "History",
      description: "Videos you've watched",
      icon: History,
      href: "/library/history",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Watch Later",
      description: "Videos saved for later",
      icon: Clock,
      href: "/library/watch-later",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Liked Videos",
      description: "Videos you liked",
      icon: ThumbsUp,
      href: "/library/liked",
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Playlists",
      description: "Your playlists",
      icon: ListVideo,
      href: "/library/playlists",
      color: "bg-green-100 text-green-600",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-gray-100">Library</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Your personal collection
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6 transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md"
            >
              <div className={`inline-flex rounded-lg p-3 ${section.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600">
                {section.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {section.description}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
