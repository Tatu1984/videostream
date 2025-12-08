import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const updateUserSchema = z.object({
  action: z.enum(["suspend", "ban", "warn", "restore", "change_role", "update_trust_score"]),
  role: z.enum(["USER", "CREATOR", "ADMIN"]).optional(),
  trustScore: z.number().min(0).max(100).optional(),
  reason: z.string().optional(),
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        channels: {
          include: {
            _count: {
              select: { videos: true, subscriptions: true },
            },
          },
        },
        strikes: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            comments: true,
            channels: true,
            flags: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const { action, role, trustScore, reason, notes } = updateUserSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-modification for critical actions
    if (user.id === session.user.id && ["suspend", "ban"].includes(action)) {
      return NextResponse.json(
        { error: "Cannot suspend or ban yourself" },
        { status: 400 }
      )
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)
    let updatedUser
    let auditAction: any

    switch (action) {
      case "suspend":
        updatedUser = await prisma.user.update({
          where: { id },
          data: { status: "SUSPENDED" },
        })
        auditAction = "USER_SUSPENDED"
        break

      case "ban":
        updatedUser = await prisma.user.update({
          where: { id },
          data: { status: "BANNED" },
        })
        auditAction = "USER_BANNED"
        break

      case "restore":
        updatedUser = await prisma.user.update({
          where: { id },
          data: { status: "ACTIVE" },
        })
        auditAction = "USER_RESTORED"
        break

      case "warn":
        // Create a notification for the user
        await prisma.notification.create({
          data: {
            userId: id,
            type: "SYSTEM",
            title: "Warning from Administration",
            message: reason || "You have received a warning for violating community guidelines.",
          },
        })
        // Reduce trust score
        updatedUser = await prisma.user.update({
          where: { id: id },
          data: { trustScore: Math.max(0, user.trustScore - 10) },
        })
        auditAction = "USER_WARNED"
        break

      case "change_role":
        if (!role) {
          return NextResponse.json(
            { error: "Role is required" },
            { status: 400 }
          )
        }
        updatedUser = await prisma.user.update({
          where: { id: id },
          data: { role },
        })
        auditAction = "USER_ROLE_CHANGED"
        break

      case "update_trust_score":
        if (trustScore === undefined) {
          return NextResponse.json(
            { error: "Trust score is required" },
            { status: 400 }
          )
        }
        updatedUser = await prisma.user.update({
          where: { id: id },
          data: { trustScore },
        })
        auditAction = "USER_ROLE_CHANGED" // Using same action for trust score changes
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
      targetType: "User",
      targetId: id,
      oldValue: { status: user.status, role: user.role, trustScore: user.trustScore },
      newValue: { status: updatedUser.status, role: updatedUser.role, trustScore: updatedUser.trustScore },
      notes: notes || reason,
    })

    return NextResponse.json({ user: updatedUser, message: `User ${action} successful` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
