import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { Header } from "@/components/shared/navigation/header"
import { redirect } from "next/navigation"

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

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
      <main className="pt-14">{children}</main>
    </div>
  )
}
