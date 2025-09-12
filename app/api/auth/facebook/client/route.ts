import { NextRequest, NextResponse } from 'next/server'

// WHAT: Verify client-side FB accessToken server-side, then create httpOnly session cookie.
// WHY: Security — never store tokens client-side; standardize session across providers.
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json().catch(() => ({ accessToken: '' }))
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing accessToken' }, { status: 400 })
    }

    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    if (!appId || !appSecret) {
      return NextResponse.json({ success: false, error: 'Facebook app not configured' }, { status: 500 })
    }

    // 1) Verify token using debug_token endpoint
    const appToken = `${encodeURIComponent(appId)}|${encodeURIComponent(appSecret)}`
    const debugResp = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${appToken}`)
    const debugJson = await debugResp.json()
    if (!debugResp.ok || !debugJson?.data?.is_valid) {
      return NextResponse.json({ success: false, error: 'Invalid Facebook token' }, { status: 401 })
    }
    // Ensure token was issued for our app and is not expired
    if (String(debugJson.data.app_id) !== String(appId)) {
      return NextResponse.json({ success: false, error: 'Token app mismatch' }, { status: 401 })
    }
    if (debugJson.data.expires_at && Date.now() >= Number(debugJson.data.expires_at) * 1000) {
      return NextResponse.json({ success: false, error: 'Token expired' }, { status: 401 })
    }

    // 2) Fetch minimal profile (id, name, email)
    const userResp = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`)
    const user = await userResp.json()
    if (!userResp.ok || !user?.id) {
      return NextResponse.json({ success: false, error: 'Failed to fetch user profile' }, { status: 401 })
    }

    // 3) Create minimal session; never persist the token
    const session = {
      provider: 'facebook' as const,
      id: String(user.id),
      name: String(user.name || ''),
      email: user.email ? String(user.email) : undefined,
      iat: Date.now(),
    }
    const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64')

    const res = NextResponse.json({ success: true, user: { id: session.id, name: session.name, email: session.email } })
    res.cookies.set('user-session', payload, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Unexpected server error' }, { status: 500 })
  }
}