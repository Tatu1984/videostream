import { prisma } from "@/lib/db/prisma"

// Helper to get or create an AdminUser record for audit logging
// Since we use User with role=ADMIN, we need to sync to AdminUser for audit logs
export async function getOrCreateAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  })

  if (!user || user.role !== "ADMIN") {
    throw new Error("User is not an admin")
  }

  // Check if AdminUser exists
  let adminUser = await prisma.adminUser.findUnique({
    where: { email: user.email! },
  })

  if (!adminUser) {
    // Create AdminUser record for audit logging
    adminUser = await prisma.adminUser.create({
      data: {
        email: user.email!,
        name: user.name || "Admin",
        password: "", // Not used for auth, just for audit linking
        role: "SUPER_ADMIN",
        permissions: ["ALL"],
        active: true,
      },
    })
  }

  return adminUser
}

export type AuditAction =
  | "USER_SUSPENDED"
  | "USER_BANNED"
  | "USER_WARNED"
  | "USER_ROLE_CHANGED"
  | "USER_RESTORED"
  | "CHANNEL_VERIFIED"
  | "CHANNEL_UNVERIFIED"
  | "CHANNEL_SUSPENDED"
  | "CHANNEL_RESTORED"
  | "CHANNEL_MONETIZATION_ENABLED"
  | "CHANNEL_MONETIZATION_DISABLED"
  | "VIDEO_REMOVED"
  | "VIDEO_RESTORED"
  | "VIDEO_AGE_RESTRICTED"
  | "VIDEO_VISIBILITY_CHANGED"
  | "FLAG_RESOLVED"
  | "FLAG_DISMISSED"
  | "STRIKE_ISSUED"
  | "STRIKE_REMOVED"
  | "COPYRIGHT_CLAIM_UPHELD"
  | "COPYRIGHT_CLAIM_REJECTED"
  | "SETTINGS_UPDATED"

export type TargetType = "User" | "Channel" | "Video" | "Flag" | "Strike" | "CopyrightClaim" | "Settings"

interface CreateAuditLogParams {
  adminId: string
  action: AuditAction
  targetType: TargetType
  targetId: string
  oldValue?: Record<string, any> | null
  newValue?: Record<string, any> | null
  notes?: string | null
}

export async function createAuditLog({
  adminId,
  action,
  targetType,
  targetId,
  oldValue,
  newValue,
  notes,
}: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      notes,
    },
  })
}

export async function getAuditLogs(options?: {
  targetType?: TargetType
  targetId?: string
  adminId?: string
  action?: AuditAction
  limit?: number
  offset?: number
}) {
  const { targetType, targetId, adminId, action, limit = 50, offset = 0 } = options || {}

  const where: any = {}

  if (targetType) where.targetType = targetType
  if (targetId) where.targetId = targetId
  if (adminId) where.adminId = adminId
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}
