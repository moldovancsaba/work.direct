/**
 * Rate Limiter Utility
 * 
 * What: Provides rate limiting functionality to prevent brute-force attacks
 * Why: Authentication endpoints need protection against automated abuse
 * 
 * This module implements in-memory rate limiting using rate-limiter-flexible.
 * It's designed to be simple and effective for MVP while being easy to upgrade
 * to Redis-backed storage for production scaling.
 */

import { RateLimiterMemory } from 'rate-limiter-flexible'

/**
 * Authentication Rate Limiter
 * What: Limits authentication attempts to 5 per minute per IP
 * Why: Prevents brute-force password attacks and credential stuffing
 */
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds (1 minute)
  blockDuration: 60 * 15, // Block for 15 minutes after exceeding limit
})

/**
 * Gameplay Rate Limiter
 * What: Limits gameplay actions to 20 per minute per IP
 * Why: Prevents spam and cheating while allowing normal gameplay
 */
const gameplayLimiter = new RateLimiterMemory({
  points: 20, // 20 requests
  duration: 60, // Per 60 seconds (1 minute)
  blockDuration: 60 * 5, // Block for 5 minutes after exceeding limit
})

/**
 * Public API Rate Limiter
 * What: Limits public API calls to 60 per minute per IP
 * Why: Prevents API abuse while allowing reasonable browsing
 */
const publicLimiter = new RateLimiterMemory({
  points: 60, // 60 requests
  duration: 60, // Per 60 seconds (1 minute)
  blockDuration: 60, // Block for 1 minute
})

/**
 * Admin Operations Rate Limiter
 * What: Limits admin operations to 30 per minute per IP
 * Why: Protects admin endpoints from abuse while allowing normal admin work
 */
const adminLimiter = new RateLimiterMemory({
  points: 30, // 30 requests
  duration: 60, // Per 60 seconds (1 minute)
  blockDuration: 60 * 10, // Block for 10 minutes after exceeding limit
})

/**
 * Rate limit check for authentication endpoints
 * 
 * What: Checks if an IP has exceeded rate limits for auth attempts
 * Why: Core rate limiting logic extracted for reuse across auth routes
 * 
 * @param identifier - Typically the IP address or user identifier
 * @returns Object with success status and optional retry info
 */
export async function checkAuthRateLimit(identifier: string): Promise<{
  success: boolean
  remainingPoints?: number
  msBeforeNext?: number
  retryAfter?: number
}> {
  try {
    // Attempt to consume 1 point
    // What: Decrements the available points for this identifier
    // Why: Each attempt consumes one point; when points run out, limit is exceeded
    const rateLimitRes = await authLimiter.consume(identifier, 1)
    
    return {
      success: true,
      remainingPoints: rateLimitRes.remainingPoints,
      msBeforeNext: rateLimitRes.msBeforeNext,
    }
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    // What: Return failure with retry-after information
    // Why: Client needs to know when they can try again
    return {
      success: false,
      retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000) || 60,
    }
  }
}

/**
 * Rate limit check for gameplay endpoints
 * 
 * What: Checks if an IP has exceeded rate limits for game play actions
 * Why: Protects game endpoints from spam while allowing normal gameplay
 * 
 * @param identifier - Typically the IP address or user identifier
 * @returns Object with success status and optional retry info
 */
export async function checkGameplayRateLimit(identifier: string): Promise<{
  success: boolean
  remainingPoints?: number
  msBeforeNext?: number
  retryAfter?: number
}> {
  try {
    const rateLimitRes = await gameplayLimiter.consume(identifier, 1)
    
    return {
      success: true,
      remainingPoints: rateLimitRes.remainingPoints,
      msBeforeNext: rateLimitRes.msBeforeNext,
    }
  } catch (rateLimiterRes: any) {
    return {
      success: false,
      retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000) || 60,
    }
  }
}

/**
 * Rate limit check for public API endpoints
 * 
 * What: Checks if an IP has exceeded rate limits for public API calls
 * Why: Protects public endpoints from abuse
 * 
 * @param identifier - Typically the IP address or user identifier
 * @returns Object with success status and optional retry info
 */
export async function checkPublicRateLimit(identifier: string): Promise<{
  success: boolean
  remainingPoints?: number
  msBeforeNext?: number
  retryAfter?: number
}> {
  try {
    const rateLimitRes = await publicLimiter.consume(identifier, 1)
    
    return {
      success: true,
      remainingPoints: rateLimitRes.remainingPoints,
      msBeforeNext: rateLimitRes.msBeforeNext,
    }
  } catch (rateLimiterRes: any) {
    return {
      success: false,
      retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000) || 60,
    }
  }
}

/**
 * Rate limit check for admin operation endpoints
 * 
 * What: Checks if an IP has exceeded rate limits for admin operations
 * Why: Protects admin endpoints from abuse
 * 
 * @param identifier - Typically the IP address or user identifier
 * @returns Object with success status and optional retry info
 */
export async function checkAdminRateLimit(identifier: string): Promise<{
  success: boolean
  remainingPoints?: number
  msBeforeNext?: number
  retryAfter?: number
}> {
  try {
    const rateLimitRes = await adminLimiter.consume(identifier, 1)
    
    return {
      success: true,
      remainingPoints: rateLimitRes.remainingPoints,
      msBeforeNext: rateLimitRes.msBeforeNext,
    }
  } catch (rateLimiterRes: any) {
    return {
      success: false,
      retryAfter: Math.round(rateLimiterRes.msBeforeNext / 1000) || 60,
    }
  }
}

/**
 * Get client identifier from request
 * 
 * What: Extracts a unique identifier (IP address) from the request
 * Why: Rate limiting needs a consistent identifier to track attempts
 * 
 * This checks multiple headers to handle various proxy/CDN configurations:
 * - x-forwarded-for (most common for proxies)
 * - x-real-ip (nginx proxy)
 * - cf-connecting-ip (Cloudflare)
 * - Falls back to 'unknown' if no IP found
 * 
 * @param headers - Request headers object
 * @returns Client IP address or 'unknown'
 */
export function getClientIdentifier(headers: Headers): string {
  // What: Try various headers to get real client IP
  // Why: Different proxies/CDNs use different headers
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const cfIp = headers.get('cf-connecting-ip')
  
  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
  // What: Take the first IP which is the original client
  // Why: Subsequent IPs are proxy hops, not the original client
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  // What: Use alternative headers if x-forwarded-for not available
  // Why: Fallback chain ensures we get an IP in most environments
  if (realIp) return realIp
  if (cfIp) return cfIp
  
  // What: Return 'unknown' if no IP found
  // Why: Still need to rate limit, even if we can't identify the client perfectly
  return 'unknown'
}

/**
 * Helper to create a rate limit error response
 * 
 * What: Standardized HTTP 429 error response for rate limiting
 * Why: Consistent error format across all rate-limited endpoints
 * 
 * @param retryAfter - Seconds until client can retry
 * @returns Formatted error response object
 */
export function createRateLimitResponse(retryAfter: number) {
  return {
    success: false,
    message: 'Too many requests. Please try again later.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    },
  }
}
