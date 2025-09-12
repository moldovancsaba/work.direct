import { NextResponse } from 'next/server'

// LEGACY: OAuth redirect flow retained for rollback compatibility only.
// UI now uses Facebook JS SDK popup and POST /api/auth/facebook/client for verification.
export async function GET() {
  const appId = process.env.FACEBOOK_APP_ID
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (!appId) {
    return NextResponse.json({ success: false, message: 'FACEBOOK_APP_ID not configured' }, { status: 500 })
  }
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`
  // Minimal scopes for name+email
  const scope = 'public_profile,email'
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)

  // Store state cookie (httpOnly)
  const res = NextResponse.redirect(authUrl.toString())
  res.cookies.set('fb-oauth-state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  })
  return res
}
