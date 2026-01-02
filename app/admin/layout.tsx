import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 pl-64">
        <AdminHeader user={session.user} />
        <main className="p-6 pt-20">{children}</main>
      </div>
    </div>
  )
}
