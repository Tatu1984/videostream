import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { Header } from "@/components/shared/navigation/header"
import { Sidebar } from "@/components/shared/navigation/sidebar"

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Get user role from database
  let userWithRole = null
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    userWithRole = {
      ...session.user,
      role: dbUser?.role || "USER",
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <Header user={userWithRole} />
      <div className="flex pt-14">
        <Sidebar />
        <main className="ml-64 flex-1 p-6 dark:text-gray-100">{children}</main>
      </div>
    </div>
  )
}
