import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../lib/mongodb'
import SystemSettingsModel, { SystemSettings } from '../../lib/models/SystemSettings'
import { ApiResponse } from '../../types'
import { logger } from '../../lib/logger'
import { validateBody } from '../../lib/validation/middleware'
import { settingsUpdateSchema } from '../../lib/validation/schemas'

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
    
    // What: Validate settings update with Zod schema and XSS protection
    // Why: Replaces 70+ lines of manual validation with schema-based validation
    const validated = await validateBody(request, settingsUpdateSchema, true)
    if (!validated.success) {
      return validated.error as NextResponse<ApiResponse>
    }
    
    const updates = validated.data
    
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
