import { redirect } from 'next/navigation'

// Referral path handler
// What: Accept /play/[gameId]/[ref] links and redirect to the standardized flow entry.
// Why: Support path-style referral URLs (…/play/{gameId}/{uuid}) while keeping a single
//       source of truth for the flow at /play/[gameId]/welcome?ref=.
export default async function PlayReferralRedirect({
  params,
}: {
  params: Promise<{ gameId: string; ref: string }>
}) {
  const { gameId, ref } = await params
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : ''
  redirect(`/play/${gameId}/welcome${q}`)
}

