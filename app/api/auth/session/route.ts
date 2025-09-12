import { NextRequest, NextResponse } from 'next/server'

// WHAT: Simple user session inspection/creation endpoint for end-users (not admin)
// WHY: Enable cross-game persistence for 24h without requiring re-login (POC)

function decodeSession(cookieValue: string | undefined): any | null {
  if (!cookieValue) return null
  try {
    return JSON.parse(Buffer.from(cookieValue, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  // Return current user session if cookie exists
  const cookie = req.cookies.get('user-session')?.value
  const session = decodeSession(cookie)
  if (!session) {
    return NextResponse.json({ success: false, error: 'No session' }, { status: 401 })
  }
  return NextResponse.json({ success: true, user: { id: session.id, name: session.name, email: session.email, provider: session.provider } })
}

export async function POST(req: NextRequest) {
  // Create/refresh a simple end-user session (email/POC flow)
  try {
    const body = await req.json().catch(() => ({} as any))
    const name = (body.name ?? '').toString().trim()
    const email = body.email ? String(body.email) : undefined
    const provider = (body.provider ?? 'email').toString()
    let id = body.id ? String(body.id) : undefined
    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing name' }, { status: 400 })
    }
    if (!id) {
      id = email ? `email:${email}` : `u-${Date.now().toString(36)}`
    }

    const session = { provider, id, name, email, iat: Date.now() }
    const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64')

    const res = NextResponse.json({ success: true, user: { id, name, email, provider } })
    res.cookies.set('user-session', payload, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
    return res
  } catch {
    return NextResponse.json({ success: false, error: 'Unexpected server error' }, { status: 500 })
  }
}