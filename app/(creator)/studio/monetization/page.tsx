"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card } from "@/components/shared/ui/card"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Channel {
  id: string
  name: string
  monetizationEnabled: boolean
  subscriberCount: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  createdAt: string
  paymentMethod?: string
}

interface MonetizationData {
  channels: Channel[]
  totalEarnings: number
  monthlyEarnings: number
  pendingPayouts: number
  revenueByType: Record<string, number>
  recentTransactions: Transaction[]
}

interface PayoutData {
  payouts: Transaction[]
}

export default function StudioMonetizationPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<MonetizationData | null>(null)
  const [payouts, setPayouts] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState("BANK_TRANSFER")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin")
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status])

  async function fetchData() {
    try {
      const [monetizationRes, payoutsRes] = await Promise.all([
        fetch("/api/monetization"),
        fetch("/api/monetization/payout"),
      ])

      if (monetizationRes.ok) {
        const monetizationData = await monetizationRes.json()
        setData(monetizationData)
      }

      if (payoutsRes.ok) {
        const payoutsData: PayoutData = await payoutsRes.json()
        setPayouts(payoutsData.payouts)
      }
    } catch (err) {
      console.error("Error fetching monetization data:", err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleMonetization(channelId: string, enabled: boolean) {
    try {
      const res = await fetch("/api/monetization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, enabled }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error)
        return
      }

      fetchData()
      setSuccess(enabled ? "Monetization enabled!" : "Monetization disabled")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to update monetization")
    }
  }

  async function requestPayout() {
    setPayoutLoading(true)
    setError("")

    try {
      const amount = parseFloat(payoutAmount)

      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount")
        return
      }

      const res = await fetch("/api/monetization/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentMethod: payoutMethod }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error)
        return
      }

      setSuccess("Payout requested successfully!")
      setPayoutAmount("")
      fetchData()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to request payout")
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const availableBalance =
    (data?.totalEarnings || 0) - Math.abs(data?.pendingPayouts || 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Monetization</h1>
        <p className="mt-1 text-gray-600">
          Manage your earnings and payouts
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <p>{success}</p>
        </div>
      )}

      {/* Earnings Overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="mt-1 text-3xl font-bold">
                ${(data?.totalEarnings || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="mt-1 text-3xl font-bold">
                ${(data?.monthlyEarnings || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="mt-1 text-3xl font-bold">
                ${availableBalance.toLocaleString()}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <p className="mt-1 text-3xl font-bold">
                ${Math.abs(data?.pendingPayouts || 0).toLocaleString()}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Revenue Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(data?.revenueByType || {}).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-600">
                  {type.replace(/_/g, " ")}
                </span>
                <span className="font-semibold">${amount.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(data?.revenueByType || {}).length === 0 && (
              <p className="text-center text-gray-500">No revenue data yet</p>
            )}
          </div>
        </Card>

        {/* Request Payout */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Request Payout</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Amount (USD)
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Minimum $100"
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full rounded-lg border px-4 py-2"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="PAYPAL">PayPal</option>
                <option value="WIRE">Wire Transfer</option>
              </select>
            </div>
            <button
              onClick={requestPayout}
              disabled={payoutLoading || availableBalance < 100}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {payoutLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="h-5 w-5" />
                  Request Payout
                </>
              )}
            </button>
            {availableBalance < 100 && (
              <p className="text-center text-sm text-yellow-600">
                Minimum balance of $100 required for payout
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Channels Monetization Status */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Channel Monetization</h2>
        <div className="space-y-4">
          {data?.channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{channel.name}</p>
                <p className="text-sm text-gray-500">
                  {channel.subscriberCount.toLocaleString()} subscribers
                </p>
              </div>
              <div className="flex items-center gap-4">
                {channel.subscriberCount < 1000 ? (
                  <span className="text-sm text-yellow-600">
                    Need 1,000 subscribers
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      toggleMonetization(channel.id, !channel.monetizationEnabled)
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      channel.monetizationEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {channel.monetizationEnabled ? "Enabled" : "Enable"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {(!data?.channels || data.channels.length === 0) && (
            <p className="text-center text-gray-500">No channels found</p>
          )}
        </div>
      </Card>

      {/* Payout History */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="py-3 text-sm">
                    {formatDistanceToNow(new Date(payout.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="py-3 font-medium">
                    ${Math.abs(payout.amount).toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {payout.paymentMethod?.replace(/_/g, " ") || "N/A"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        payout.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : payout.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {payout.status === "COMPLETED" && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {payout.status === "PENDING" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {payout.status === "FAILED" && (
                        <XCircle className="h-3 w-3" />
                      )}
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No payout history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>
        <div className="space-y-3">
          {data?.recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <div>
                <p className="font-medium text-sm">{tx.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(tx.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <span className="font-semibold text-green-600">
                +${tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <p className="text-center text-gray-500">No recent transactions</p>
          )}
        </div>
      </Card>
    </div>
  )
}
