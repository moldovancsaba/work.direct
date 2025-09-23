import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import GameTypeModel from '../../../lib/models/GameTypeDef'
import { getAdminUser } from '../../../lib/auth'

// GET: list all available game types (admin only)
export async function GET() {
  try {
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    // Purge any non-QUIZZZ entries to enforce single game type policy
    await GameTypeModel.deleteMany({ code: { $ne: 'QUIZZZ' } })

    let items = await GameTypeModel.find({ code: 'QUIZZZ' }).sort({ order: 1, name: 1 }).lean()

    // Auto-seed only QUIZZZ if empty
    if (!items || items.length === 0) {
      await GameTypeModel.insertMany([
        { code: 'QUIZZZ', name: 'QUIZZZ (Board Quiz)', enabled: true, order: 1 }
      ])
      items = await GameTypeModel.find({ code: 'QUIZZZ' }).sort({ order: 1, name: 1 }).lean()
    }

    return NextResponse.json({ success: true, data: { items } })
  } catch (err) {
    console.error('GET /api/admin/game-types error', err)
    return NextResponse.json({ error: 'Failed to fetch game types' }, { status: 500 })
  }
}

// POST: upsert one or more game types (admin only)
// Body: { types: Array<{ code: string; name: string; enabled?: boolean; order?: number }> }
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json().catch(() => ({}))
    const types: Array<{ code: string; name: string; enabled?: boolean; order?: number }> = Array.isArray(body?.types) ? body.types : []

    if (!Array.isArray(types) || types.length === 0) {
      return NextResponse.json({ error: 'Nothing to upsert' }, { status: 400 })
    }

    // Enforce QUIZZZ-only policy: ignore any non-QUIZZZ codes and purge others
    await GameTypeModel.deleteMany({ code: { $ne: 'QUIZZZ' } })

    const quizzz = types.find(t => String(t.code || '').trim().toUpperCase() === 'QUIZZZ')
    if (quizzz) {
      const code = 'QUIZZZ'
      const name = String(quizzz.name || 'QUIZZZ (Board Quiz)').trim()
      const enabled = quizzz.enabled !== false
      const order = Number.isFinite(quizzz.order as any) ? Number(quizzz.order) : 1
      await GameTypeModel.updateOne(
        { code },
        { $set: { name, enabled, order } },
        { upsert: true }
      )
    } else {
      // Ensure QUIZZZ exists even if not provided in payload
      await GameTypeModel.updateOne(
        { code: 'QUIZZZ' },
        { $set: { name: 'QUIZZZ (Board Quiz)', enabled: true, order: 1 } },
        { upsert: true }
      )
    }

    const items = await GameTypeModel.find({ code: 'QUIZZZ' }).sort({ order: 1, name: 1 }).lean()
    return NextResponse.json({ success: true, data: { items } })
  } catch (err) {
    console.error('POST /api/admin/game-types error', err)
    return NextResponse.json({ error: 'Failed to upsert game types' }, { status: 500 })
  }
}
