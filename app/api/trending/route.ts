import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET trending videos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") // music, gaming, news, etc.
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get videos from the last 7 days with high engagement
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const where: any = {
      visibility: "PUBLIC",
      processingStatus: "COMPLETED",
      createdAt: { gte: sevenDaysAgo },
    }

    if (category) {
      where.category = category
    }

    // Get trending videos based on view count, likes, and recency
    const videos = await prisma.video.findMany({
      where,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
            verified: true,
          },
        },
      },
      orderBy: [
        { viewCount: "desc" },
        { likeCount: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    })

    // Get all unique categories for filtering
    const categories = await prisma.video.findMany({
      where: {
        visibility: "PUBLIC",
        processingStatus: "COMPLETED",
        category: { not: null },
      },
      select: { category: true },
      distinct: ["category"],
    })

    const uniqueCategories = categories
      .map((v) => v.category)
      .filter((c): c is string => c !== null)

    return NextResponse.json({
      videos,
      categories: uniqueCategories,
      total: videos.length,
    })
  } catch (error) {
    console.error("Error fetching trending:", error)
    return NextResponse.json(
      { error: "Failed to fetch trending videos" },
      { status: 500 }
    )
  }
}
