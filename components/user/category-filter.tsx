"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const categories = ["All", "Music", "Gaming", "Sports", "News", "Education", "Entertainment", "Technology"]

export function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category") || "All"

  const handleCategoryClick = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (category === "All") {
        params.delete("category")
      } else {
        params.set("category", category)
      }

      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const isActive = category === activeCategory || (category === "All" && !searchParams.get("category"))
        return (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
