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
    const visibility = searchParams.get("visibility")
    const videoType = searchParams.get("videoType")
    const ageRestricted = searchParams.get("ageRestricted")
    const channelId = searchParams.get("channelId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (visibility) {
      where.visibility = visibility
    }

    if (videoType) {
      where.videoType = videoType
    }

    if (ageRestricted !== null && ageRestricted !== undefined) {
      where.ageRestricted = ageRestricted === "true"
    }

    if (channelId) {
      where.channelId = channelId
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              handle: true,
              verified: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              flags: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({ where }),
    ])

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    )
  }
}
