import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  max?: number // Maximum number of requests per window
  message?: string
}

const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many requests, please try again later.",
}

export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs, max, message } = { ...defaultOptions, ...options }

  return async function (req: NextRequest): Promise<NextResponse | null> {
    // Get client identifier (IP address or forwarded IP)
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1"
    const key = `${ip}:${req.nextUrl.pathname}`

    const now = Date.now()
    const record = rateLimitStore.get(key)

    // Clean up old entries periodically
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now - v.timestamp > windowMs!) {
          rateLimitStore.delete(k)
        }
      }
    }

    if (!record || now - record.timestamp > windowMs!) {
      // First request or window expired
      rateLimitStore.set(key, { count: 1, timestamp: now })
      return null
    }

    if (record.count >= max!) {
      // Rate limit exceeded
      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.timestamp + windowMs! - now) / 1000)),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil((record.timestamp + windowMs!) / 1000)),
          },
        }
      )
    }

    // Increment count
    record.count++
    return null
  }
}

// Helper to create rate limiters for different endpoints
export const rateLimiters = {
  // Auth endpoints - stricter limits
  auth: rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: "Too many authentication attempts. Please try again in 15 minutes." }),

  // Password reset - very strict
  passwordReset: rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: "Too many password reset requests. Please try again in an hour." }),

  // General API - moderate limits
  api: rateLimit({ windowMs: 60 * 1000, max: 100 }),

  // Upload endpoints - strict limits
  upload: rateLimit({ windowMs: 60 * 1000, max: 10, message: "Too many uploads. Please wait a minute." }),

  // Search - moderate limits
  search: rateLimit({ windowMs: 60 * 1000, max: 30 }),

  // Comments - to prevent spam
  comments: rateLimit({ windowMs: 60 * 1000, max: 20, message: "You're commenting too fast. Please slow down." }),
}

// Utility to apply rate limit in API routes
export async function withRateLimit(
  req: NextRequest,
  limiter: ReturnType<typeof rateLimit>
): Promise<NextResponse | null> {
  return limiter(req)
}
