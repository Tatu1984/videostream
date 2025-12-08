import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createReferenceAssetSchema = z.object({
  rightsHolderId: z.string(),
  title: z.string(),
  assetType: z.enum(["AUDIO", "VIDEO", "SUBTITLE", "THUMBNAIL"]),
  fingerprint: z.string(),
  policy: z.enum(["BLOCK", "MONETIZE", "TRACK"]).default("TRACK"),
  territories: z.array(z.string()).default([]),
  url: z.string().optional(),
  duration: z.number().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rightsHolderId = searchParams.get("rightsHolderId")

    const where = rightsHolderId ? { rightsHolderId } : {}

    const assets = await prisma.referenceAsset.findMany({
      where,
      include: {
        rightsHolder: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error("Error fetching reference assets:", error)
    return NextResponse.json(
      { error: "Failed to fetch reference assets" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createReferenceAssetSchema.parse(body)

    const asset = await prisma.referenceAsset.create({
      data: validatedData,
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating reference asset:", error)
    return NextResponse.json(
      { error: "Failed to create reference asset" },
      { status: 500 }
    )
  }
}
