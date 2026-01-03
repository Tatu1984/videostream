import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth"

// Routes that require authentication
const protectedRoutes = [
  "/studio",
  "/settings",
  "/library",
  "/subscriptions",
  "/notifications",
]

// Routes only accessible to admins
const adminRoutes = ["/admin"]

// Routes only accessible when NOT authenticated
const authRoutes = ["/auth/signin", "/auth/signup"]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check if user is authenticated
  const session = await auth()
  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.role === "ADMIN"

  // Check route types
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Redirect unauthenticated users to sign in
  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
  }

  // Check admin access
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
