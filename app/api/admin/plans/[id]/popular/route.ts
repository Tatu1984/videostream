import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Reset all plans to not popular
    await prisma.coinPlan.updateMany({
      where: { isPopular: true },
      data: { isPopular: false },
    })

    // Set the selected plan as popular
    const plan = await prisma.coinPlan.update({
      where: { id },
      data: { isPopular: true },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Failed to set popular plan:", error)
    return NextResponse.json({ error: "Failed to set popular plan" }, { status: 500 })
  }
}
