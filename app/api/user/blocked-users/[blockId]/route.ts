import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { blockId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the block belongs to the current user
    const block = await prisma.blockedUser.findUnique({
      where: { id: blockId },
    })

    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 })
    }

    if (block.blockerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only unblock users you have blocked" },
        { status: 403 }
      )
    }

    await prisma.blockedUser.delete({
      where: { id: blockId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return NextResponse.json(
      { error: "Failed to unblock user" },
      { status: 500 }
    )
  }
}
