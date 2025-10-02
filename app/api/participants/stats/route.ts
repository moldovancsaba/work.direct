import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import ParticipantModel from '../../../lib/models/Participant'
import { ApiResponse } from '../../../types'
import { logger } from '../../../lib/logger'

/**
 * Participants Stats API Route Handler
 * 
 * GET: Retrieve participant statistics for admin dashboard
 */

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Get statistics using the static method from the model
    const stats = await (ParticipantModel as any).getParticipationStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Participant statistics retrieved successfully'
    })
    
  } catch (error) {
    logger.error('Get participant stats error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve participant statistics',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
