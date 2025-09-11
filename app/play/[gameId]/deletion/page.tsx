import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

export default async function DeletionPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/games/${gameId}`, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok || !data?.success) return null

  const cfg = await resolvePlayConfig(data.data)
  const DeletionClientPlatform = (await import('./DeletionClientPlatform')).default
  return (
    <DeletionClientPlatform
      gameId={gameId}
      texts={(cfg as any).platform?.texts || {}}
      styles={(cfg as any).platform?.styles || {}}
    />
  )
}

