import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// POST request payout
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, paymentMethod } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    // Calculate available balance
    const earnings = await prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        type: { in: ["AD_REVENUE", "MEMBERSHIP", "SUPERCHAT", "DONATION"] },
      },
      _sum: { amount: true },
    })

    const payouts = await prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        type: "PAYOUT",
      },
      _sum: { amount: true },
    })

    const availableBalance =
      (earnings._sum.amount || 0) - (payouts._sum.amount || 0)

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      )
    }

    // Minimum payout threshold
    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum payout is $100" },
        { status: 400 }
      )
    }

    // Create payout request
    const payout = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "PAYOUT",
        amount: -amount, // Negative for payout
        currency: "USD",
        status: "PENDING",
        paymentMethod,
      },
    })

    return NextResponse.json({
      message: "Payout requested successfully",
      payout,
    })
  } catch (error) {
    console.error("Error requesting payout:", error)
    return NextResponse.json(
      { error: "Failed to request payout" },
      { status: 500 }
    )
  }
}

// GET payout history
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payouts = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "PAYOUT",
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error("Error fetching payouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    )
  }
}
