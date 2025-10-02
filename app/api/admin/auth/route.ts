// app/api/admin/auth/route.ts
// WHAT: Auth check endpoint for admin session.
// WHY: Single source of truth for client auth state; mirrors MessMass pattern.

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const user = await getAdminUser()
    if (user) {
      return NextResponse.json({ success: true, user })
    }
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  } catch (error) {
    logger.error('Admin auth check error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

