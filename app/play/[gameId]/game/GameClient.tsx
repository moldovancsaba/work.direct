"use client"

import { useEffect, useMemo, useState } from 'react'
import GameLayout from '../../../components/game/GameLayout'
import StarsHexa from '../../../components/games/StarsHexa'
import PenaltyHexa from '../../../components/games/PenaltyHexa 2'
import FindRed from '../../../components/games/FindRed'
import LuckyWheel from '../../../components/LuckyWheel'
import { GameOutcome, WheelSegment } from '../../../types'

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
  // Find Red scoreboard: redsFound / targetReds and roundsUsed / totalRounds
  const [findRedsFound, setFindRedsFound] = useState(0)
  const [findTargetReds, setFindTargetReds] = useState(0)
  const [findRoundsUsed, setFindRoundsUsed] = useState(0)
  const [findTotalRounds, setFindTotalRounds] = useState(0)

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

  // WHAT: Spin handler for Wheel of Fortune.
  // WHY: Previously the wheel button was disabled because no onSpin was provided. This wires backend spin
  //      when a participant/session exists and gracefully falls back to a local weighted random spin in trial mode.
  const onWheelSpin = async (): Promise<GameOutcome> => {
    const segments: WheelSegment[] = game.configuration?.wheelOfFortune?.segments || []
    const active = segments.filter((s: any) => s.isActive !== false)

    // Local weighted result (used in trial mode when participant/session is missing)
    const localWeightedPick = (): GameOutcome => {
      if (active.length === 0) {
        return { type: 'NO_REWARD', segmentId: undefined as any, starsFound: 0, totalStarsInGame: 0, foundAllStars: false, value: 'No segments', rewardIds: [], message: 'Wheel not configured' }
      }
      const probs = active.map((s: any) => Number(s.probability || 0))
      const total = probs.reduce((a: number, b: number) => a + b, 0)
      let chosen = active[0]
      if (total > 0) {
        const r = Math.random() * total
        let acc = 0
        for (let i = 0; i < active.length; i++) {
          acc += probs[i]
          if (r <= acc) { chosen = active[i]; break }
        }
      } else {
        chosen = active[Math.floor(Math.random() * active.length)]
      }
      return {
        type: chosen?.isWinning ? 'WIN' : 'NO_REWARD',
        segmentId: chosen?.id as any,
        starsFound: 0,
        totalStarsInGame: 0,
        foundAllStars: false,
        value: chosen?.label,
        rewardIds: [],
        message: chosen?.label ? `Landed on: ${chosen.label}` : 'Wheel result'
      }
    }

    // If trial mode, do not call backend — return local weighted result
    if (isTrial || !participant || !sessionId) {
      return localWeightedPick()
    }

    // Server-authoritative spin
    const res = await fetch(`/api/games/${cfg.meta.gameId}/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant, sessionId, ref })
    })
    const data = await res.json()
    if (!res.ok || !data?.success) {
      // On failure, fallback to local pick rather than breaking UX
      try { return localWeightedPick() } catch { throw new Error(data?.message || 'Spin failed') }
    }
    return data.data.result as GameOutcome
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
  ) : game.type === 'FIND_RED' ? (
    <FindRed
      config={game.configuration?.findRed}
      platform={game.configuration?.platform}
      gameId={cfg.meta.gameId}
      isTrialMode={isTrial}
      onHUDUpdate={(redsFound, targetReds, roundsUsed, totalRounds) => {
        setFindRedsFound(redsFound)
        setFindTargetReds(targetReds)
        setFindRoundsUsed(roundsUsed)
        setFindTotalRounds(totalRounds)
      }}
    />
  ) : game.type === 'WHEEL_OF_FORTUNE' ? (
    <LuckyWheel
      segments={game.configuration?.wheelOfFortune?.segments || []}
      onSpin={onWheelSpin}
      onResult={undefined}
      size={game.configuration?.wheelOfFortune?.size || 280}
      theme={game.configuration?.wheelOfFortune?.theme || 'default'}
      spinDuration={game.configuration?.wheelOfFortune?.durationMs || 4500}
      rotations={4}
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
      heroBackgroundCss={platformStyles?.hero?.background}
      mainBackgroundCss={platformStyles?.main?.background}
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
      } : (game.type === 'FIND_RED' ? {
        // Map to redsFound / targetReds; we re-use the two-digit display semantics
        home: findRedsFound,
        visitor: findTargetReds,
        homeBg: '#C00000FF',
        visitorBg: '#C00000FF',
        digitColor: '#FFFFFFFF',
        showLabels: false
      } : undefined))}
    />
  )
}

