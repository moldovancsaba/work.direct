"use client"

import { useEffect, useMemo, useState } from 'react'
import GameLayout from '../../../components/game/GameLayout'
import StarsHexa from '../../../components/games/StarsHexa'
import PenaltyHexa from '../../../components/games/PenaltyHexa'

interface GameClientProps {
  game: any
  cfg: any
}

// Game step client — renders the correct game component and wires backend play endpoint
// What: Bridge between normalized config and existing game components
// Why: Third step of the standardized play flow
export default function GameClient({ game, cfg }: GameClientProps) {
  // Load session from localStorage (set during Welcome)
  const session = useMemo(() => {
    try {
      const raw = localStorage.getItem(`playmass:session:${cfg.meta.gameId}`)
      return raw ? JSON.parse(raw) as { participant?: any; trial?: boolean; sessionId?: string; ref?: string | null } : null
    } catch {
      return null
    }
  }, [cfg?.meta?.gameId])

  const isTrial = !session || !!session.trial || !session.participant
  const participant = session?.participant
  const sessionId = session?.sessionId
  const ref = session?.ref || cfg?.meta?.ref

  // Scoreboard state
  const [homeScore, setHomeScore] = useState(0)
  const [visitorScore, setVisitorScore] = useState(0)
  // Stars Hexa scoreboard: starsRemaining : flipsRemaining
  const [starsLeft, setStarsLeft] = useState(0)
  const [flipsLeft, setFlipsLeft] = useState(0)

  const onFlip = async (itemId: string) => {
    if (isTrial) return Promise.reject(new Error('Trial mode does not call backend'))
    const res = await fetch(`/api/games/${cfg.meta.gameId}/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant, sessionId, hexagonId: itemId, ref })
    })
    const data = await res.json()
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Play failed')
    }
    return data.data.result
  }

  const content = game.type === 'STARS_HEXA' ? (
<StarsHexa
      hexagons={game.configuration?.starsHexa?.hexagons || []}
      onFlip={onFlip}
      maxFlipsPerAttempt={game.configuration?.starsHexa?.maxFlipsPerAttempt || 3}
      theme={game.configuration?.starsHexa?.theme || 'default'}
      attemptsRemaining={game.configuration?.maxAttemptsPerUser || 3}
      gameId={cfg.meta.gameId}
      isTrialMode={isTrial}
      referralUuid={ref || undefined}
      winEmoji={game.configuration?.starsHexa?.emojis?.win || '⭐️'}
      loseEmoji={game.configuration?.starsHexa?.emojis?.lose || '🍄'}
      onHUDUpdate={(starsRemaining, flipsRemaining) => { setStarsLeft(starsRemaining); setFlipsLeft(flipsRemaining); }}
    />
  ) : (
    <PenaltyHexa
      players={game.configuration?.penaltyShootout?.players || []}
      onFlip={onFlip}
      theme={game.configuration?.penaltyShootout?.theme || 'football'}
      gameId={cfg.meta.gameId}
      isTrialMode={isTrial}
      referralUuid={ref || undefined}
      customTexts={game.configuration?.penaltyShootout?.texts || {}}
      customColors={game.configuration?.penaltyShootout?.colors || {}}
      onScoreUpdate={(home, visitor) => { setHomeScore(home); setVisitorScore(visitor) }}
    />
  )

  const headerSubtitle = game.description || ''

  const platformStyles = game.configuration?.platform?.styles || {}
  const penaltyColors = game.configuration?.penaltyShootout?.colors || {}

return (
    <GameLayout
      gameId={cfg.meta.gameId}
      gameType={game.type}
      title={(cfg as any)?.platform?.texts?.TEXT_30 || game.title}
      subtitle={headerSubtitle}
      gameContent={content}
      penaltyScore={game.type === 'PENALTY_SHOOTOUT' ? {
        home: homeScore,
        visitor: visitorScore,
        homeBg: platformStyles?.scoreboard?.homeBg || penaltyColors.homeScoreCard || '#C00000FF',
        visitorBg: platformStyles?.scoreboard?.visitorBg || penaltyColors.visitorScoreCard || '#C00000FF',
        digitColor: platformStyles?.scoreboard?.digitColor || '#FFFFFFFF',
        showLabels: !!platformStyles?.scoreboard?.showLabels,
        homeLabel: platformStyles?.scoreboard?.homeLabel,
        visitorLabel: platformStyles?.scoreboard?.visitorLabel
      } : (game.type === 'STARS_HEXA' ? {
        home: starsLeft,
        visitor: flipsLeft,
        homeBg: '#C00000FF',
        visitorBg: '#C00000FF',
        digitColor: '#FFFFFFFF',
        showLabels: false
      } : undefined)}
    />
  )
}

