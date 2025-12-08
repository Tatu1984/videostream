import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@metube.com' },
    update: {
      role: 'ADMIN',
    },
    create: {
      email: 'admin@metube.com',
      name: 'Admin User',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user created successfully!')
  console.log('\n📧 Email: admin@metube.com')
  console.log('🔑 Password: admin123')
  console.log('\n🔗 Admin Dashboard: http://localhost:3001/admin')
  console.log('🔗 Sign In: http://localhost:3001/auth/signin')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
