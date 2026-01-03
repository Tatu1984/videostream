"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Search, Plus, Edit2, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  isActive: boolean
  createdAt: string
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchFAQs()
  }, [])

  async function fetchFAQs() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/faq")
      const data = await res.json()
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error("Failed to fetch FAQs:", error)
    }
    setLoading(false)
  }

  const categories = ["all", ...new Set(faqs.map((f) => f.category))]

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || faq.category === category
    return matchesSearch && matchesCategory
  })

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      await fetch(`/api/admin/faq/${id}`, { method: "DELETE" })
      setFaqs(faqs.filter((f) => f.id !== id))
    } catch (error) {
      console.error("Failed to delete FAQ:", error)
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await fetch(`/api/admin/faq/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      setFaqs(faqs.map((f) => (f.id === id ? { ...f, isActive: !isActive } : f)))
    } catch (error) {
      console.error("Failed to toggle FAQ:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">FAQ Management</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat === "all" ? "All" : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No FAQs found</div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className={`rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] ${!faq.isActive ? "opacity-60" : ""}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button className="mt-1 cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="flex-1">
                      <button
                        className="flex items-center gap-2 w-full text-left"
                        onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      >
                        <span className="text-base font-medium dark:text-white">
                          {faq.question}
                        </span>
                        {expandedId === faq.id ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#282828] text-gray-600 dark:text-gray-400">
                          {faq.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            faq.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {faq.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFaq(faq)
                        setShowModal(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(faq.id, faq.isActive)}
                    >
                      {faq.isActive ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {expandedId === faq.id && (
                <div className="px-4 pb-4">
                  <div className="pl-7 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FAQModal
          faq={editingFaq}
          onClose={() => {
            setShowModal(false)
            setEditingFaq(null)
          }}
          onSave={() => {
            setShowModal(false)
            setEditingFaq(null)
            fetchFAQs()
          }}
        />
      )}
    </div>
  )
}

function FAQModal({
  faq,
  onClose,
  onSave,
}: {
  faq: FAQ | null
  onClose: () => void
  onSave: () => void
}) {
  const [question, setQuestion] = useState(faq?.question || "")
  const [answer, setAnswer] = useState(faq?.answer || "")
  const [category, setCategory] = useState(faq?.category || "General")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = faq ? `/api/admin/faq/${faq.id}` : "/api/admin/faq"
      const method = faq ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, category }),
      })

      onSave()
    } catch (error) {
      console.error("Failed to save FAQ:", error)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1f1f1f] p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{faq ? "Edit FAQ" : "Add FAQ"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#282828] px-3 py-2 text-sm dark:text-white focus:border-[#FF6B8A] focus:outline-none focus:ring-1 focus:ring-[#FF6B8A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="General"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
