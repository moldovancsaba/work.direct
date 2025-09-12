import { notFound } from 'next/navigation'

// Disabled dynamic path referrals: this route is intentionally not used.
// All valid steps are explicit (landing, welcome, rules, game, result, terms, privacy, deletion).
// Any extra path segment under /play/[gameId]/... should 404.
export default async function DisabledRefRoute() {
  notFound()
}

