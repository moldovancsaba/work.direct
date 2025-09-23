"use client"

import { useMemo } from 'react'
import GameLayout from '../../../components/game/GameLayout'
import QuizzzGame from '../../../components/games/QuizzzGame'
import { GameOutcome } from '../../../types'

interface GameClientProps {
  game: any
  cfg: any
}

export default function GameClientClean({ game, cfg }: GameClientProps) {
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
  const ref = session?.ref || cfg?.meta?.ref

  const attemptId = useMemo(() => {
    try { return (globalThis as any).crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}` } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}` }
  }, [])

  const content = (
    <QuizzzGame
      config={game.configuration?.quizzz}
      platformMainBackgroundCss={game.configuration?.platform?.styles?.main?.background}
      onResult={async (r) => {
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
  )

  const platformStyles = game.configuration?.platform?.styles || {}
  const headerSubtitle = game.description || ''

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
    />
  )
}
