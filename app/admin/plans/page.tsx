"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/shared/ui/input"
import { Button } from "@/components/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Plus, Edit2, Trash2, Star, Coins } from "lucide-react"

interface CoinPlan {
  id: string
  name: string
  description: string | null
  coins: number
  bonusCoins: number
  price: number
  isPopular: boolean
  isActive: boolean
  createdAt: string
  _count?: {
    purchases: number
  }
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<CoinPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CoinPlan | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/plans")
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      await fetch(`/api/admin/plans/${id}`, { method: "DELETE" })
      setPlans(plans.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Failed to delete plan:", error)
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await fetch(`/api/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      setPlans(plans.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p)))
    } catch (error) {
      console.error("Failed to toggle plan:", error)
    }
  }

  async function handleSetPopular(id: string) {
    try {
      await fetch(`/api/admin/plans/${id}/popular`, { method: "POST" })
      setPlans(plans.map((p) => ({ ...p, isPopular: p.id === id })))
    } catch (error) {
      console.error("Failed to set popular:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coin Plans</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.filter((p) => p.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.reduce((acc, p) => acc + (p._count?.purchases || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No plans found</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${!plan.isActive ? "opacity-60" : ""} ${
                plan.isPopular ? "ring-2 ring-yellow-400" : ""
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Popular
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.description && (
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="text-xl font-bold">{plan.coins}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${plan.price.toFixed(2)}</p>
                    {plan.bonusCoins > 0 && (
                      <p className="text-sm text-green-600">+{plan.bonusCoins} bonus coins</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      plan.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="text-sm text-gray-500">
                  {plan._count?.purchases || 0} purchases
                </div>

                <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingPlan(plan)
                      setShowModal(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(plan.id, plan.isActive)}
                  >
                    {plan.isActive ? "Disable" : "Enable"}
                  </Button>
                  {!plan.isPopular && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPopular(plan.id)}
                      title="Set as popular"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 ml-auto"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlanModal
          plan={editingPlan}
          onClose={() => {
            setShowModal(false)
            setEditingPlan(null)
          }}
          onSave={() => {
            setShowModal(false)
            setEditingPlan(null)
            fetchPlans()
          }}
        />
      )}
    </div>
  )
}

function PlanModal({
  plan,
  onClose,
  onSave,
}: {
  plan: CoinPlan | null
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState(plan?.name || "")
  const [description, setDescription] = useState(plan?.description || "")
  const [coins, setCoins] = useState(plan?.coins || 100)
  const [bonusCoins, setBonusCoins] = useState(plan?.bonusCoins || 0)
  const [price, setPrice] = useState(plan?.price || 0.99)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = plan ? `/api/admin/plans/${plan.id}` : "/api/admin/plans"
      const method = plan ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, coins, bonusCoins, price }),
      })

      onSave()
    } catch (error) {
      console.error("Failed to save plan:", error)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">{plan ? "Edit Plan" : "Add Plan"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Starter Pack"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Coins</label>
              <Input
                type="number"
                value={coins}
                onChange={(e) => setCoins(parseInt(e.target.value) || 0)}
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bonus Coins</label>
              <Input
                type="number"
                value={bonusCoins}
                onChange={(e) => setBonusCoins(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
              min={0.01}
              step={0.01}
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
