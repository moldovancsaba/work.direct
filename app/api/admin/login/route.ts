// app/api/admin/login/route.ts
// WHAT: Minimal admin login/logout API for PlayMass.
// WHY: Mirrors MessMass simple password auth for MVP. Sets an httpOnly cookie with
//      base64-encoded JSON token; intended to be replaced with signed tokens in future.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Brute-force mitigation (constant minimal delay on failure)
    if (password !== ADMIN_PASSWORD) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Generate session token and payload
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const tokenData = {
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      userId: 'admin',
      role: 'super-admin'
    }

    const encodedToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    // Set secure httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('admin-session', encodedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // seconds
      path: '/'
    })

    return NextResponse.json({ success: true, token: encodedToken, message: 'Login successful' })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}

