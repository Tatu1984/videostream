import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")
    const adminId = searchParams.get("adminId")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}

    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId
    if (adminId) where.adminId = adminId
    if (action) where.action = action

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Get action counts
    const actionCounts = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
    })

    // Get target type counts
    const targetTypeCounts = await prisma.auditLog.groupBy({
      by: ["targetType"],
      _count: { targetType: true },
    })

    // Get admin activity
    const adminActivity = await prisma.auditLog.groupBy({
      by: ["adminId"],
      _count: { adminId: true },
      orderBy: { _count: { adminId: "desc" } },
      take: 10,
    })

    // Fetch admin details for activity
    const adminIds = adminActivity.map((a) => a.adminId)
    const admins = await prisma.adminUser.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true },
    })

    const adminActivityWithDetails = adminActivity.map((a) => ({
      ...a,
      admin: admins.find((admin) => admin.id === a.adminId),
    }))

    return NextResponse.json({
      logs: logs.map((log) => ({
        ...log,
        oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
        newValue: log.newValue ? JSON.parse(log.newValue) : null,
      })),
      stats: {
        actionCounts: actionCounts.reduce((acc, curr) => {
          acc[curr.action] = curr._count.action
          return acc
        }, {} as Record<string, number>),
        targetTypeCounts: targetTypeCounts.reduce((acc, curr) => {
          acc[curr.targetType] = curr._count.targetType
          return acc
        }, {} as Record<string, number>),
        adminActivity: adminActivityWithDetails,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
