/**
 * Structured Logger
 * 
 * What: Centralized logging system using Pino for server-side and browser console for client-side
 * Why: Provides consistent structured logging across the application with environment-appropriate formatting
 * 
 * Server-side: Uses Pino with pretty formatting in development and JSON in production
 * Client-side: Uses browser console with throttling to prevent log spam and no PII logging
 * 
 * Usage:
 *   import { logger } from '@/app/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Database connection failed', { error })
 */

import pino from 'pino'

// What: Determine if code is running on server or client
// Why: Different logging strategies needed for server (Pino) vs client (console)
const isServer = typeof window === 'undefined'

// What: Determine if running in development mode
// Why: Pretty formatting in dev, JSON in production for log aggregation
const isDev = process.env.NODE_ENV === 'development'

// What: Configure log level from environment variable
// Why: Allows runtime control of log verbosity without code changes
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')

// ============================================================================
// SERVER-SIDE LOGGER (Pino)
// ============================================================================

/**
 * What: Create Pino logger instance for server-side logging
 * Why: Pino is fast, structured, and supports multiple transports
 * 
 * Development: Simple JSON output (avoids worker thread issues in Next.js)
 * Production: JSON format for log aggregation services
 */
const serverLogger = isServer
  ? pino({
      level: logLevel,
      // What: Use simple JSON logging in all environments
      // Why: Avoids worker thread issues with pino-pretty in Next.js dev mode
      // Note: Logs are still structured and readable in dev console
      // What: Base configuration for all logs
      // Why: Consistent metadata across all log entries
      base: {
        env: process.env.NODE_ENV,
      },
    })
  : null

// ============================================================================
// CLIENT-SIDE LOGGER (Browser Console with Throttling)
// ============================================================================

/**
 * What: Client-side log throttling configuration
 * Why: Prevents console spam from rapid repeated logs (e.g., in loops or rapid events)
 */
const CLIENT_LOG_THROTTLE_MS = 1000 // 1 second between identical messages
const clientLogCache = new Map<string, number>()

/**
 * What: Check if a log message should be throttled on the client
 * Why: Prevents console flooding from repeated identical messages
 * 
 * @param message - The log message to check
 * @returns true if message should be logged, false if throttled
 */
function shouldLogOnClient(message: string): boolean {
  // What: Always log in development mode
  // Why: During development, we want to see all logs for debugging
  if (isDev) return true

  const now = Date.now()
  const lastLogged = clientLogCache.get(message)

  // What: Check if message was recently logged
  // Why: Throttle duplicate messages to prevent spam
  if (lastLogged && now - lastLogged < CLIENT_LOG_THROTTLE_MS) {
    return false
  }

  clientLogCache.set(message, now)
  return true
}

/**
 * What: Clean up old entries from client log cache
 * Why: Prevents memory leak from cache growing indefinitely
 */
function cleanClientLogCache() {
  const now = Date.now()
  const entriesToDelete: string[] = []

  clientLogCache.forEach((timestamp, message) => {
    if (now - timestamp > CLIENT_LOG_THROTTLE_MS * 2) {
      entriesToDelete.push(message)
    }
  })

  entriesToDelete.forEach((message) => clientLogCache.delete(message))
}

// What: Run cache cleanup every 10 seconds
// Why: Keeps memory usage bounded on long-running client sessions
if (!isServer) {
  setInterval(cleanClientLogCache, 10000)
}

/**
 * What: Sanitize data to remove PII before logging on client
 * Why: NEVER log personally identifiable information from the browser
 * 
 * Removes: email, phone, password, token, accessToken, sessionId, userId (when it looks like a real ID)
 * 
 * @param data - Object to sanitize
 * @returns Sanitized copy of the object
 */
function sanitizeForClient(data: any): any {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data }
  const piiFields = ['email', 'phone', 'password', 'token', 'accessToken', 'sessionId']

  piiFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  })

  // What: Redact userId if it looks like a real user ID (not 'admin' or generic identifiers)
  // Why: Protect actual user identifiers while allowing generic role identifiers
  if (sanitized.userId && typeof sanitized.userId === 'string' && sanitized.userId.length > 10) {
    sanitized.userId = '[REDACTED]'
  }

  return sanitized
}

// ============================================================================
// UNIFIED LOGGER INTERFACE
// ============================================================================

/**
 * What: Unified logger interface that works on both server and client
 * Why: Single API for logging across the entire application
 * 
 * Server: Uses Pino with structured logging
 * Client: Uses browser console with PII sanitization and throttling
 */
export const logger = {
  /**
   * What: Log debug-level messages
   * Why: Detailed information for troubleshooting during development
   */
  debug(message: string, data?: any) {
    if (isServer && serverLogger) {
      serverLogger.debug(data, message)
    } else if (isDev && shouldLogOnClient(message)) {
      console.debug(`[DEBUG] ${message}`, data ? sanitizeForClient(data) : '')
    }
  },

  /**
   * What: Log info-level messages
   * Why: General informational messages about application flow
   */
  info(message: string, data?: any) {
    if (isServer && serverLogger) {
      serverLogger.info(data, message)
    } else if (shouldLogOnClient(message)) {
      console.info(`[INFO] ${message}`, data ? sanitizeForClient(data) : '')
    }
  },

  /**
   * What: Log warning-level messages
   * Why: Potentially harmful situations that should be investigated
   */
  warn(message: string, data?: any) {
    if (isServer && serverLogger) {
      serverLogger.warn(data, message)
    } else if (shouldLogOnClient(message)) {
      console.warn(`[WARN] ${message}`, data ? sanitizeForClient(data) : '')
    }
  },

  /**
   * What: Log error-level messages
   * Why: Error events that might still allow the application to continue running
   */
  error(message: string, data?: any) {
    if (isServer && serverLogger) {
      serverLogger.error(data, message)
    } else {
      // What: Always log errors, even with throttling
      // Why: Errors should never be silently dropped
      console.error(`[ERROR] ${message}`, data ? sanitizeForClient(data) : '')
    }
  },

  /**
   * What: Log fatal-level messages
   * Why: Very severe error events that will presumably lead to application abort
   */
  fatal(message: string, data?: any) {
    if (isServer && serverLogger) {
      serverLogger.fatal(data, message)
    } else {
      console.error(`[FATAL] ${message}`, data ? sanitizeForClient(data) : '')
    }
  },
}

/**
 * What: Export type for logger to enable proper TypeScript usage
 * Why: Provides type safety when importing and using the logger
 */
export type Logger = typeof logger
