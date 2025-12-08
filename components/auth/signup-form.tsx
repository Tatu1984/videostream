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

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          username: data.username,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create account")
        return
      }

      // Auto sign in after successful registration
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl: "/onboarding",
      })
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/onboarding" })
    } catch (err) {
      setError("Failed to sign in with " + provider)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-gray-600">Join MeTube today</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            {...register("name")}
            placeholder="John Doe"
            className="mt-1"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

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
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username (optional)
          </label>
          <Input
            id="username"
            type="text"
            {...register("username")}
            placeholder="johndoe"
            className="mt-1"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="••••••••"
            className="mt-1"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
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
        Already have an account?{" "}
        <Link href="/auth/signin" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
