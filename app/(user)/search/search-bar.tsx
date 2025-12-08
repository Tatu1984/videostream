"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/shared/ui/input"

interface SearchBarProps {
  initialQuery: string
}

export function SearchBar({ initialQuery }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Preserve existing filters
    const params = new URLSearchParams(searchParams.toString())
    params.set("q", query.trim())

    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <div className="relative flex-1">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, channels, and playlists..."
          className="pr-10"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
