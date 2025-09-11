import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state') || ''
  const storedState = req.cookies.get('fb-oauth-state')?.value || ''

  if (!code || !returnedState || returnedState !== storedState) {
    return NextResponse.redirect('/')
  }

  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`

  if (!appId || !appSecret) {
    return NextResponse.redirect('/')
  }

  try {
    const tokenResp = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`)
    const tokenJson = await tokenResp.json()
    if (!tokenResp.ok || !tokenJson?.access_token) {
      return NextResponse.redirect('/')
    }
    const accessToken = tokenJson.access_token as string

    const userResp = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`)
    const user = await userResp.json()
    if (!userResp.ok || !user?.id) {
      return NextResponse.redirect('/')
    }

    // Build session (do not expose access token; store only minimal info)
    const session = {
      provider: 'facebook' as const,
      id: String(user.id),
      name: String(user.name || ''),
      email: user.email ? String(user.email) : undefined,
      iat: Date.now(),
    }
    const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64')

    const res = NextResponse.redirect('/')
    // Clear state cookie
    res.cookies.set('fb-oauth-state', '', { httpOnly: true, maxAge: 0, path: '/' })
    // Set user-session cookie
    res.cookies.set('user-session', payload, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (e) {
    return NextResponse.redirect('/')
  }
}
