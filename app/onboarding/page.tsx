"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shared/ui/button"

const categories = [
  "Music", "Gaming", "Sports", "News", "Education",
  "Entertainment", "Technology", "Science", "Travel",
  "Cooking", "Fitness", "Fashion", "Art", "Comedy"
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleContinue = async () => {
    setIsLoading(true)
    // In a real app, save preferences to backend
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to MeTube</h1>
          <p className="mt-2 text-gray-600">
            Select topics you're interested in to personalize your feed
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                selectedCategories.includes(category)
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
          >
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedCategories.length === 0 || isLoading}
          >
            {isLoading ? "Loading..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
