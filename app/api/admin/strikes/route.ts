import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const createStrikeSchema = z.object({
  userId: z.string(),
  channelId: z.string().optional(),
  type: z.enum(["COMMUNITY_GUIDELINES", "COPYRIGHT", "SPAM", "MISLEADING", "TERMS_OF_SERVICE"]),
  reason: z.string(),
  severity: z.enum(["WARNING", "STRIKE", "SUSPENSION", "TERMINATION"]),
  videoId: z.string().optional(),
  expiresInDays: z.number().default(90),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const channelId = searchParams.get("channelId")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const active = searchParams.get("active")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: any = {}

    if (userId) where.userId = userId
    if (channelId) where.channelId = channelId
    if (type) where.type = type
    if (severity) where.severity = severity
    if (active !== null && active !== undefined) {
      where.active = active === "true"
    }

    const [strikes, total] = await Promise.all([
      prisma.strike.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              handle: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.strike.count({ where }),
    ])

    // Get counts by type
    const typeCounts = await prisma.strike.groupBy({
      by: ["type"],
      where: { active: true },
      _count: { type: true },
    })

    return NextResponse.json({
      strikes,
      typeCounts: typeCounts.reduce((acc, curr) => {
        acc[curr.type] = curr._count.type
        return acc
      }, {} as Record<string, number>),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching strikes:", error)
    return NextResponse.json(
      { error: "Failed to fetch strikes" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = createStrikeSchema.parse(body)

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)

    // Create strike
    const strike = await prisma.strike.create({
      data: {
        userId: data.userId,
        channelId: data.channelId,
        type: data.type,
        reason: data.reason,
        severity: data.severity,
        videoId: data.videoId,
        issuedBy: session.user.id,
        expiresAt: new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000),
      },
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: "SYSTEM",
        title: `${data.severity === "WARNING" ? "Warning" : "Strike"} Issued`,
        message: data.reason,
        videoId: data.videoId,
        channelId: data.channelId,
      },
    })

    // Check if we need to take additional action based on strike count
    if (data.channelId && data.severity === "STRIKE") {
      const activeStrikes = await prisma.strike.count({
        where: {
          channelId: data.channelId,
          active: true,
          severity: "STRIKE",
        },
      })

      if (activeStrikes >= 3) {
        await prisma.channel.update({
          where: { id: data.channelId },
          data: { status: "SUSPENDED" },
        })

        await prisma.notification.create({
          data: {
            userId: data.userId,
            type: "SYSTEM",
            title: "Channel Suspended",
            message: "Your channel has been suspended due to multiple policy violations.",
            channelId: data.channelId,
          },
        })
      }
    }

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: "STRIKE_ISSUED",
      targetType: "Strike",
      targetId: strike.id,
      newValue: {
        type: data.type,
        severity: data.severity,
        reason: data.reason,
      },
    })

    return NextResponse.json({ strike, message: "Strike issued successfully" }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating strike:", error)
    return NextResponse.json(
      { error: "Failed to create strike" },
      { status: 500 }
    )
  }
}
