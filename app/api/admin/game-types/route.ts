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
    let items = await GameTypeModel.find({}).sort({ enabled: -1, order: 1, name: 1 }).lean()

    // Auto-seed defaults if empty (admin convenience, dev-safe)
    if (!items || items.length === 0) {
      const defaults = [
        { code: 'STARS_HEXA', name: 'Hexa', enabled: true, order: 10 },
        { code: 'PENALTY_SHOOTOUT', name: 'Penalty Shootout', enabled: true, order: 20 },
        { code: 'FIND_RED', name: 'Get Shorty (Find Red)', enabled: true, order: 30 },
        { code: 'WHEEL_OF_FORTUNE', name: 'Wheel of Fortune', enabled: true, order: 40 },
        { code: 'QUIZZ', name: 'Quizz (legacy)', enabled: true, order: 50 },
        { code: 'QUIZZZ', name: 'QUIZZZ (Board Quiz)', enabled: true, order: 60 }
      ]
      await GameTypeModel.insertMany(defaults)
      items = await GameTypeModel.find({}).sort({ enabled: -1, order: 1, name: 1 }).lean()
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

    // Normalize and upsert
    await Promise.all(types.map(async (t) => {
      const code = String(t.code || '').trim().toUpperCase()
      const name = String(t.name || '').trim()
      if (!code || !name) return
      await GameTypeModel.updateOne(
        { code },
        { $set: { name, enabled: t.enabled !== false, order: Number.isFinite(t.order) ? Number(t.order) : 0 } },
        { upsert: true }
      )
    }))

    const items = await GameTypeModel.find({}).sort({ enabled: -1, order: 1, name: 1 }).lean()
    return NextResponse.json({ success: true, data: { items } })
  } catch (err) {
    console.error('POST /api/admin/game-types error', err)
    return NextResponse.json({ error: 'Failed to upsert game types' }, { status: 500 })
  }
}