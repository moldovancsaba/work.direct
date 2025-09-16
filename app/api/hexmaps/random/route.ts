// app/api/hexmaps/random/route.ts
// WHAT: Public endpoint to fetch a random active HexMap (optionally filtered by tag).
// WHY: Stars Hexa uses this to pick a random #water map at the start of a play session.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import HexMapModel from '../../../lib/models/HexMap'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const rawTag = (searchParams.get('tag') || 'water').trim().toLowerCase()
    const tag = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag

    // Filter only active maps; if tag provided, require it in tags
    const match: any = { isActive: true }
    if (tag) match.tags = tag

    // Use $sample for an efficient random pick
    const docs = await HexMapModel.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
      { $project: { _id: 1, name: 1, coords: 1, radius: 1, tags: 1, isActive: 1, backgroundImageUrl: 1, createdAt: 1, updatedAt: 1 } }
    ])

    if (!docs || docs.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: `No active maps found for tag: ${tag}` } }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: docs[0] })
  } catch (err: any) {
    console.error('hexmaps/random GET error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Internal error' } }, { status: 500 })
  }
}