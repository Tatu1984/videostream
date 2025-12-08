import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { createAuditLog, getOrCreateAdminUser } from "@/lib/admin/audit"

const updateChannelSchema = z.object({
  action: z.enum([
    "verify",
    "unverify",
    "suspend",
    "restore",
    "enable_monetization",
    "disable_monetization",
    "warn",
  ]),
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

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
          },
        },
        videos: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
        strikes: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            videos: true,
            subscriptions: true,
            strikes: true,
          },
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Get revenue stats
    const revenue = await prisma.transaction.aggregate({
      where: {
        channelId: id,
        type: "AD_REVENUE",
        status: "COMPLETED",
      },
      _sum: { amount: true },
    })

    return NextResponse.json({
      channel,
      revenue: revenue._sum.amount || 0,
    })
  } catch (error) {
    console.error("Error fetching channel:", error)
    return NextResponse.json(
      { error: "Failed to fetch channel" },
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
    const { action, reason, notes } = updateChannelSchema.parse(body)

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: { owner: true },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const adminUser = await getOrCreateAdminUser(session.user.id)
    let updatedChannel
    let auditAction: any

    switch (action) {
      case "verify":
        updatedChannel = await prisma.channel.update({
          where: { id },
          data: { verified: true },
        })
        auditAction = "CHANNEL_VERIFIED"
        break

      case "unverify":
        updatedChannel = await prisma.channel.update({
          where: { id },
          data: { verified: false },
        })
        auditAction = "CHANNEL_UNVERIFIED"
        break

      case "suspend":
        updatedChannel = await prisma.channel.update({
          where: { id },
          data: { status: "SUSPENDED" },
        })
        auditAction = "CHANNEL_SUSPENDED"
        // Notify owner
        await prisma.notification.create({
          data: {
            userId: channel.ownerId,
            type: "SYSTEM",
            title: "Channel Suspended",
            message: reason || "Your channel has been suspended for policy violations.",
            channelId: id,
          },
        })
        break

      case "restore":
        updatedChannel = await prisma.channel.update({
          where: { id },
          data: { status: "ACTIVE" },
        })
        auditAction = "CHANNEL_RESTORED"
        break

      case "enable_monetization":
        updatedChannel = await prisma.channel.update({
          where: { id },
          data: { monetizationEnabled: true },
        })
        auditAction = "CHANNEL_MONETIZATION_ENABLED"
        break

      case "disable_monetization":
        updatedChannel = await prisma.channel.update({
          where: { id },
          data: { monetizationEnabled: false },
        })
        auditAction = "CHANNEL_MONETIZATION_DISABLED"
        // Notify owner
        await prisma.notification.create({
          data: {
            userId: channel.ownerId,
            type: "SYSTEM",
            title: "Monetization Disabled",
            message: reason || "Monetization has been disabled on your channel.",
            channelId: id,
          },
        })
        break

      case "warn":
        // Create a notification for the owner
        await prisma.notification.create({
          data: {
            userId: channel.ownerId,
            type: "SYSTEM",
            title: "Channel Warning",
            message: reason || "Your channel has received a warning for policy violations.",
            channelId: id,
          },
        })
        updatedChannel = channel
        auditAction = "CHANNEL_WARNED"
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
      targetType: "Channel",
      targetId: id,
      oldValue: {
        verified: channel.verified,
        status: channel.status,
        monetizationEnabled: channel.monetizationEnabled,
      },
      newValue: {
        verified: updatedChannel.verified,
        status: updatedChannel.status,
        monetizationEnabled: updatedChannel.monetizationEnabled,
      },
      notes: notes || reason,
    })

    return NextResponse.json({ channel: updatedChannel, message: `Channel ${action} successful` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating channel:", error)
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    )
  }
}
