import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

export default async function DeletionPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let texts: any = {}
  let styles: any = {}
  try {
    const res = await fetch(`${baseUrl}/api/games/${gameId}`, { cache: 'no-store' })
    const data = await res.json()
    if (res.ok && data?.success) {
      const cfg = await resolvePlayConfig(data.data)
      texts = (cfg as any).platform?.texts || {}
      styles = (cfg as any).platform?.styles || {}
    }
  } catch {}

  const DeletionClientPlatform = (await import('./DeletionClientPlatform')).default
  return (
    <DeletionClientPlatform
      gameId={gameId}
      texts={texts}
      styles={styles}
    />
  )
}

