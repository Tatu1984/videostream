import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"
import authConfig from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }

      if (token.role && session.user) {
        session.user.role = token.role as any
      }

      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email as string
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      // Only fetch user data on initial sign-in (when user is provided)
      // This avoids Prisma calls on subsequent requests (important for Edge Runtime)
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = (user as any).role
      }

      return token
    },
  },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      })
    },
  },
})
