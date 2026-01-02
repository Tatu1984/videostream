import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plans = await prisma.coinPlan.findMany({
      orderBy: { price: "asc" },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Failed to fetch plans:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, coins, bonusCoins, price } = await request.json()

    if (!name || !coins || !price) {
      return NextResponse.json(
        { error: "Name, coins, and price are required" },
        { status: 400 }
      )
    }

    const plan = await prisma.coinPlan.create({
      data: {
        name,
        description,
        coins,
        bonusCoins: bonusCoins || 0,
        price,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Failed to create plan:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}
