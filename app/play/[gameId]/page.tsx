import { redirect } from 'next/navigation'

// Backward-compatibility redirector for standardized 4-step flow
// What: Ensure /play/[gameId] starts at the Welcome step of the unified flow.
// Why: Single authoritative entry point and consistent UX across modules.
export default async function PlayEntryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { gameId } = await params
  const s = await searchParams
  const ref = typeof s?.ref === 'string' ? s.ref : undefined
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : ''
  redirect(`/play/${gameId}/welcome${q}`)
}
