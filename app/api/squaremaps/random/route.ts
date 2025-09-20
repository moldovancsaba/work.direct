import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import SquareMapModel from '@/lib/models/SquareMap'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const url = new URL(request.url)
    const tag = (url.searchParams.get('tag') || '').trim().toLowerCase()
    const q: any = { isActive: true }
    if (tag) q.tags = tag
    const count = await SquareMapModel.countDocuments(q)
    if (!count) return NextResponse.json({ error: 'No maps available' }, { status: 404 })
    const skip = Math.floor(Math.random() * count)
    const map = await SquareMapModel.findOne(q).skip(skip).lean()
    if (!map) return NextResponse.json({ error: 'No maps available' }, { status: 404 })
    return NextResponse.json({ success: true, data: { name: map.name, coords: map.coords, radius: map.radius, backgroundImageUrl: map.backgroundImageUrl || null } })
  } catch (err) {
    console.error('GET /api/squaremaps/random error', err)
    return NextResponse.json({ error: 'Failed to fetch random map' }, { status: 500 })
  }
}