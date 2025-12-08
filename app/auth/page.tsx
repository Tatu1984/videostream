import Link from "next/link"
import { Button } from "@/components/shared/ui/button"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left side - Branding */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="mb-4 text-5xl font-bold text-gray-900">
                Welcome to MeTube
              </h1>
              <p className="text-xl text-gray-600">
                Share your videos with the world. Watch, create, and connect.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload Videos</h3>
                  <p className="text-gray-600">Share your content with millions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Discover Content</h3>
                  <p className="text-gray-600">Find videos you'll love</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Build Community</h3>
                  <p className="text-gray-600">Connect with creators and fans</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
                Get Started
              </h2>

              <div className="space-y-4">
                <Link href="/auth/signin" className="block">
                  <Button className="w-full h-12 text-lg" size="lg">
                    Sign In
                  </Button>
                </Link>

                <Link href="/auth/signup" className="block">
                  <Button variant="outline" className="w-full h-12 text-lg" size="lg">
                    Create Account
                  </Button>
                </Link>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Link href="/" className="block">
                  <Button variant="ghost" className="w-full h-12 text-lg" size="lg">
                    Browse as Guest
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
