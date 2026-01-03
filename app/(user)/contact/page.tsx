"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/shared/ui/button"
import { Input } from "@/components/shared/ui/input"
import { CheckCircle, Mail, MessageSquare, HelpCircle } from "lucide-react"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(20, "Message must be at least 20 characters").max(5000),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong")
      }

      setIsSubmitted(true)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Message Sent!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Thank you for contacting us. We'll get back to you as soon as possible.
        </p>
        <Button onClick={() => setIsSubmitted(false)} className="mt-6">
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">Email Support</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Our team typically responds within 24 hours
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
            <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">Community</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Join our community for instant help
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
            <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">Help Center</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Browse FAQs and guides
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Name
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="John Doe"
                    className="mt-1 dark:bg-[#121212] dark:border-gray-600 dark:text-gray-100"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder="you@example.com"
                    className="mt-1 dark:bg-[#121212] dark:border-gray-600 dark:text-gray-100"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <Input
                  {...register("subject")}
                  placeholder="How can we help?"
                  className="mt-1 dark:bg-[#121212] dark:border-gray-600 dark:text-gray-100"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  {...register("message")}
                  rows={6}
                  placeholder="Tell us more about your question or feedback..."
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-[#121212] dark:text-gray-100 dark:placeholder-gray-500"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
