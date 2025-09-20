// app/api/admin/hexmaps/route.ts
// WHAT: Admin HexMap list and create endpoints.
// WHY: Enables predictive search and CRUD from admin UI (Map Creator, Quizz editor),
//      reusing the HexMap Mongoose model and MVP admin auth. Returns stable JSON
//      shapes expected by existing consumers.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import HexMapModel from '@/lib/models/HexMap'

function toPublic(doc: any) {
  if (!doc) return null
  return {
    id: String(doc._id),
    name: doc.name,
    tags: doc.tags || [],
    radius: doc.radius,
    hexCount: doc.hexCount,
    isActive: !!doc.isActive,
    backgroundImageUrl: doc.backgroundImageUrl,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin gate
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()

    const url = new URL(request.url)
    const search = (url.searchParams.get('search') || '').trim()
    const tag = (url.searchParams.get('tag') || '').trim().replace(/^#+/, '').toLowerCase()
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const q: any = {}
    if (search) {
      q.name = { $regex: search, $options: 'i' }
    }
    if (tag) {
      q.tags = tag
    }

    const [items, total] = await Promise.all([
      HexMapModel.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      HexMapModel.countDocuments(q)
    ])

    return NextResponse.json({
      data: {
        items: items.map(toPublic),
        total,
        page,
        pageSize: limit,
      }
    })
  } catch (error) {
    console.error('GET /api/admin/hexmaps error:', error)
    return NextResponse.json({ error: 'Failed to list hex maps' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin gate
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const name = String(body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const payload: any = {
      name,
      coords: Array.isArray(body?.coords) ? body.coords : [],
      radius: Number(body?.radius ?? 4),
      hexCount: Number(body?.hexCount ?? 0),
      tags: Array.isArray(body?.tags) ? body.tags : undefined,
      isActive: body?.isActive !== false,
      backgroundImageUrl: body?.backgroundImageUrl || undefined,
      fieldExtents: body?.fieldExtents || undefined,
      fieldMask: Array.isArray(body?.fieldMask) ? body.fieldMask : [],
      createdBy: 'admin', // MVP: static admin creator for traceability
    }

    const doc = await HexMapModel.create(payload)
    return NextResponse.json({ data: toPublic(doc) }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/admin/hexmaps error:', error)
    const message = error?.message || 'Failed to create hex map'
    const isValidation = /required|min|max|unique|Radius|Coordinates/i.test(message)
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 })
  }
}