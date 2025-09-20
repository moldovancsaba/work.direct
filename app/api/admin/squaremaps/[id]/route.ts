// app/api/admin/squaremaps/[id]/route.ts
// WHAT: Admin SquareMap read/update/soft-delete endpoints.
// WHY: Completes CRUD for SquareMap management used by admin UI.

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import SquareMapModel from '@/lib/models/SquareMap'

function toPublic(doc: any) {
  if (!doc) return null
  return {
    id: String(doc._id),
    name: doc.name,
    coords: doc.coords || [],
    radius: doc.radius,
    cellCount: doc.cellCount,
    tags: doc.tags || [],
    isActive: !!doc.isActive,
    backgroundImageUrl: doc.backgroundImageUrl,
    createdBy: doc.createdBy,
    fieldExtents: doc.fieldExtents || undefined,
    fieldMask: Array.isArray((doc as any).fieldMask) ? (doc as any).fieldMask : undefined,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    await connectDB()

    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const id = decodeURIComponent(parts[parts.length - 1] || '')

    const doc = await SquareMapModel.findById(id)
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: toPublic(doc) })
  } catch (error) {
    console.error('GET /api/admin/squaremaps/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch square map' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    await connectDB()

    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const id = decodeURIComponent(parts[parts.length - 1] || '')

    const body = await request.json()
    const patch: any = {}
    if (typeof body?.name === 'string') patch.name = String(body.name).trim()
    if (Array.isArray(body?.coords)) patch.coords = body.coords
    if (typeof body?.radius !== 'undefined') patch.radius = Number(body.radius)
    if (Array.isArray(body?.tags)) patch.tags = body.tags
    if (typeof body?.isActive === 'boolean') patch.isActive = body.isActive
    if (typeof body?.backgroundImageUrl === 'string') patch.backgroundImageUrl = body.backgroundImageUrl || undefined
    if (typeof body?.fieldExtents === 'object') patch.fieldExtents = body.fieldExtents
    if (Array.isArray(body?.fieldMask)) patch.fieldMask = body.fieldMask

    const updated = await SquareMapModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: toPublic(updated) })
  } catch (error: any) {
    console.error('PUT /api/admin/squaremaps/[id] error:', error)
    const message = error?.message || 'Failed to update square map'
    const isValidation = /required|min|max|unique|Radius|Coordinates|Chebyshev/i.test(message)
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    await connectDB()

    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const id = decodeURIComponent(parts[parts.length - 1] || '')

    const updated = await SquareMapModel.findByIdAndUpdate(id, { isActive: false }, { new: true })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: toPublic(updated) })
  } catch (error) {
    console.error('DELETE /api/admin/squaremaps/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete square map' }, { status: 500 })
  }
}