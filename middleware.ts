import { NextRequest, NextResponse } from 'next/server'

// Middleware to support path-style referral links
// Example: /play/{gameId}/{ref} → /play/{gameId}/welcome?ref={ref}
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Match /play/<gameId>/<ref> exactly (only two segments after /play)
  const match = pathname.match(/^\/play\/([^\/]+)\/([^\/]+)$/)
  if (match) {
    const gameId = match[1]
    const second = match[2]
    const reserved = new Set(['welcome', 'rules', 'game', 'result'])
    // Only treat as referral when the second segment is NOT one of our static steps
    if (!reserved.has(second)) {
      url.pathname = `/play/${gameId}/welcome`
      url.searchParams.set('ref', second)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/play/:path*']
}

