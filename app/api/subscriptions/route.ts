import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET user's subscriptions
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")

    // Check if subscribed to a specific channel
    if (channelId) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId,
          },
        },
      })

      return NextResponse.json({
        isSubscribed: !!subscription,
        notificationLevel: subscription?.notificationLevel || null,
      })
    }

    // Get all subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
            verified: true,
            subscriberCount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    )
  }
}

// POST subscribe/unsubscribe
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId, notificationLevel = "PERSONALIZED" } = await req.json()

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      )
    }

    // Check if channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Can't subscribe to own channel
    if (channel.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot subscribe to your own channel" },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId,
        },
      },
    })

    if (existingSubscription) {
      // Unsubscribe
      await prisma.subscription.delete({
        where: { id: existingSubscription.id },
      })

      await prisma.channel.update({
        where: { id: channelId },
        data: { subscriberCount: { decrement: 1 } },
      })

      return NextResponse.json({
        message: "Unsubscribed",
        isSubscribed: false,
      })
    }

    // Subscribe
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        channelId,
        notificationLevel: notificationLevel as any,
      },
    })

    await prisma.channel.update({
      where: { id: channelId },
      data: { subscriberCount: { increment: 1 } },
    })

    // Create notification for channel owner
    await prisma.notification.create({
      data: {
        userId: channel.ownerId,
        type: "SUBSCRIPTION",
        title: "New Subscriber",
        message: `${session.user.name || "Someone"} subscribed to your channel`,
        channelId,
      },
    })

    return NextResponse.json({
      message: "Subscribed",
      isSubscribed: true,
    })
  } catch (error) {
    console.error("Error managing subscription:", error)
    return NextResponse.json(
      { error: "Failed to manage subscription" },
      { status: 500 }
    )
  }
}

// PATCH update notification level
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId, notificationLevel } = await req.json()

    if (!channelId || !notificationLevel) {
      return NextResponse.json(
        { error: "channelId and notificationLevel are required" },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Not subscribed to this channel" },
        { status: 404 }
      )
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { notificationLevel: notificationLevel as any },
    })

    return NextResponse.json({ message: "Notification level updated" })
  } catch (error) {
    console.error("Error updating notification level:", error)
    return NextResponse.json(
      { error: "Failed to update notification level" },
      { status: 500 }
    )
  }
}
