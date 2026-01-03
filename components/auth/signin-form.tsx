"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import Link from "next/link"

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type SigninFormData = z.infer<typeof signinSchema>

// Demo accounts for testing
const demoAccounts = [
  { role: "Super Admin", email: "admin@metube.com", password: "admin123", color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800", redirect: "/admin" },
  { role: "Creator", email: "creator@metube.com", password: "creator123", color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800", redirect: "/studio" },
  { role: "User", email: "user@metube.com", password: "user123", color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800", redirect: "/" },
]

export function SigninForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
  })

  const [selectedRedirect, setSelectedRedirect] = useState("/")

  const fillDemoCredentials = (email: string, password: string, redirect: string) => {
    setValue("email", email)
    setValue("password", password)
    setSelectedRedirect(redirect)
  }

  const onSubmit = async (data: SigninFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push(selectedRedirect)
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/" })
    } catch (err) {
      setError("Failed to sign in with " + provider)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold dark:text-gray-100">Sign in to MeTube</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back</p>
      </div>

      {/* Demo Credentials - Only shown in development */}
      {demoAccounts.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f1f1f] p-4">
          <p className="mb-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Demo Accounts (click to fill)</p>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoCredentials(account.email, account.password, account.redirect)}
                className={`w-full rounded-lg border p-2 text-left text-sm transition-all hover:shadow-md ${account.color}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{account.role}</span>
                    <span className="ml-2 text-xs opacity-60">→ {account.redirect}</span>
                  </div>
                  <span className="text-xs opacity-75">{account.email}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            className="mt-1 dark:bg-[#1f1f1f] dark:border-gray-700 dark:text-gray-100"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="••••••••"
            className="mt-1 dark:bg-[#1f1f1f] dark:border-gray-700 dark:text-gray-100"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 dark:bg-[#0f0f0f] px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
          className="dark:border-gray-700 dark:text-gray-100 dark:hover:bg-[#1f1f1f]"
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("facebook")}
          className="dark:border-gray-700 dark:text-gray-100 dark:hover:bg-[#1f1f1f]"
        >
          Facebook
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
