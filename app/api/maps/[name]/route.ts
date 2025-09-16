import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import HexMapModel from '../../../lib/models/HexMap'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB()
    const { name } = await params
    const map = await HexMapModel.findOne({ name, isActive: true }).lean()
    if (!map) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Map not found' } }, { status: 404 })
    return NextResponse.json({ success: true, data: { name: map.name, coords: map.coords, radius: map.radius, hexCount: map.hexCount, backgroundImageUrl: (map as any).backgroundImageUrl } })
  } catch (e) {
    console.error('Public map fetch error:', e)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch map' } }, { status: 500 })
  }
}
