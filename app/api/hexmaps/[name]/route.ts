import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import HexMapModel from '@/lib/models/HexMap'

export async function GET(request: Request) {
  try {
    await connectDB()
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const name = decodeURIComponent(segments[segments.length - 1])
    const map = await HexMapModel.findOne({ name, isActive: true }).lean()
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { name: map.name, coords: map.coords, radius: map.radius, backgroundImageUrl: map.backgroundImageUrl || null } })
  } catch (err) {
    console.error('GET /api/hexmaps/[name] error', err)
    return NextResponse.json({ error: 'Failed to fetch map' }, { status: 500 })
  }
}