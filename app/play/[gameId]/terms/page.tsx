import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

export default async function TermsPage({
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

  const TermsClientPlatform = (await import('./TermsClientPlatform')).default
  return (
    <TermsClientPlatform
      gameId={gameId}
      texts={texts}
      styles={styles}
    />
  )
}

