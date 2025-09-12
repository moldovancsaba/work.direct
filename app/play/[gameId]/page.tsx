import { redirect } from 'next/navigation'

// Entry redirector for standardized 5-step flow (Landing → Welcome → Rules → Game → Result)
// What: Ensure /play/[gameId] starts at the Landing step of the unified flow.
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
  const reserved = new Set(['landing','welcome','rules','game','result','terms','privacy','deletion'])
  const preserveRef = ref && !reserved.has(ref)
  const q = preserveRef ? `?ref=${encodeURIComponent(ref as string)}` : ''
  redirect(`/play/${gameId}/landing${q}`)
}
