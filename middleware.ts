import { NextResponse, NextRequest } from 'next/server'

// Global middleware to enforce correct Play flow entry
// - /play/:gameId => /play/:gameId/landing (drop ?ref if reserved word like 'landing')
// - /play/:gameId/welcome?ref=landing => /play/:gameId/landing
export function middleware(req: NextRequest) {
  const { pathname, searchParams, origin } = req.nextUrl

  // Only handle /play/* paths
  if (!pathname.startsWith('/play/')) return NextResponse.next()

  const parts = pathname.split('/').filter(Boolean) // ['', 'play', ':id', maybe step]
  if (parts.length < 2) return NextResponse.next()

  const gameId = parts[1]
  const step = parts[2] // may be undefined

  const reserved = new Set(['landing','welcome','rules','game','result','terms','privacy','deletion'])

  // Case A: /play/:gameId (no step) => redirect to landing
  if (parts.length === 2) {
    const ref = searchParams.get('ref')
    const preserveRef = ref && !reserved.has(ref)
    const url = new URL(`${origin}/play/${gameId}/landing`)
    if (preserveRef) url.searchParams.set('ref', ref as string)
    return NextResponse.redirect(url)
  }

  // Case B: /play/:gameId/welcome => redirect to landing (always)
  if (step === 'welcome') {
    const url = new URL(`${origin}/play/${gameId}/landing`)
    return NextResponse.redirect(url)
  }

  // Case C: /play/:gameId/rules => redirect to game (always)
  if (step === 'rules') {
    const url = new URL(`${origin}/play/${gameId}/game`)
    return NextResponse.redirect(url)
  }

  // Otherwise allow request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ['/play/:path*']
}

