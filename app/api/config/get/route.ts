import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '../../../types'
import { resolveConfig } from '../../../modules/core/config'

// Purpose: Return the effective configuration for a given gameId.
// Why: Allows admin UI and play pages to preview or consume merged config.

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json({
        success: false,
        message: 'Missing gameId query parameter',
        error: { code: 'VALIDATION_ERROR', message: 'gameId is required' }
      }, { status: 400 })
    }

    const { merged, layers } = await resolveConfig(gameId)

    return NextResponse.json({
      success: true,
      data: { config: merged, layers },
      message: 'Configuration resolved successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to resolve configuration',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}
