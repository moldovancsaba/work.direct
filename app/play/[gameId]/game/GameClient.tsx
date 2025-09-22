"use client"

import { useEffect, useMemo, useState } from 'react'
import GameLayout from '../../../components/game/GameLayout'
import FindRed from '../../../components/games/FindRed'
import LuckyWheel from '../../../components/LuckyWheel'
import QuizzHexa from '../../../components/games/QuizzHexa'
import QuizzzGame from '../../../components/games/QuizzzGame'
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

  // Generate a fresh attemptId per mounted play screen to represent a single attempt/session
  const attemptId = useMemo(() => {
    try { return (globalThis as any).crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}` } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}` }
  }, [])

  // Stars Hexa HUD (legacy): starsRemaining : flipsRemaining (kept for potential UI use)
  const [starsLeft, setStarsLeft] = useState(0)
  const [flipsLeft, setFlipsLeft] = useState(0)
  // Stars Hexa rounds (legacy for scoreboard); retained harmlessly
  const [hexaCurrentRound, setHexaCurrentRound] = useState(1)
  const [hexaTotalRounds, setHexaTotalRounds] = useState(0)
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
      body: JSON.stringify({ participant, sessionId: attemptId, attemptId, gameType: 'WHEEL_OF_FORTUNE', ref })
    })
    const data = await res.json()
    if (!res.ok || !data?.success) {
      // On failure, fallback to local pick rather than breaking UX
      try { return localWeightedPick() } catch { throw new Error(data?.message || 'Spin failed') }
    }
    return data.data.result as GameOutcome
  }

  const content = game.type === 'FIND_RED' ? (
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
      onComplete={async (summary: { won: boolean, correct: number, rounds: number }) => {
        const result: GameOutcome = {
          type: summary.won ? 'WIN' : 'LOSE',
          starsFound: summary.correct,
          totalStarsInGame: summary.rounds,
          foundAllStars: summary.won,
          value: `${summary.correct}/${summary.rounds}`,
          rewardIds: [],
          message: summary.won ? 'You found Shorty!' : 'Shorty got away'
        }
        try {
          await fetch(`/api/games/${cfg.meta.gameId}/play`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant, sessionId: attemptId, attemptId, gameType: 'FIND_RED', result, ref })
          }).catch(()=>{})
        } finally {
          const params = new URLSearchParams({ won: summary.won ? 'true' : 'false' })
          if (isTrial) params.set('trial', 'true')
          if (ref) params.set('ref', ref)
          params.set('starsFound', String(summary.correct))
          params.set('totalStars', String(summary.rounds))
          window.location.href = `/play/${cfg.meta.gameId}/result?${params.toString()}`
        }
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
) : game.type === 'QUIZZ' ? (
    <QuizzHexa
      mapType={game.configuration?.quizz?.mapType || 'hex'}
      mapName={game.configuration?.quizz?.mapName}
      activeCoords={game.configuration?.quizz?.activeCoords}
      mapTag={game.configuration?.quizz?.mapTag || 'water'}
      selectedMaps={game.configuration?.quizz?.selectedMaps || []}
      randomizeSelectedMaps={!!game.configuration?.quizz?.randomizeSelectedMaps}
      rounds={game.configuration?.quizz?.rounds || 5}
      targetCorrect={game.configuration?.quizz?.targetCorrect || 3}
      questions={game.configuration?.quizz?.questions || []}
      overlayBg={game.configuration?.quizz?.overlayBg || 'rgba(0,0,0,0.6)'}
      cardCoverImages={game.configuration?.quizz?.cardCoverImages || []}
      onResult={async (r)=>{
        // What: Normalize quiz outcome and persist a single attempt completion before navigating to result
        const result: GameOutcome = {
          type: r.won ? 'WIN' : 'LOSE',
          starsFound: r.correct,
          totalStarsInGame: r.rounds,
          foundAllStars: r.won,
          value: `${r.correct}/${r.rounds}`,
          rewardIds: [],
          message: r.won ? 'You won the quiz!' : 'Quiz over'
        }
        setHexaCurrentRound(r.rounds)
        setHexaTotalRounds(game.configuration?.quizz?.targetCorrect || 0)
        try {
          await fetch(`/api/games/${cfg.meta.gameId}/play`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant, sessionId: attemptId, attemptId, gameType: 'QUIZZ', result, ref })
          }).catch(()=>{})
        } finally {
          try {
            const params = new URLSearchParams({ won: r.won ? 'true' : 'false' })
            if (isTrial) params.set('trial', 'true')
            if (ref) params.set('ref', ref)
            params.set('starsFound', String(r.correct))
            params.set('totalStars', String(r.rounds))
            window.location.href = `/play/${cfg.meta.gameId}/result?${params.toString()}`
          } catch { /* ignore */ }
        }
      }}
    />
  ) : game.type === 'QUIZZZ' ? (
    <QuizzzGame
      config={game.configuration?.quizzz}
      platformMainBackgroundCss={game.configuration?.platform?.styles?.main?.background}
      onResult={async (r) => {
        // Persist a single QUIZZZ attempt completion before navigating
        const result: GameOutcome = {
          type: r.won ? 'WIN' : 'LOSE',
          starsFound: r.correct,
          totalStarsInGame: r.rounds,
          foundAllStars: r.won,
          value: `${r.correct}/${r.rounds}`,
          rewardIds: [],
          message: r.won ? 'You won the quiz!' : 'Quiz over'
        }
        try {
          await fetch(`/api/games/${cfg.meta.gameId}/play`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant, sessionId: attemptId, attemptId, gameType: 'QUIZZZ', result, ref })
          }).catch(()=>{})
        } finally {
          const params = new URLSearchParams({ won: r.won ? 'true' : 'false' })
          if (isTrial) params.set('trial', 'true')
          if (ref) params.set('ref', ref)
          params.set('starsFound', String(r.correct))
          params.set('totalStars', String(r.rounds))
          window.location.href = `/play/${cfg.meta.gameId}/result?${params.toString()}`
        }
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-white/80">
      Unsupported game type
    </div>
  )

  const headerSubtitle = game.description || ''

  const platformStyles = game.configuration?.platform?.styles || {}

return (
    <GameLayout
      gameId={cfg.meta.gameId}
      gameType={game.type}
      title={(cfg as any)?.platform?.texts?.TEXT_30 || game.title}
      subtitle={headerSubtitle}
      heroLogoUrl={(cfg as any)?.platform?.texts?.HERO_LOGO_URL}
      heroLogoWidth={Number((cfg as any)?.platform?.texts?.HERO_LOGO_WIDTH) || 64}
      heroLogoHeight={Number((cfg as any)?.platform?.texts?.HERO_LOGO_HEIGHT) || 64}
      heroBackgroundCss={platformStyles?.hero?.background}
      mainBackgroundCss={platformStyles?.main?.background}
      heroUseScoreboard={platformStyles?.hero?.useScoreboard !== false}
      heroFontUrl={platformStyles?.hero?.fontUrl}
      heroFontStyle={platformStyles?.hero?.fontStyle}
      heroTitleClass={platformStyles?.hero?.titleClass}
      heroTitleColor={platformStyles?.hero?.fontColor}
      mainFontUrl={platformStyles?.main?.fontUrl}
      mainFontStyle={platformStyles?.main?.fontStyle}
      mainFonts={{ h1: { url: platformStyles?.main?.h1FontUrl, style: platformStyles?.main?.h1FontStyle }, h2: { url: platformStyles?.main?.h2FontUrl, style: platformStyles?.main?.h2FontStyle }, p: { url: platformStyles?.main?.pFontUrl, style: platformStyles?.main?.pFontStyle } }}
      gameContent={content}
      penaltyScore={game.type === 'FIND_RED' ? {
        // Map to redsFound / targetReds; re-use the two-digit display semantics
        home: findRedsFound,
        visitor: findTargetReds,
        homeBg: '#C00000FF',
        visitorBg: '#C00000FF',
        digitColor: '#FFFFFFFF'
      } : undefined}
    />
  )
}

