import { auth } from "@/lib/auth/auth"
import { Header } from "@/components/shared/navigation/header"
import { Sidebar } from "@/components/shared/navigation/sidebar"

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session?.user} />
      <div className="flex pt-14">
        <Sidebar />
        <main className="ml-64 flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
