"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Search,
  Filter,
  User,
  Tv,
  Video,
  Clock,
  XCircle,
  CheckCircle,
  Plus,
} from "lucide-react"

interface Strike {
  id: string
  type: string
  reason: string
  severity: string
  active: boolean
  videoId: string | null
  expiresAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    username: string | null
  }
  channel: {
    id: string
    name: string
    handle: string
  } | null
}

interface StrikesData {
  strikes: Strike[]
  typeCounts: Record<string, number>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminStrikesPage() {
  const [data, setData] = useState<StrikesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: "",
    severity: "",
    active: "",
    page: 1,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchStrikes()
  }, [filters])

  const fetchStrikes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type) params.set("type", filters.type)
      if (filters.severity) params.set("severity", filters.severity)
      if (filters.active) params.set("active", filters.active)
      params.set("page", filters.page.toString())

      const res = await fetch(`/api/admin/strikes?${params}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching strikes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStrike = async (strikeId: string) => {
    if (!confirm("Are you sure you want to remove this strike?")) return

    setActionLoading(strikeId)
    try {
      const res = await fetch(`/api/admin/strikes/${strikeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      })

      if (res.ok) {
        fetchStrikes()
      } else {
        alert("Failed to remove strike")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const severityColors: Record<string, string> = {
    WARNING: "bg-yellow-100 text-yellow-800",
    STRIKE: "bg-orange-100 text-orange-800",
    SUSPENSION: "bg-red-100 text-red-800",
    TERMINATION: "bg-red-200 text-red-900",
  }

  const typeColors: Record<string, string> = {
    COMMUNITY_GUIDELINES: "bg-blue-100 text-blue-800",
    COPYRIGHT: "bg-purple-100 text-purple-800",
    SPAM: "bg-gray-100 text-gray-800",
    MISLEADING: "bg-yellow-100 text-yellow-800",
    TERMS_OF_SERVICE: "bg-red-100 text-red-800",
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strikes</h1>
          <p className="text-sm text-gray-600">Manage policy strikes and warnings</p>
        </div>
        {data && (
          <div className="text-sm text-gray-500">
            {data.pagination.total} total strikes
          </div>
        )}
      </div>

      {/* Type Summary */}
      {data && Object.keys(data.typeCounts).length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-5">
          {Object.entries(data.typeCounts).map(([type, count]) => (
            <div key={type} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{type.replace("_", " ")}</p>
              <p className="mt-1 text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="COMMUNITY_GUIDELINES">Community Guidelines</option>
            <option value="COPYRIGHT">Copyright</option>
            <option value="SPAM">Spam</option>
            <option value="MISLEADING">Misleading</option>
            <option value="TERMS_OF_SERVICE">Terms of Service</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Severities</option>
            <option value="WARNING">Warning</option>
            <option value="STRIKE">Strike</option>
            <option value="SUSPENSION">Suspension</option>
            <option value="TERMINATION">Termination</option>
          </select>

          <select
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value, page: 1 })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Expired/Removed</option>
          </select>
        </div>
      </div>

      {/* Strikes Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          </div>
        ) : data?.strikes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No strikes found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Channel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Expires</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.strikes.map((strike) => (
                    <tr key={strike.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${strike.user.id}`} className="flex items-center gap-2 hover:text-red-600">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">{strike.user.name}</p>
                            <p className="text-xs text-gray-500">@{strike.user.username || strike.user.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {strike.channel ? (
                          <Link href={`/admin/channels/${strike.channel.id}`} className="flex items-center gap-2 hover:text-red-600">
                            <Tv className="h-4 w-4" />
                            <span className="text-sm">{strike.channel.name}</span>
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[strike.type]}`}>
                          {strike.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${severityColors[strike.severity]}`}>
                          {strike.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate text-sm text-gray-600">{strike.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        {strike.active ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-gray-400">
                            <XCircle className="h-4 w-4" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {strike.expiresAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(strike.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {strike.active && (
                          <button
                            onClick={() => handleRemoveStrike(strike.id)}
                            disabled={actionLoading === strike.id}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  {data.pagination.page > 1 && (
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  {data.pagination.page < data.pagination.totalPages && (
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
