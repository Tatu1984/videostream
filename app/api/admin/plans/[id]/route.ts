import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, coins, bonusCoins, price } = await request.json()

    const plan = await prisma.coinPlan.update({
      where: { id },
      data: {
        name,
        description,
        coins,
        bonusCoins,
        price,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Failed to update plan:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const plan = await prisma.coinPlan.update({
      where: { id },
      data,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Failed to update plan:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.coinPlan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete plan:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
