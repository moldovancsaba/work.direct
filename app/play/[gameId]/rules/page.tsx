import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Rules page (server component)
// What: Fetch game, resolve play config, render client Rules.
// Why: Second step of standardized 4-page flow.
export default async function RulesPage({
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

  const RulesClientPlatform = (await import('./RulesClientPlatform')).default
  return (
    <RulesClientPlatform
      gameId={gameId}
      texts={(cfg as any).platform?.texts || {}}
      styles={(cfg as any).platform?.styles || {}}
      refCode={cfg.meta.ref}
    />
  )
}

