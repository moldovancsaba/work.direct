import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../lib/mongodb'
import SystemSettingsModel, { SystemSettings } from '../../lib/models/SystemSettings'
import { ApiResponse } from '../../types'
import { logger } from '../../lib/logger'

/**
 * Settings API Route Handler
 * 
 * This endpoint provides system settings management:
 * - GET: Retrieve current system settings
 * - PUT: Update system settings
 * - POST: Reset settings to defaults
 * 
 * Used by admin settings page for configuration management
 */

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Get current settings
    const settings = await (SystemSettingsModel as any).getCurrentSettings()
    
    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    })

  } catch (error) {
    logger.error('Get settings error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve settings',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse request body
    const updates = await request.json()
    
    // Validate required fields if provided
    const validationErrors: string[] = []
    
    if (updates.siteName !== undefined) {
      if (typeof updates.siteName !== 'string' || updates.siteName.trim().length === 0) {
        validationErrors.push('Site name must be a non-empty string')
      } else if (updates.siteName.length > 100) {
        validationErrors.push('Site name cannot exceed 100 characters')
      }
    }
    
    if (updates.contactEmail !== undefined) {
      const emailRegex = /^\S+@\S+\.\S+$/
      if (typeof updates.contactEmail !== 'string' || !emailRegex.test(updates.contactEmail)) {
        validationErrors.push('Contact email must be a valid email address')
      }
    }
    
    if (updates.defaultMaxAttempts !== undefined) {
      if (!Number.isInteger(updates.defaultMaxAttempts) || updates.defaultMaxAttempts < 1 || updates.defaultMaxAttempts > 10) {
        validationErrors.push('Default max attempts must be an integer between 1 and 10')
      }
    }
    
    if (updates.defaultMaxFlips !== undefined) {
      if (!Number.isInteger(updates.defaultMaxFlips) || updates.defaultMaxFlips < 1 || updates.defaultMaxFlips > 7) {
        validationErrors.push('Default max flips must be an integer between 1 and 7')
      }
    }
    
    if (updates.maxRequestsPerMinute !== undefined && updates.enableRateLimit) {
      if (!Number.isInteger(updates.maxRequestsPerMinute) || updates.maxRequestsPerMinute < 10 || updates.maxRequestsPerMinute > 1000) {
        validationErrors.push('Max requests per minute must be an integer between 10 and 1000')
      }
    }
    
    if (updates.sessionTimeout !== undefined) {
      if (!Number.isInteger(updates.sessionTimeout) || updates.sessionTimeout < 5 || updates.sessionTimeout > 120) {
        validationErrors.push('Session timeout must be an integer between 5 and 120 minutes')
      }
    }
    
    if (updates.primaryColor !== undefined) {
      const colorRegex = /^#[0-9A-F]{6}$/i
      if (typeof updates.primaryColor !== 'string' || !colorRegex.test(updates.primaryColor)) {
        validationErrors.push('Primary color must be a valid hex color (e.g., #FF0000)')
      }
    }
    
    if (updates.theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(updates.theme)) {
        validationErrors.push('Theme must be one of: light, dark, auto')
      }
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Settings validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid settings provided',
          details: validationErrors
        }
      }, { status: 400 })
    }
    
    // Get user identification (in a real app, this would come from authentication)
    const updatedBy = request.headers.get('x-user-id') || 'admin'
    
    // Update settings
    const updatedSettings = await (SystemSettingsModel as any).updateSettings(updates, updatedBy)
    
    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    logger.error('Update settings error', { error })
    
    // Handle validation errors from the model
    if (error instanceof Error && error.message.includes('Settings validation failed')) {
      return NextResponse.json({
        success: false,
        message: 'Settings validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update settings',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse request body to check for reset action
    const body = await request.json()
    
    if (body.action !== 'reset') {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Use action: "reset" to reset settings to defaults',
        error: {
          code: 'INVALID_ACTION',
          message: 'Only reset action is supported'
        }
      }, { status: 400 })
    }
    
    // Get user identification (in a real app, this would come from authentication)
    const updatedBy = request.headers.get('x-user-id') || 'admin'
    
    // Reset settings to defaults
    const defaultSettings = await (SystemSettingsModel as any).resetToDefaults(updatedBy)
    
    return NextResponse.json({
      success: true,
      data: defaultSettings,
      message: 'Settings reset to defaults successfully'
    })

  } catch (error) {
    logger.error('Reset settings error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to reset settings',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
      'Access-Control-Max-Age': '86400'
    }
  })
}
