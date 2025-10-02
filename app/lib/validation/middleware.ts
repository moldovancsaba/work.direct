/**
 * Validation Middleware
 * 
 * What: Central validation helpers for API routes with structured error handling
 * Why: Provides consistent validation across all endpoints, returns user-friendly errors
 * 
 * Usage:
 *   import { validateBody, validateQuery, sanitize } from '@/app/lib/validation/middleware'
 *   
 *   const validated = await validateBody(request, participantCreateSchema)
 *   if (!validated.success) {
 *     return validated.error // Returns NextResponse with 400 and error details
 *   }
 *   const data = validated.data // Validated and typed data
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import xss from 'xss'
import { logger } from '../logger'

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * What: Success result type for validation
 * Why: Type-safe validation results with discriminated union
 */
export type ValidationSuccess<T> = {
  success: true
  data: T
}

/**
 * What: Error result type for validation
 * Why: Returns formatted error response ready to send to client
 */
export type ValidationError = {
  success: false
  error: NextResponse
}

/**
 * What: Combined validation result type
 * Why: Enables type-safe checking of validation results
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError

// ============================================================================
// XSS SANITIZATION
// ============================================================================

/**
 * What: XSS sanitization configuration
 * Why: Defines what HTML/attributes are allowed (default: none)
 */
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
}

/**
 * What: Sanitize a single string value to prevent XSS
 * Why: Removes dangerous HTML/JavaScript from user input
 * 
 * @param value - String to sanitize
 * @returns Sanitized string safe for storage/display
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value
  return xss(value, xssOptions).trim()
}

/**
 * What: Recursively sanitize all string values in an object
 * Why: Ensures all user-provided data is XSS-safe before processing
 * 
 * @param data - Object to sanitize
 * @returns Object with all strings sanitized
 */
export function sanitizeObject<T>(data: T): T {
  if (data === null || data === undefined) return data
  
  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeObject(item)) as unknown as T
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeObject((data as any)[key])
      }
    }
    return sanitized
  }
  
  return data
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * What: Format Zod validation errors into user-friendly message
 * Why: Converts technical Zod errors into clear API error responses
 * 
 * @param error - Zod validation error
 * @returns Object with formatted error messages
 */
function formatZodError(error: ZodError) {
  const formattedErrors: Record<string, string> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    formattedErrors[path || 'root'] = err.message
  })
  
  return {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    errors: formattedErrors,
  }
}

/**
 * What: Validate request body against a Zod schema
 * Why: Provides type-safe validation for POST/PUT/PATCH request bodies
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @param sanitize - Whether to sanitize strings (default: true)
 * @returns ValidationResult with typed data or error response
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  shouldSanitize: boolean = true
): Promise<ValidationResult<T>> {
  try {
    // What: Parse JSON body from request
    // Why: Next.js App Router requires manual JSON parsing
    const body = await request.json()
    
    // What: Sanitize input before validation
    // Why: Prevents XSS attacks by removing dangerous content
    const sanitized = shouldSanitize ? sanitizeObject(body) : body
    
    // What: Validate against schema
    // Why: Ensures data matches expected structure and types
    const result = schema.safeParse(sanitized)
    
    if (!result.success) {
      // What: Log validation failure with structured data
      // Why: Helps debug validation issues in production
      logger.warn('Request body validation failed', {
        path: request.nextUrl.pathname,
        errors: result.error.issues,
      })
      
      // What: Return formatted error response
      // Why: Provides clear feedback to client about what's wrong
      return {
        success: false,
        error: NextResponse.json(formatZodError(result.error), { status: 400 }),
      }
    }
    
    // What: Return validated data
    // Why: Type-safe data ready for use in endpoint logic
    return {
      success: true,
      data: result.data,
    }
    
  } catch (error) {
    // What: Handle JSON parse errors
    // Why: Invalid JSON should return 400, not 500
    logger.error('Failed to parse request body', {
      path: request.nextUrl.pathname,
      error,
    })
    
    return {
      success: false,
      error: NextResponse.json(
        {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
        },
        { status: 400 }
      ),
    }
  }
}

/**
 * What: Validate URL query parameters against a Zod schema
 * Why: Provides type-safe validation for GET request query strings
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns ValidationResult with typed data or error response
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    // What: Extract query parameters from URL
    // Why: Next.js provides searchParams on URL object
    const searchParams = request.nextUrl.searchParams
    const query: Record<string, string | string[]> = {}
    
    // What: Convert URLSearchParams to plain object
    // Why: Zod schemas expect plain objects, not URLSearchParams
    searchParams.forEach((value, key) => {
      if (query[key]) {
        // Handle multiple values for same key
        if (Array.isArray(query[key])) {
          (query[key] as string[]).push(value)
        } else {
          query[key] = [query[key] as string, value]
        }
      } else {
        query[key] = value
      }
    })
    
    // What: Validate against schema
    // Why: Ensures query params match expected structure
    const result = schema.safeParse(query)
    
    if (!result.success) {
      logger.warn('Query parameter validation failed', {
        path: request.nextUrl.pathname,
        query,
        errors: result.error.issues,
      })
      
      return {
        success: false,
        error: NextResponse.json(formatZodError(result.error), { status: 400 }),
      }
    }
    
    return {
      success: true,
      data: result.data,
    }
    
  } catch (error) {
    logger.error('Failed to validate query parameters', {
      path: request.nextUrl.pathname,
      error,
    })
    
    return {
      success: false,
      error: NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
        },
        { status: 400 }
      ),
    }
  }
}

/**
 * What: Validate path parameters (like /api/games/[id])
 * Why: Ensures URL path parameters are valid before use
 * 
 * @param params - Path parameters object
 * @param schema - Zod schema to validate against
 * @returns ValidationResult with typed data or error response
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.safeParse(params)
    
    if (!result.success) {
      logger.warn('Path parameter validation failed', {
        params,
        errors: result.error.issues,
      })
      
      return {
        success: false,
        error: NextResponse.json(formatZodError(result.error), { status: 400 }),
      }
    }
    
    return {
      success: true,
      data: result.data,
    }
    
  } catch (error) {
    logger.error('Failed to validate path parameters', {
      params,
      error,
    })
    
    return {
      success: false,
      error: NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid path parameters',
        },
        { status: 400 }
      ),
    }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * What: Export sanitization functions for direct use
 * Why: Allows manual sanitization when needed
 */
export const sanitize = {
  string: sanitizeString,
  object: sanitizeObject,
}
