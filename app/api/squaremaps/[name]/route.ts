// app/api/squaremaps/[name]/route.ts
// WHAT: Public endpoint to fetch a SquareMap by name.
// WHY: Games and other consumers need read-only access to published square maps without admin authentication.
//      Mirrors hex public API pattern for consistent surface area and security separation.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import SquareMapModel from '../../../lib/models/SquareMap'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB()
    const { name } = await params
    
    // WHAT: Only return active maps to public consumers
    // WHY: Soft-deleted or inactive maps should not be accessible via public API
    const map = await SquareMapModel.findOne({ name, isActive: true }).lean()
    if (!map) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Square map not found' } }, { status: 404 })
    
    // WHAT: Return minimal public-safe payload mirroring hex public shape
    // WHY: Exclude internal fields like createdBy, isActive while providing essential game data
    return NextResponse.json({ 
      success: true, 
      data: { 
        name: map.name, 
        coords: map.coords, 
        radius: map.radius, 
        cellCount: map.cellCount,
        backgroundImageUrl: (map as any).backgroundImageUrl
      } 
    })
  } catch (e) {
    console.error('Public square map fetch error:', e)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch map' } }, { status: 500 })
  }
}