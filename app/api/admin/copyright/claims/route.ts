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
    const claimType = searchParams.get("claimType")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (claimType) {
      where.claimType = claimType
    }

    const [claims, total] = await Promise.all([
      prisma.copyrightClaim.findMany({
        where,
        include: {
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
                  owner: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          rightsHolder: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
              verified: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.copyrightClaim.count({ where }),
    ])

    // Get counts by status
    const statusCounts = await prisma.copyrightClaim.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    return NextResponse.json({
      claims,
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
    console.error("Error fetching copyright claims:", error)
    return NextResponse.json(
      { error: "Failed to fetch copyright claims" },
      { status: 500 }
    )
  }
}
