import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Landing page (server component)
// What: Initial step before Welcome; shows title, image, and button to Welcome.
export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { gameId } = await params
  const s = await searchParams

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/games/${gameId}`, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok || !data?.success) {
    return null
  }

  const cfg = await resolvePlayConfig(data.data, {
    ref: typeof s?.ref === 'string' ? s.ref : undefined,
  })

  const LandingClientPlatform = (await import('./LandingClientPlatform')).default
  return (
    <LandingClientPlatform
      gameId={gameId}
      texts={(cfg as any).platform?.texts || {}}
      styles={(cfg as any).platform?.styles || {}}
      refCode={cfg.meta.ref}
    />
  )
}