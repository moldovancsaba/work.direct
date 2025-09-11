'use client'

import GameEditor from '../../../components/admin/GameEditor'

export default function NewGamePage() {
  // Use the unified GameEditor in create mode to ensure platform settings (texts/styles) are saved consistently.
  return <GameEditor mode="create" />
}
