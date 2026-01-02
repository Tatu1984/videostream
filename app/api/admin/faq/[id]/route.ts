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

    const { question, answer, category } = await request.json()

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        question,
        answer,
        category,
      },
    })

    return NextResponse.json({ faq })
  } catch (error) {
    console.error("Failed to update FAQ:", error)
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
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

    const faq = await prisma.fAQ.update({
      where: { id },
      data,
    })

    return NextResponse.json({ faq })
  } catch (error) {
    console.error("Failed to update FAQ:", error)
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
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

    await prisma.fAQ.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete FAQ:", error)
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
  }
}
