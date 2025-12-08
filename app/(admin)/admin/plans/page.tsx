import { prisma } from "@/lib/db/prisma"
import { Coins, Plus, Edit, Trash2, Star, Check } from "lucide-react"

export default async function AdminPlansPage() {
  const plans = await prisma.coinPlan.findMany({
    orderBy: { coins: "asc" },
    include: {
      _count: {
        select: { purchases: true },
      },
    },
  })

  const totalPurchases = plans.reduce((sum, plan) => sum + plan._count.purchases, 0)
  const totalRevenue = plans.reduce((sum, plan) => sum + plan._count.purchases * plan.price, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coin Plans</h1>
          <p className="text-gray-600">Manage virtual currency packages</p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 text-sm font-medium text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40">
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-50 p-3">
              <Coins className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
              <p className="text-sm text-gray-500">Active Plans</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPurchases}</p>
              <p className="text-sm text-gray-500">Total Purchases</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
              plan.isPopular ? "border-pink-200 ring-2 ring-pink-500/20" : "border-gray-100"
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 text-xs font-medium text-white">
                  Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
            </div>

            <div className="mt-6 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-900">{plan.coins.toLocaleString()}</span>
                <span className="text-sm text-gray-500">coins</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-pink-600">${plan.price.toFixed(2)}</span>
              </div>
              {plan.bonusCoins > 0 && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  +{plan.bonusCoins.toLocaleString()} bonus coins!
                </p>
              )}
            </div>

            <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Coins:</span>
                <span className="font-medium text-gray-900">
                  {(plan.coins + plan.bonusCoins).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Price per coin:</span>
                <span className="font-medium text-gray-900">
                  ${(plan.price / (plan.coins + plan.bonusCoins)).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Purchases:</span>
                <span className="font-medium text-gray-900">{plan._count.purchases}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
          <Coins className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No coin plans created yet</p>
          <button className="mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white">
            Create your first plan
          </button>
        </div>
      )}
    </div>
  )
}
