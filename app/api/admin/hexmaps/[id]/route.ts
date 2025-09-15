// app/api/admin/hexmaps/[id]/route.ts
// WHAT: Admin endpoints to read/update/delete a single hex map.
// WHY: Full CRUD support for the Hexa Creator, with soft delete by default.

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import HexMapModel from '../../../../lib/models/HexMap'
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
    const doc = await HexMapModel.findById(id).lean()
    if (!doc) return NextResponse.json({ error: 'Map not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    console.error('HexMap GET error:', error)
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
    if (Array.isArray(body.coords)) updates.coords = body.coords
    if (Array.isArray(body.tags)) updates.tags = Array.from(new Set(body.tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean)))
    if (typeof body.radius === 'number') updates.radius = Math.max(1, Math.min(24, Number(body.radius)))
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive

    const { id } = await params

    // Unique name conflict check if name provided
    if (updates.name) {
      const conflict = await HexMapModel.findOne({ name: updates.name, _id: { $ne: id } })
      if (conflict) {
        return NextResponse.json({ success: false, error: { code: 'DUPLICATE', message: 'A map with this name already exists' } }, { status: 409 })
      }
    }

    const doc = await HexMapModel.findById(id)
    if (!doc) return NextResponse.json({ error: 'Map not found' }, { status: 404 })

    Object.assign(doc, updates)

    const saved = await doc.save()
    return NextResponse.json({ success: true, data: saved })
  } catch (error: any) {
    console.error('HexMap PUT error:', error)
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
      await HexMapModel.findByIdAndDelete(id)
      return NextResponse.json({ success: true })
    }

    const doc = await HexMapModel.findById(id)
    if (!doc) return NextResponse.json({ error: 'Map not found' }, { status: 404 })

    doc.isActive = false
    await doc.save()
    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    console.error('HexMap DELETE error:', error)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete map' } }, { status: 500 })
  }
}
