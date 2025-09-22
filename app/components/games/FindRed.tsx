"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * FindRed (Get Shorty) Component
 *
 * What: Round-based card picking game. Each round shows X cards with Y red ones,
 * the player can make N selections per round. The goal is to find Z reds within W rounds.
 * Why: Simple, fast, configurable game with minimal visuals and 3D flip animations.
 *
 * Strategic notes:
 * - Client-authoritative MVP: The client generates round packs to optimize UX speed.
 *   We still record plays on the server for analytics; future server-authoritative RNG
 *   can replace the pack generation without changing the UI contract.
 */
export default function FindRed({
  config,
  platform,
  gameId,
  isTrialMode = false,
  onHUDUpdate,
  onComplete
}: {
  config: any
  platform?: any
  gameId: string
  isTrialMode?: boolean
  onHUDUpdate?: (redsFound: number, targetReds: number, roundsUsed: number, totalRounds: number) => void
  onComplete?: (summary: { won: boolean, correct: number, rounds: number }) => void
}) {
  // Derived settings with safe defaults
  const packSize = Math.max(3, Math.min(32, Number(config?.packSize ?? 6)))
  const redsPerPack = Math.max(1, Math.min(packSize, Number(config?.redsPerPack ?? 2)))
  const selectionsPerRound = Math.max(1, Math.min(packSize, Number(config?.selectionsPerRound ?? 1)))
  const targetReds = Math.max(1, Number(config?.targetReds ?? 3))
  const totalRounds = Math.max(targetReds, Number(config?.totalRounds ?? 5))

  const shortyLabel: string = config?.texts?.shortyLabel || 'Shorty'

  const colors = {
    background: config?.colors?.background || '#0B1220',
    winForeground: config?.colors?.winForeground || '#FF1A1A',
    neutralForeground: config?.colors?.neutralForeground || '#A0AEC0',
    cardBack: config?.colors?.cardBack || '#1F2937',
    cardBorder: config?.colors?.cardBorder || '#374151'
  }

  // Game state
  const [roundIndex, setRoundIndex] = useState(1)
  const [redsFound, setRedsFound] = useState(0)
  const [selectionsUsed, setSelectionsUsed] = useState(0)
  const [revealed, setRevealed] = useState<boolean[]>(() => Array(packSize).fill(false))
  const [redMap, setRedMap] = useState<boolean[]>(() => generateRedMap(packSize, redsPerPack))
  const [isFinished, setIsFinished] = useState(false)

  // Keep HUD in sync
  useEffect(() => {
    onHUDUpdate?.(redsFound, targetReds, roundIndex - 1, totalRounds)
  }, [onHUDUpdate, redsFound, targetReds, roundIndex, totalRounds])

  // Generate a new round (reshuffle)
  const startNewRound = useCallback(() => {
    setRevealed(Array(packSize).fill(false))
    setRedMap(generateRedMap(packSize, redsPerPack))
    setSelectionsUsed(0)
  }, [packSize, redsPerPack])

  // Proceed to next round if available
  const gotoNextRound = useCallback(() => {
    if (roundIndex >= totalRounds) {
      finishGame()
    } else {
      setRoundIndex(r => r + 1)
      startNewRound()
    }
  }, [roundIndex, totalRounds, startNewRound])

  // Finish the game and navigate to result via platformized routing (delegated to parent page)
  const finishGame = useCallback(() => {
    setIsFinished(true)
    // Notify parent that an attempt has completed so it can persist and navigate
    try { onComplete?.({ won: redsFound >= targetReds, correct: redsFound, rounds: totalRounds }) } catch {}
  }, [onComplete, redsFound, targetReds, totalRounds])

  // Handle card flip
  const onPick = async (index: number) => {
    if (isFinished) return
    if (revealed[index]) return
    if (selectionsUsed >= selectionsPerRound) return

    const nextRevealed = revealed.slice()
    nextRevealed[index] = true
    setRevealed(nextRevealed)

    const wasRed = !!redMap[index]

    // Update local state
    if (wasRed) {
      setRedsFound(v => v + 1)
    }
    setSelectionsUsed(c => c + 1)

    // No per-pick persistence; we persist once per attempt on completion via onComplete
    

    // Early win if target reached
    const newRedsFound = (wasRed ? redsFound + 1 : redsFound)
    if (newRedsFound >= targetReds) {
      finishGame()
      return
    }

    // If selections done for this round, advance
    const nextSelections = selectionsUsed + 1
    if (nextSelections >= selectionsPerRound) {
      // Delay a tick to let animation complete
      setTimeout(() => gotoNextRound(), 300)
    }
  }

  // Reset round on round change
  useEffect(() => {
    if (roundIndex === 1) return
    // Each round restarts with fresh pack; redMap regenerated in startNewRound
  }, [roundIndex])

  // Derived grid layout (simple responsive)
  const columns = useMemo(() => {
    if (packSize <= 4) return 2
    if (packSize <= 9) return 3
    if (packSize <= 12) return 4
    return 5
  }, [packSize])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4" style={{ background: colors.background }}>
      {/* HUD */}
      <div className="mb-4 text-white text-sm opacity-80">
        <div>Reds Found: <span className="font-semibold">{redsFound}</span> / {targetReds}</div>
        <div>Round: <span className="font-semibold">{roundIndex}</span> / {totalRounds}</div>
        <div>Pick: <span className="font-semibold">{selectionsUsed}</span> / {selectionsPerRound}</div>
      </div>

      {/* Grid of cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(60px, 1fr))` }}>
        {Array.from({ length: packSize }).map((_, i) => {
          const isRevealed = revealed[i]
          const isRed = redMap[i]
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={isRevealed || isFinished}
              className={`relative w-20 h-28 rounded-lg border transition-transform duration-75 ${isRevealed ? 'cursor-default' : 'hover:scale-105 active:scale-95'} `}
              style={{ borderColor: colors.cardBorder, background: 'transparent' }}
            >
              {/* Flip container */}
              <div className="w-full h-full" style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 200ms ease-out',
                transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}>
                {/* Front (back of card) */}
                <div className="absolute inset-0 rounded-lg" style={{
                  backfaceVisibility: 'hidden',
                  background: colors.cardBack,
                  border: `2px solid ${colors.cardBorder}`
                }}>
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-70">
                    {shortyLabel}
                  </div>
                </div>
                {/* Back (revealed face) */}
                <div className="absolute inset-0 rounded-lg" style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  border: `2px solid ${colors.cardBorder}`,
                  background: '#0a0a0a'
                }}>
                  <div className="absolute inset-0 flex items-center justify-center select-none" style={{ color: isRed ? colors.winForeground : colors.neutralForeground }}>
                    <span className="text-3xl font-bold">{isRed ? '●' : '○'}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Round controls (auto-advance used; keep a fallback) */}
      {!isFinished && selectionsUsed >= selectionsPerRound && roundIndex < totalRounds && (
        <button onClick={gotoNextRound} className="mt-4 px-4 py-2 rounded-md bg-white/10 text-white border border-white/20 hover:bg-white/20">
          Next Round
        </button>
      )}

      {/* Finish state */}
      {isFinished && (
        <div className="mt-4 text-white/90">
          {redsFound >= targetReds ? 'You found Shorty! 🎉' : 'Shorty got away. Try again!'}
        </div>
      )}
    </div>
  )
}

// Utility: generate boolean map for reds in a pack
function generateRedMap(packSize: number, redsPerPack: number): boolean[] {
  const indices = Array.from({ length: packSize }, (_, i) => i)
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const reds = new Set(indices.slice(0, redsPerPack))
  return Array.from({ length: packSize }, (_, i) => reds.has(i))
}
