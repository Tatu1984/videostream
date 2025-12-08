import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const updateStrikeSchema = z.object({
  action: z.enum(["remove", "expire", "update_severity"]),
  severity: z.enum(["WARNING", "STRIKE", "SUSPENSION", "TERMINATION"]).optional(),
  notes: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const strike = await prisma.strike.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
          },
        },
      },
    })

    if (!strike) {
      return NextResponse.json({ error: "Strike not found" }, { status: 404 })
    }

    return NextResponse.json({ strike })
  } catch (error) {
    console.error("Error fetching strike:", error)
    return NextResponse.json(
      { error: "Failed to fetch strike" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, severity, notes } = updateStrikeSchema.parse(body)

    const strike = await prisma.strike.findUnique({
      where: { id },
      include: {
        user: true,
        channel: true,
      },
    })

    if (!strike) {
      return NextResponse.json({ error: "Strike not found" }, { status: 404 })
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)
    let updatedStrike
    let auditAction: any = "STRIKE_REMOVED"

    switch (action) {
      case "remove":
        updatedStrike = await prisma.strike.update({
          where: { id },
          data: { active: false },
        })

        // Notify user
        await prisma.notification.create({
          data: {
            userId: strike.userId,
            type: "SYSTEM",
            title: "Strike Removed",
            message: "A strike on your account has been removed.",
            channelId: strike.channelId,
          },
        })

        // Check if channel should be restored
        if (strike.channelId) {
          const remainingStrikes = await prisma.strike.count({
            where: {
              channelId: strike.channelId,
              active: true,
              severity: "STRIKE",
            },
          })

          if (remainingStrikes < 3) {
            const channel = await prisma.channel.findUnique({
              where: { id: strike.channelId },
            })

            if (channel?.status === "SUSPENDED") {
              await prisma.channel.update({
                where: { id: strike.channelId },
                data: { status: "ACTIVE" },
              })
            }
          }
        }
        break

      case "expire":
        updatedStrike = await prisma.strike.update({
          where: { id },
          data: {
            active: false,
            expiresAt: new Date(),
          },
        })
        break

      case "update_severity":
        if (!severity) {
          return NextResponse.json(
            { error: "Severity is required" },
            { status: 400 }
          )
        }
        updatedStrike = await prisma.strike.update({
          where: { id },
          data: { severity },
        })
        auditAction = "STRIKE_ISSUED" // Reusing for update
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: auditAction,
      targetType: "Strike",
      targetId: id,
      oldValue: { active: strike.active, severity: strike.severity },
      newValue: { active: updatedStrike.active, severity: updatedStrike.severity },
      notes,
    })

    return NextResponse.json({
      strike: updatedStrike,
      message: `Strike ${action} successful`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating strike:", error)
    return NextResponse.json(
      { error: "Failed to update strike" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const strike = await prisma.strike.findUnique({
      where: { id },
    })

    if (!strike) {
      return NextResponse.json({ error: "Strike not found" }, { status: 404 })
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)

    await prisma.strike.delete({
      where: { id },
    })

    // Create audit log
    await createAuditLog({
      adminId: adminUser.id,
      action: "STRIKE_REMOVED",
      targetType: "Strike",
      targetId: id,
      oldValue: { type: strike.type, severity: strike.severity },
      newValue: null,
      notes: "Strike permanently deleted",
    })

    return NextResponse.json({ message: "Strike deleted successfully" })
  } catch (error) {
    console.error("Error deleting strike:", error)
    return NextResponse.json(
      { error: "Failed to delete strike" },
      { status: 500 }
    )
  }
}
