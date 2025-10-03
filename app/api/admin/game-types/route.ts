import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import GameTypeModel from '../../../lib/models/GameTypeDef'
import { getAdminUser } from '../../../lib/auth'
import { logger } from '../../../lib/logger'

// GET: list all available game types (admin only)
export async function GET() {
  try {
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    // WHAT: Purge any non-QUIZZZ and non-WHACKPOP entries to enforce MVP Factory game type policy
    // WHY: Maintain strict control over available game types during MVP phase
    await GameTypeModel.deleteMany({ code: { $nin: ['QUIZZZ', 'WHACKPOP'] } })

    let items = await GameTypeModel.find({ code: { $in: ['QUIZZZ', 'WHACKPOP'] } }).sort({ order: 1, name: 1 }).lean()

    // WHAT: Auto-seed QUIZZZ and WHACKPOP if empty
    // WHY: Ensure both game types are always available in admin selector
    if (!items || items.length === 0) {
      await GameTypeModel.insertMany([
        { code: 'QUIZZZ', name: 'QUIZZZ (Board Quiz)', enabled: true, order: 1 },
        { code: 'WHACKPOP', name: 'WHACKPOP (Whack-a-Mole)', enabled: true, order: 2 }
      ])
      items = await GameTypeModel.find({ code: { $in: ['QUIZZZ', 'WHACKPOP'] } }).sort({ order: 1, name: 1 }).lean()
    }

    return NextResponse.json({ success: true, data: { items } })
  } catch (err) {
    logger.error('GET /api/admin/game-types error', { error: err })
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

    // WHAT: Enforce QUIZZZ and WHACKPOP policy: ignore any other codes and purge others
    // WHY: Maintain controlled game type expansion during MVP phase
    await GameTypeModel.deleteMany({ code: { $nin: ['QUIZZZ', 'WHACKPOP'] } })

    // WHAT: Process QUIZZZ type upsert
    // WHY: Allow admin to configure QUIZZZ game type settings
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

    // WHAT: Process WHACKPOP type upsert
    // WHY: Enable WHACKPOP game type creation and configuration
    const whackpop = types.find(t => String(t.code || '').trim().toUpperCase() === 'WHACKPOP')
    if (whackpop) {
      const code = 'WHACKPOP'
      const name = String(whackpop.name || 'WHACKPOP (Whack-a-Mole)').trim()
      const enabled = whackpop.enabled !== false
      const order = Number.isFinite(whackpop.order as any) ? Number(whackpop.order) : 2
      await GameTypeModel.updateOne(
        { code },
        { $set: { name, enabled, order } },
        { upsert: true }
      )
    } else {
      // Ensure WHACKPOP exists even if not provided in payload
      await GameTypeModel.updateOne(
        { code: 'WHACKPOP' },
        { $set: { name: 'WHACKPOP (Whack-a-Mole)', enabled: true, order: 2 } },
        { upsert: true }
      )
    }

    const items = await GameTypeModel.find({ code: { $in: ['QUIZZZ', 'WHACKPOP'] } }).sort({ order: 1, name: 1 }).lean()
    return NextResponse.json({ success: true, data: { items } })
  } catch (err) {
    logger.error('POST /api/admin/game-types error', { error: err })
    return NextResponse.json({ error: 'Failed to upsert game types' }, { status: 500 })
  }
}
