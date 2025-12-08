import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user || !user.password) return null

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) return user
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/onboarding",
  },
} satisfies NextAuthConfig
