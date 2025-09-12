import { redirect } from 'next/navigation'

// Path redirect handler
// What: Accept /play/[gameId]/[ref] links. If the path segment is a known step (landing/welcome/rules/game/result/terms/privacy/deletion),
//       route directly to that step. Otherwise treat it as a referral code and redirect to /welcome?ref=...
export default async function PlayPathRedirect({
  params,
}: {
  params: Promise<{ gameId: string; ref: string }>
}) {
  const { gameId, ref } = await params
  const reserved = new Set(['landing','welcome','rules','game','result','terms','privacy','deletion'])
  if (reserved.has(ref)) {
    redirect(`/play/${gameId}/${ref}`)
  }
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : ''
  redirect(`/play/${gameId}/welcome${q}`)
}

