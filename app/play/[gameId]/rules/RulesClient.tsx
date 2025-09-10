"use client"

import { useRouter } from 'next/navigation'
import GameRulesPage from '../../../components/game/GameRulesPage'

interface RulesClientProps {
  gameId: string
  gameType: 'STARS_HEXA' | 'PENALTY_SHOOTOUT'
  customTexts?: Record<string, string>
  refCode?: string
}

// Rules step client — shows rules then advances to Game
// What: Present rules and continue
// Why: Second step of standardized play flow
export default function RulesClient({ gameId, gameType, customTexts = {}, refCode }: RulesClientProps) {
  const router = useRouter()
  return (
    <GameRulesPage
      gameType={gameType}
      gameTitle={customTexts.gameTitle || 'Game Rules'}
      gameDescription={customTexts.gameDescription}
      customTexts={customTexts}
      onStartGame={() => {
        const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
        router.push(`/play/${gameId}/game${q}`)
      }}
      theme="default"
      hideHeader
    />
  )
}

