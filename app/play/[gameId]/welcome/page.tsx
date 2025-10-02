import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Welcome page (server component)
// What: Fetch game, resolve play config, render client Welcome.
// Why: Establish the first step of the standardized 4-page flow.
export default async function WelcomePage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = await params
  redirect(`/play/${gameId}/landing`)
}

