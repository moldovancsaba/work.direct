import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Rules page (server component)
// What: Fetch game, resolve play config, render client Rules.
// Why: Second step of standardized 4-page flow.
import { redirect } from 'next/navigation'

export default async function RulesPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = await params
  redirect(`/play/${gameId}/game`)
}

