// app/api/squaremaps/random/route.ts
// WHAT: Public endpoint to fetch a random active SquareMap (optionally filtered by tag).
// WHY: Games can request random square maps for dynamic level generation, mirroring hex random API pattern.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import SquareMapModel from '../../../lib/models/SquareMap'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const rawTag = (searchParams.get('tag') || 'water').trim().toLowerCase()
    const tag = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag

    // WHAT: Filter only active maps; if tag provided, require it in tags array
    // WHY: Public API should only serve published maps; tag filtering enables game-specific requests
    const match: any = { isActive: true }
    if (tag) match.tags = tag

    // WHAT: Use MongoDB aggregation $sample for efficient random selection
    // WHY: Avoids loading all documents into memory; provides true randomization at database level
    const docs = await SquareMapModel.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
      { $project: { _id: 1, name: 1, coords: 1, radius: 1, cellCount: 1, tags: 1, isActive: 1, backgroundImageUrl: 1, createdAt: 1, updatedAt: 1 } }
    ])

    if (!docs || docs.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `No active square maps found for tag: ${tag}` } }, { status: 404 })
    }

    // WHAT: Return minimal public-safe payload consistent with [name] endpoint
    // WHY: Maintain API consistency while excluding internal admin fields
    const map = docs[0]
    return NextResponse.json({ 
      success: true, 
      data: { 
        name: map.name, 
        coords: map.coords, 
        radius: map.radius, 
        cellCount: map.cellCount,
        backgroundImageUrl: map.backgroundImageUrl
      } 
    })
  } catch (err: any) {
    console.error('squaremaps/random GET error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Internal error' } }, { status: 500 })
  }
}