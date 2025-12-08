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
    const status = searchParams.get("status")
    const targetType = searchParams.get("targetType")
    const reason = searchParams.get("reason")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (targetType) {
      where.targetType = targetType
    }

    if (reason) {
      where.reason = reason
    }

    const [flags, total] = await Promise.all([
      prisma.flag.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              username: true,
              trustScore: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              channel: {
                select: {
                  id: true,
                  name: true,
                  handle: true,
                },
              },
            },
          },
          flaggedComment: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.flag.count({ where }),
    ])

    // Get counts by status
    const statusCounts = await prisma.flag.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    return NextResponse.json({
      flags,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status
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
    console.error("Error fetching flags:", error)
    return NextResponse.json(
      { error: "Failed to fetch flags" },
      { status: 500 }
    )
  }
}
