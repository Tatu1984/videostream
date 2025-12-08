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
    async jwt({ token }) {
      if (!token.sub) return token

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
      })

      if (!existingUser) return token

      token.name = existingUser.name
      token.email = existingUser.email
      token.picture = existingUser.image
      token.role = existingUser.role

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
