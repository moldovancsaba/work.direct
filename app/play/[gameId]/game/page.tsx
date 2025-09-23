import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Game page (server component)
// What: Fetch game, resolve play config, render client Game.
// Why: Third step of standardized 4-page flow.
export default async function GamePage({
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

  const GameClient = (await import('./GameClientClean')).default
  return (
    <GameClient game={data.data} cfg={cfg} />
  )
}

