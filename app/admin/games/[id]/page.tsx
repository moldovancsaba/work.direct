'use client'

import { useParams } from 'next/navigation'
import GameEditor from '../../../components/admin/GameEditor'

// Edit Game Page — unified editor wrapper
// What: Use the shared GameEditor in edit mode to ensure single-source layout.
// Why: Enforces consistent admin UI and reduces divergence between create/edit flows.
export default function EditGamePage() {
  const params = useParams()
  const gameId = params.id as string
  return <GameEditor mode="edit" gameId={gameId} />
}
