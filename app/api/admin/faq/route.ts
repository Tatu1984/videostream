import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const faqs = await prisma.fAQ.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Failed to fetch FAQs:", error)
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { question, answer, category } = await request.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      )
    }

    const maxOrder = await prisma.fAQ.aggregate({
      _max: { order: true },
    })

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category: category || "General",
        order: (maxOrder._max.order || 0) + 1,
      },
    })

    return NextResponse.json({ faq })
  } catch (error) {
    console.error("Failed to create FAQ:", error)
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
  }
}
