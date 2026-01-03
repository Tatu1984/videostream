import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create Super Admin
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@metube.com" },
    update: { password: adminPassword, role: "ADMIN" },
    create: {
      email: "admin@metube.com",
      name: "Super Admin",
      username: "superadmin",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  })
  console.log("Created/updated admin:", admin.email)

  // Create Demo Creator
  const creatorPassword = await bcrypt.hash("creator123", 10)
  const creator = await prisma.user.upsert({
    where: { email: "creator@metube.com" },
    update: { password: creatorPassword, role: "CREATOR" },
    create: {
      email: "creator@metube.com",
      name: "Demo Creator",
      username: "democreator",
      password: creatorPassword,
      role: "CREATOR",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  })
  console.log("Created creator:", creator.email)

  // Create channel for creator
  const channel = await prisma.channel.upsert({
    where: { handle: "demochannel" },
    update: {},
    create: {
      name: "Demo Channel",
      handle: "demochannel",
      description: "This is a demo channel for testing",
      ownerId: creator.id,
      verified: true,
      subscriberCount: 1500,
      videoCount: 0,
    },
  })
  console.log("Created channel:", channel.name)

  // Create Demo User
  const userPassword = await bcrypt.hash("user123", 10)
  const user = await prisma.user.upsert({
    where: { email: "user@metube.com" },
    update: { password: userPassword, role: "USER" },
    create: {
      email: "user@metube.com",
      name: "Demo User",
      username: "demouser",
      password: userPassword,
      role: "USER",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  })
  console.log("Created/updated user:", user.email)

  console.log("\n=== Demo Credentials ===")
  console.log("Super Admin: admin@metube.com / admin123")
  console.log("Creator:     creator@metube.com / creator123")
  console.log("User:        user@metube.com / user123")
  console.log("========================\n")

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
