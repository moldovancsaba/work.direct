// app/api/admin/squaremaps/[id]/route.ts
// WHAT: Admin endpoints to read/update/delete a single square map.
// WHY: Full CRUD support for the Square Creator, mirroring hex behavior for soft/hard delete patterns.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import SquareMapModel from '../../../../lib/models/SquareMap'
import { getAdminUser } from '../../../../lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })

    await connectDB()
    const { id } = await params
    const doc = await SquareMapModel.findById(id).lean()
    if (!doc) return NextResponse.json({ error: 'Square map not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    console.error('SquareMap GET error:', error)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch map' } }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })

    await connectDB()

    const body = await request.json()
    const updates: any = {}

    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (Array.isArray(body.coords)) {
      // WHAT: Validate integer coordinates before model validation
      // WHY: Provide clear error messaging for non-integer coordinates
      for (const c of body.coords) {
        if (!Number.isInteger(c.x) || !Number.isInteger(c.y)) {
          return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'All coordinates must be integers' } }, { status: 400 })
        }
      }
      updates.coords = body.coords
    }
    if (Array.isArray(body.tags)) updates.tags = Array.from(new Set(body.tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean)))
    if (typeof body.radius === 'number') updates.radius = Math.max(1, Math.min(24, Number(body.radius)))
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive
    if (typeof body.backgroundImageUrl === 'string') updates.backgroundImageUrl = String(body.backgroundImageUrl).trim()

    const { id } = await params

    // Unique name conflict check if name provided
    if (updates.name) {
      const conflict = await SquareMapModel.findOne({ name: updates.name, _id: { $ne: id } })
      if (conflict) {
        return NextResponse.json({ success: false, error: { code: 'DUPLICATE', message: 'A square map with this name already exists' } }, { status: 409 })
      }
    }

    const doc = await SquareMapModel.findById(id)
    if (!doc) return NextResponse.json({ error: 'Square map not found' }, { status: 404 })

    Object.assign(doc, updates)

    const saved = await doc.save()
    return NextResponse.json({ success: true, data: saved })
  } catch (error: any) {
    console.error('SquareMap PUT error:', error)
    const message = error?.message || 'Failed to update map'
    const isValidation = /duplicate|unique|required|valid/i.test(message)
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message } }, { status: isValidation ? 400 : 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    const { id } = await params

    if (hard) {
      // WHAT: Hard delete removes document completely from database
      // WHY: Match hex behavior for administrative cleanup when needed
      await SquareMapModel.findByIdAndDelete(id)
      return NextResponse.json({ success: true })
    }

    // WHAT: Soft delete by setting isActive = false
    // WHY: Preserve data for potential recovery while hiding from normal operations
    const doc = await SquareMapModel.findById(id)
    if (!doc) return NextResponse.json({ error: 'Square map not found' }, { status: 404 })

    doc.isActive = false
    await doc.save()
    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    console.error('SquareMap DELETE error:', error)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete map' } }, { status: 500 })
  }
}