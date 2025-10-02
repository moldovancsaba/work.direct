import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import SquareMapModel from '@/lib/models/SquareMap'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    await connectDB()
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const name = decodeURIComponent(segments[segments.length - 1])
    const map = await SquareMapModel.findOne({ name, isActive: true }).lean()
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { name: map.name, coords: map.coords, radius: map.radius, backgroundImageUrl: map.backgroundImageUrl || null } })
  } catch (err) {
    logger.error('GET /api/squaremaps/[name] error', { error: err })
    return NextResponse.json({ error: 'Failed to fetch map' }, { status: 500 })
  }
}