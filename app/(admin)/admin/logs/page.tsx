"use client"

import { useEffect, useState } from "react"
import {
  FileText,
  Filter,
  User,
  Video,
  Tv,
  Flag,
  AlertTriangle,
  Copyright,
  Settings,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface AuditLog {
  id: string
  action: string
  targetType: string
  targetId: string
  oldValue: Record<string, any> | null
  newValue: Record<string, any> | null
  notes: string | null
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
  }
}

interface LogsData {
  logs: AuditLog[]
  stats: {
    actionCounts: Record<string, number>
    targetTypeCounts: Record<string, number>
    adminActivity: Array<{
      adminId: string
      _count: { adminId: number }
      admin?: { id: string; name: string; email: string }
    }>
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminLogsPage() {
  const [data, setData] = useState<LogsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    targetType: "",
    action: "",
    startDate: "",
    endDate: "",
    page: 1,
  })
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.targetType) params.set("targetType", filters.targetType)
      if (filters.action) params.set("action", filters.action)
      if (filters.startDate) params.set("startDate", filters.startDate)
      if (filters.endDate) params.set("endDate", filters.endDate)
      params.set("page", filters.page.toString())

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedLogs(newExpanded)
  }

  const getActionColor = (action: string) => {
    if (action.includes("REMOVED") || action.includes("BANNED") || action.includes("SUSPENDED")) {
      return "bg-red-100 text-red-800"
    }
    if (action.includes("RESTORED") || action.includes("VERIFIED")) {
      return "bg-green-100 text-green-800"
    }
    if (action.includes("WARNED") || action.includes("DISMISSED")) {
      return "bg-yellow-100 text-yellow-800"
    }
    return "bg-blue-100 text-blue-800"
  }

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case "User": return <User className="h-4 w-4" />
      case "Video": return <Video className="h-4 w-4" />
      case "Channel": return <Tv className="h-4 w-4" />
      case "Flag": return <Flag className="h-4 w-4" />
      case "Strike": return <AlertTriangle className="h-4 w-4" />
      case "CopyrightClaim": return <Copyright className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-600">Track all admin actions and changes</p>
      </div>

      {/* Stats */}
      {data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Total Logs</p>
            <p className="mt-1 text-2xl font-bold">{data.pagination.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Action Types</p>
            <p className="mt-1 text-2xl font-bold">{Object.keys(data.stats.actionCounts).length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Target Types</p>
            <p className="mt-1 text-2xl font-bold">{Object.keys(data.stats.targetTypeCounts).length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Active Admins</p>
            <p className="mt-1 text-2xl font-bold">{data.stats.adminActivity.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filters.targetType}
            onChange={(e) => setFilters({ ...filters, targetType: e.target.value, page: 1 })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Target Types</option>
            <option value="User">User</option>
            <option value="Channel">Channel</option>
            <option value="Video">Video</option>
            <option value="Flag">Flag</option>
            <option value="Strike">Strike</option>
            <option value="CopyrightClaim">Copyright Claim</option>
          </select>

          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Actions</option>
            <option value="USER_SUSPENDED">User Suspended</option>
            <option value="USER_BANNED">User Banned</option>
            <option value="USER_WARNED">User Warned</option>
            <option value="USER_RESTORED">User Restored</option>
            <option value="CHANNEL_VERIFIED">Channel Verified</option>
            <option value="CHANNEL_SUSPENDED">Channel Suspended</option>
            <option value="VIDEO_REMOVED">Video Removed</option>
            <option value="VIDEO_RESTORED">Video Restored</option>
            <option value="FLAG_RESOLVED">Flag Resolved</option>
            <option value="FLAG_DISMISSED">Flag Dismissed</option>
            <option value="STRIKE_ISSUED">Strike Issued</option>
            <option value="STRIKE_REMOVED">Strike Removed</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => setFilters({ targetType: "", action: "", startDate: "", endDate: "", page: 1 })}
            className="text-sm text-red-600 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No logs found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      {getTargetIcon(log.targetType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-gray-500">on {log.targetType}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        by <span className="font-medium">{log.admin?.name || "Unknown Admin"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    {expandedLogs.has(log.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedLogs.has(log.id) && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-500">Target ID</p>
                        <p className="mt-1 font-mono text-sm">{log.targetId}</p>
                      </div>
                      {log.notes && (
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-500">Notes</p>
                          <p className="mt-1 text-sm">{log.notes}</p>
                        </div>
                      )}
                    </div>

                    {(log.oldValue || log.newValue) && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {log.oldValue && (
                          <div>
                            <p className="text-xs font-medium uppercase text-gray-500">Previous Value</p>
                            <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-xs">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div>
                            <p className="text-xs font-medium uppercase text-gray-500">New Value</p>
                            <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-xs">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} logs)
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
      </div>
    </div>
  )
}
