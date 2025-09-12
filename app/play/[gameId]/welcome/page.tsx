import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Welcome page (server component)
// What: Fetch game, resolve play config, render client Welcome.
// Why: Establish the first step of the standardized 4-page flow.
export default async function WelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { gameId } = await params
  const s = await searchParams

  // If someone arrives at /welcome?ref=landing (legacy/misconfigured links),
  // redirect to the proper landing step and do NOT treat 'landing' as a referral code.
  if (typeof s?.ref === 'string' && s.ref === 'landing') {
    redirect(`/play/${gameId}/landing`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/games/${gameId}`, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok || !data?.success) {
    return null
  }

  const cfg = await resolvePlayConfig(data.data, {
    ref: typeof s?.ref === 'string' ? s.ref : undefined,
  })

  const WelcomeClientPlatform = (await import('./WelcomeClientPlatform')).default
  return (
    <WelcomeClientPlatform
      gameId={gameId}
      texts={(cfg as any).platform?.texts || {}}
      styles={(cfg as any).platform?.styles || {}}
      refCode={cfg.meta.ref}
    />
  )
}

