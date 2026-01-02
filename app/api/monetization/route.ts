import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET monetization status and earnings
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")

    // Get user's channels
    const channels = await prisma.channel.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        monetizationEnabled: true,
        subscriberCount: true,
      },
    })

    // Calculate earnings from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        type: { in: ["AD_REVENUE", "MEMBERSHIP", "SUPERCHAT", "DONATION"] },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0)
    const pendingPayouts = await prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: "PENDING",
        type: "PAYOUT",
      },
      _sum: { amount: true },
    })

    // Monthly breakdown
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const monthlyEarnings = transactions
      .filter((t) => new Date(t.createdAt) >= thisMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    // Revenue by type
    const revenueByType = transactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      channels,
      totalEarnings,
      monthlyEarnings,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      revenueByType,
      recentTransactions: transactions.slice(0, 10),
    })
  } catch (error) {
    console.error("Error fetching monetization:", error)
    return NextResponse.json(
      { error: "Failed to fetch monetization data" },
      { status: 500 }
    )
  }
}

// POST enable/disable monetization
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId, enabled } = await req.json()

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        ownerId: session.user.id,
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found or you don't have permission" },
        { status: 403 }
      )
    }

    // Check eligibility (e.g., minimum subscribers)
    if (enabled && channel.subscriberCount < 1000) {
      return NextResponse.json(
        { error: "You need at least 1,000 subscribers to enable monetization" },
        { status: 400 }
      )
    }

    await prisma.channel.update({
      where: { id: channelId },
      data: { monetizationEnabled: enabled },
    })

    return NextResponse.json({
      message: enabled ? "Monetization enabled" : "Monetization disabled",
      monetizationEnabled: enabled,
    })
  } catch (error) {
    console.error("Error updating monetization:", error)
    return NextResponse.json(
      { error: "Failed to update monetization" },
      { status: 500 }
    )
  }
}
