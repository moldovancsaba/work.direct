// app/api/admin/hexmaps/route.ts
// WHAT: Admin endpoints to list and create hex maps.
// WHY: Provide CRUD backend for the Hexa Creator UI.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import HexMapModel from '../../../lib/models/HexMap'
import { getAdminUser } from '../../../lib/auth'
import type { ApiResponse } from '../../../types'

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('search') || '').trim()
    const tag = (searchParams.get('tag') || '').trim().toLowerCase()
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const filter: any = {}
    if (!includeInactive) filter.isActive = true
    if (tag) filter.tags = tag

    if (query.length >= 2) {
      filter.$text = { $search: query }
    } else if (query.length === 1) {
      filter.name = { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    }

    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      HexMapModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      HexMapModel.countDocuments(filter)
    ])

    const payload: ApiResponse = {
      success: true,
      data: { items, page, limit, total, hasMore: skip + items.length < total }
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('HexMaps GET error:', error)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch maps' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })

    await connectDB()

    const body = await request.json()
    const name: string = (body.name || '').trim()
    const coords: Array<{ q: number; r: number }> = Array.isArray(body.coords) ? body.coords : []
    const radius: number = Number.isFinite(body.radius) ? Math.max(1, Math.min(24, Number(body.radius))) : 4
    const rawTags: string[] = Array.isArray(body.tags) ? body.tags : []
    const tags = Array.from(new Set(rawTags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)))

    if (!name) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Name is required' } }, { status: 400 })
    }

    // Unique name check (friendly 409 first)
    const existing = await HexMapModel.findOne({ name })
    if (existing) {
      return NextResponse.json({ success: false, error: { code: 'DUPLICATE', message: 'A map with this name already exists' } }, { status: 409 })
    }

    const doc = new HexMapModel({ name, coords, radius, tags, createdBy: user.id || 'admin' })
    const saved = await doc.save()

    return NextResponse.json({ success: true, data: saved }, { status: 201 })
  } catch (error: any) {
    console.error('HexMaps POST error:', error)
    const message = error?.message || 'Failed to create map'
    const isValidation = /duplicate|unique|required|valid/i.test(message)
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message } }, { status: isValidation ? 400 : 500 })
  }
}
