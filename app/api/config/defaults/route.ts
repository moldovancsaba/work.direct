import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import PlaymassDefaultsModel from '../../../lib/models/PlaymassDefaults'
import { ApiResponse, GameType } from '../../../types'

// GET /api/config/defaults?module=QUIZZZ
// Returns PlayMass defaults document for the requested module id
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const moduleId = (searchParams.get('module') || '').toUpperCase() as GameType
    if (!moduleId) {
      return NextResponse.json({ success: false, message: 'Missing module query param', error: { code: 'VALIDATION_ERROR', message: 'module is required' } }, { status: 400 })
    }

    await connectDB()
    const doc = await (PlaymassDefaultsModel as any).getByModule(moduleId)
    return NextResponse.json({ success: true, data: { moduleId, defaults: doc?.defaults || {} } })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch defaults', error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 })
  }
}
