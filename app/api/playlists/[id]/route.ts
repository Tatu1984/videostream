import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET playlist by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        videos: {
          include: {
            video: {
              include: {
                channel: {
                  select: {
                    id: true,
                    name: true,
                    handle: true,
                    avatar: true,
                    verified: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Check visibility
    if (playlist.visibility === "PRIVATE") {
      if (!session?.user || playlist.userId !== session.user.id) {
        return NextResponse.json(
          { error: "This playlist is private" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      ...playlist,
      videos: playlist.videos.map((pv) => ({
        ...pv.video,
        position: pv.position,
        addedAt: pv.addedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    )
  }
}

// PATCH update playlist
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this playlist" },
        { status: 403 }
      )
    }

    const { title, description, visibility } = await req.json()

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating playlist:", error)
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    )
  }
}

// DELETE playlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this playlist" },
        { status: 403 }
      )
    }

    await prisma.playlist.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Playlist deleted" })
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    )
  }
}
