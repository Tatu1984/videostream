"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/shared/ui/button"
import { useState } from "react"

interface SearchFiltersProps {
  currentParams: {
    q?: string
    type?: string
    date?: string
    duration?: string
    features?: string
    sort?: string
  }
}

export function SearchFilters({ currentParams }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === "all" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    router.push(`/search?${params.toString()}`)
  }

  const toggleFeature = (feature: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentFeatures = params.get("features")?.split(",") || []

    let newFeatures: string[]
    if (currentFeatures.includes(feature)) {
      newFeatures = currentFeatures.filter((f) => f !== feature)
    } else {
      newFeatures = [...currentFeatures, feature]
    }

    if (newFeatures.length === 0) {
      params.delete("features")
    } else {
      params.set("features", newFeatures.join(","))
    }

    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (currentParams.q) {
      params.set("q", currentParams.q)
    }
    router.push(`/search?${params.toString()}`)
  }

  const activeFilterCount =
    (currentParams.type && currentParams.type !== "all" ? 1 : 0) +
    (currentParams.date ? 1 : 0) +
    (currentParams.duration ? 1 : 0) +
    (currentParams.features ? currentParams.features.split(",").length : 0) +
    (currentParams.sort && currentParams.sort !== "relevance" ? 1 : 0)

  const currentFeatures = currentParams.features?.split(",") || []

  return (
    <div className="mb-6 space-y-4">
      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {[
          { label: "All", value: "all" },
          { label: "Videos", value: "video" },
          { label: "Channels", value: "channel" },
          { label: "Playlists", value: "playlist" },
          { label: "Shorts", value: "short" },
          { label: "Live", value: "live" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateFilter("type", tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              (currentParams.type || "all") === tab.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto flex items-center gap-1 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Upload Date */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-gray-700">
                Upload date
              </label>
              <select
                value={currentParams.date || ""}
                onChange={(e) => updateFilter("date", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="">Any time</option>
                <option value="hour">Last hour</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-gray-700">
                Duration
              </label>
              <select
                value={currentParams.duration || ""}
                onChange={(e) => updateFilter("duration", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="">Any duration</option>
                <option value="short">Under 4 minutes</option>
                <option value="medium">4-20 minutes</option>
                <option value="long">Over 20 minutes</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-gray-700">
                Sort by
              </label>
              <select
                value={currentParams.sort || "relevance"}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Upload date</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Features */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-gray-700">
                Features
              </label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentFeatures.includes("live")}
                    onChange={() => toggleFeature("live")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Live streams</span>
                </label>
                {/* Additional features like HD and CC can be added when schema is updated */}
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
