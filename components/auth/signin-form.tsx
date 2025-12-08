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

export function SigninForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
  })

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
        router.push("/")
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
        <h1 className="text-3xl font-bold">Sign in to MeTube</h1>
        <p className="mt-2 text-gray-600">Welcome back</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            className="mt-1"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="••••••••"
            className="mt-1"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline"
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
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("facebook")}
        >
          Facebook
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="font-medium text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
