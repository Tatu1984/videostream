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
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const verified = searchParams.get("verified")
    const monetization = searchParams.get("monetization")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { handle: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (verified !== null && verified !== undefined) {
      where.verified = verified === "true"
    }

    if (monetization !== null && monetization !== undefined) {
      where.monetizationEnabled = monetization === "true"
    }

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          _count: {
            select: {
              videos: true,
              subscriptions: true,
              strikes: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.channel.count({ where }),
    ])

    return NextResponse.json({
      channels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    )
  }
}
