import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find the blocked user record
    const blockedUser = await prisma.blockedUser.findUnique({
      where: { id },
    })

    if (!blockedUser) {
      return NextResponse.json(
        { error: "Block record not found" },
        { status: 404 }
      )
    }

    // Verify the user owns this block
    if (blockedUser.blockerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Delete the block
    await prisma.blockedUser.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
