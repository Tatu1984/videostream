"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ChartData {
  name: string
  users: number
  videos: number
  shorts: number
}

interface DashboardChartsProps {
  chartData: ChartData[]
  totalUsers: number
  totalVideos: number
  totalShorts: number
}

export function DashboardCharts({
  chartData,
  totalUsers,
  totalVideos,
  totalShorts,
}: DashboardChartsProps) {
  // Data for the donut chart - matching the PDF colors
  const pieData = [
    { name: "Total User", value: totalUsers || 1, color: "#FF6B8A" },
    { name: "Total Video", value: totalVideos || 1, color: "#9CA3AF" },
    { name: "Total Short", value: totalShorts || 1, color: "#FCA5A5" },
  ]

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Data Analytics - Area Chart (takes 2 columns) */}
      <div className="col-span-2 rounded-lg border border-gray-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Data Analytics</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF6B8A]"></span>
              <span className="text-sm text-gray-600">Total User</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#9CA3AF]"></span>
              <span className="text-sm text-gray-600">Total Video</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FCA5A5]"></span>
              <span className="text-sm text-gray-600">Total Short</span>
            </div>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B8A" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#FF6B8A" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorShorts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#FCA5A5" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#FF6B8A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
              <Area
                type="monotone"
                dataKey="videos"
                stroke="#9CA3AF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVideos)"
              />
              <Area
                type="monotone"
                dataKey="shorts"
                stroke="#FCA5A5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorShorts)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Total User Activity - Donut Chart */}
      <div className="rounded-lg border border-gray-100 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Total User Activity</h3>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
