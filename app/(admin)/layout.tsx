import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <AdminHeader user={session.user} />
      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
