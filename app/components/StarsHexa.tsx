'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { HexagonCard, GameOutcome } from '../types'

interface StarsHexaProps {
  hexagons: HexagonCard[]
  onFlip?: (hexagonId: string) => Promise<GameOutcome>
  onResult?: (result: GameOutcome) => void
  disabled?: boolean
  maxFlipsPerAttempt?: number
  attemptsRemaining?: number
  maxFlipsPerRound?: number
  maxRounds?: number
  theme?: 'default' | 'colorful' | 'minimal'
  gameId?: string
  isTrialMode?: boolean
}

/**
 * StarsHexa Component - EXACTLY matching hexagon.html structure
 * 
 * GAME RULES:
 * - 3 flips per round, 3 rounds total (3 attempts)
 * - Player must find ALL stars in a single round to win
 * - If can't find all stars after 3 attempts, player loses
 * - Between rounds: NO shuffle (helps player learn)
 * - Every NEW game starts with shuffle
 * - Front of cards: TEXT
 * - Back of cards: ⭐ (stars) vs 🍄 (mushrooms)
 */
export default function StarsHexa({
  hexagons,
  onFlip,
  onResult,
  disabled = false,
  maxFlipsPerAttempt = 3,
  attemptsRemaining = 3,
  maxFlipsPerRound = 3,
  maxRounds = 3,
  theme = 'default',
  gameId,
  isTrialMode = false
}: StarsHexaProps) {
  const router = useRouter()
  const params = useParams()
  
  // Use configuration values - admin can set these
  const flipsPerRound = maxFlipsPerAttempt || maxFlipsPerRound
  const totalRounds = attemptsRemaining || maxRounds
  // Game state
  const [gameState, setGameState] = useState<HexagonCard[]>([])
  const [flipsUsed, setFlipsUsed] = useState(0)
  const [starsFound, setStarsFound] = useState(0)
  const [totalStars, setTotalStars] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [isFlipping, setIsFlipping] = useState(false)
  const [isGameComplete, setIsGameComplete] = useState(false)
  const [gameResult, setGameResult] = useState<GameOutcome | null>(null)
  
  // Layout constants (matching hexagon.html exactly)
  const stageRef = useRef<HTMLDivElement>(null)
  const flowerWrapRef = useRef<HTMLDivElement>(null)
  const [hexWidth, setHexWidth] = useState(120)
  const [scale, setScale] = useState(1)

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Initialize game - shuffle ONLY at start
  const initializeGame = (originalHexagons: HexagonCard[]) => {
    const allTexts = originalHexagons.map(h => h.text)
    const shuffledTexts = shuffleArray(allTexts)
    const starsCount = originalHexagons.filter(h => h.hasHiddenStar).length
    const starPositions = shuffleArray([0, 1, 2, 3, 4, 5, 6]).slice(0, starsCount)
    
    return originalHexagons.map((originalHex, index) => ({
      id: originalHex.id,
      text: shuffledTexts[index],
      hasHiddenStar: starPositions.includes(index),
      isRevealed: false,
      position: index,
      color: originalHex.color || '#4a90e2'
    }))
  }

  // Start new round (reset revealed cards, keep positions)
  const startNewRound = () => {
    if (currentRound >= totalRounds) {
      setIsGameComplete(true)
      return
    }
    
    setGameState(prev => prev.map(h => ({ ...h, isRevealed: false })))
    setFlipsUsed(0)
    setStarsFound(0)
    setCurrentRound(prev => prev + 1)
  }

  // Initialize game when hexagons change
  useEffect(() => {
    if (hexagons.length > 0) {
      const initialState = initializeGame(hexagons)
      setGameState(initialState)
      setTotalStars(hexagons.filter(h => h.hasHiddenStar).length)
      setFlipsUsed(0)
      setStarsFound(0)
      setCurrentRound(1)
      setIsGameComplete(false)
      setGameResult(null)
    }
  }, [hexagons])

  // Layout positioning (matching hexagon.html axial coordinates)
  const getHexagonPosition = (position: number) => {
    // Axial coordinates from hexagon.html
    const axialCoords = [
      { q: 0, r: -1 },   // Position 0 (top left)
      { q: 1, r: -1 },   // Position 1 (top right)
      { q: -1, r: 0 },   // Position 2 (middle left)
      { q: 0, r: 0 },    // Position 3 (center)
      { q: 1, r: 0 },    // Position 4 (middle right)
      { q: -1, r: 1 },   // Position 5 (bottom left)
      { q: 0, r: 1 }     // Position 6 (bottom right)
    ]
    
    const coord = axialCoords[position] || { q: 0, r: 0 }
    const W = hexWidth
    
    // Flat-top axial to pixel conversion (from hexagon.html)
    const x = 0.75 * W * coord.q
    const y = (Math.sqrt(3) / 4 * W) * coord.q + (Math.sqrt(3) / 2 * W) * coord.r
    
    return { x, y }
  }

  // Handle hexagon flip
  const handleHexagonFlip = async (hexagonId: string) => {
    if (isFlipping || disabled || isGameComplete || flipsUsed >= flipsPerRound) return

    const hexagon = gameState.find(h => h.id === hexagonId)
    if (!hexagon || hexagon.isRevealed) return

    setIsFlipping(true)

    try {
      // Update game state
      const newGameState = gameState.map(h => 
        h.id === hexagonId ? { ...h, isRevealed: true } : h
      )
      setGameState(newGameState)
      setFlipsUsed(prev => prev + 1)

      // Count stars found
      let newStarsFound = starsFound
      if (hexagon.hasHiddenStar) {
        newStarsFound = starsFound + 1
        setStarsFound(newStarsFound)
      }

      // Check if all stars found (WIN condition)
      const allStarsFound = newStarsFound >= totalStars
      
      // Check if round is over
      const flipsRemaining = flipsPerRound - (flipsUsed + 1)
      const roundOver = flipsRemaining === 0 || allStarsFound
      
      if (allStarsFound) {
        // Player won!
        setIsGameComplete(true)
      } else if (roundOver && currentRound >= totalRounds) {
        // No more rounds, player lost
        setIsGameComplete(true)
      } else if (roundOver) {
        // Start next round after a delay
        setTimeout(() => startNewRound(), 1000)
      }

      // Create result
      const result = onFlip ? await onFlip(hexagonId) : {
        type: hexagon.hasHiddenStar ? 'WIN' as const : 'NO_REWARD' as const,
        hexagonId,
        starsFound: hexagon.hasHiddenStar ? 1 : 0,
        totalStarsInGame: totalStars,
        foundAllStars: allStarsFound,
        rewardIds: [],
        message: hexagon.hasHiddenStar ? `Found a star in ${hexagon.text}!` : `No star in ${hexagon.text}`
      }

      setGameResult(result)
      
      if (onResult) {
        onResult(result)
      }

    } catch (error) {
      console.error('Flip error:', error)
      // Don't throw here to prevent component crashes - the error is already handled by onFlip
    } finally {
      setIsFlipping(false)
    }
  }

  // Redirect to result page when game completes
  useEffect(() => {
    if (isGameComplete) {
      const targetGameId = gameId || params.gameId as string
      if (targetGameId) {
        // Add a delay to show the final result before redirecting
        const redirectDelay = setTimeout(() => {
          const resultParams = new URLSearchParams({
            won: (starsFound >= totalStars).toString(),
            starsFound: starsFound.toString(),
            totalStars: totalStars.toString(),
            flipsUsed: flipsUsed.toString(),
            roundsUsed: currentRound.toString(),
            ...(isTrialMode && { trial: 'true' })
          })
          
          router.push(`/play/${targetGameId}/result?${resultParams.toString()}`)
        }, 2000) // 2 second delay to see the result
        
        return () => clearTimeout(redirectDelay)
      }
    }
  }, [isGameComplete, starsFound, totalStars, flipsUsed, currentRound, gameId, params.gameId, isTrialMode, router])

  // Layout calculation (matching hexagon.html fitAndRender logic)
  useEffect(() => {
    const fitAndRender = () => {
      if (!stageRef.current) return
      
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 0.96
      
      // Calculate hex width
      const W_w = (vw * margin) / 2.5
      const W_h = (vh * margin) / Math.sqrt(3)
      let W = Math.floor(Math.min(W_w, W_h))
      if (W < 60) W = 60 // minimum size
      if (W > 150) W = 150 // maximum size
      
      setHexWidth(W)
      
      // Calculate scale (simplified)
      const estimatedWidth = W * 2.5
      const estimatedHeight = W * Math.sqrt(3)
      const scaleW = (vw * margin) / estimatedWidth
      const scaleH = (vh * margin) / estimatedHeight
      const finalScale = Math.min(scaleW, scaleH, 1)
      
      setScale(finalScale)
    }
    
    fitAndRender()
    window.addEventListener('resize', fitAndRender)
    return () => window.removeEventListener('resize', fitAndRender)
  }, [])

  const flipsRemaining = flipsPerRound - flipsUsed
  const roundsRemaining = totalRounds - currentRound + 1

  return (
    <>
      {/* Game Info */}
      <div className="fixed top-4 left-4 z-10 bg-black/50 text-white p-3 rounded-lg font-mono text-sm">
        <div>Round: {currentRound}/{totalRounds}</div>
        <div>Flips: {flipsUsed}/{flipsPerRound}</div>
        <div>Stars: {starsFound}/{totalStars}</div>
        {isGameComplete && (
          <div className={`mt-2 font-bold ${starsFound >= totalStars ? 'text-green-400' : 'text-red-400'}`}>
            {starsFound >= totalStars ? 'YOU WON! 🎉' : 'GAME OVER 💀'}
          </div>
        )}
      </div>

      {/* EXACT hexagon.html structure */}
      <main 
        ref={stageRef}
        className="fixed inset-0 grid place-items-center p-8"
        style={{
          background: 'radial-gradient(1200px 800px at 50% 45%, #0a1224 0%, #070d1b 50%, #04070f 100%)'
        }}
      >
        <div 
          ref={flowerWrapRef}
          className="relative"
          style={{
            width: 0,
            height: 0,
            transformOrigin: '0 0',
            transform: `rotate(30deg) scale(${scale})`,
            '--W': `${hexWidth}px`,
            '--H': `${hexWidth * 0.8660254037844386}px`,
            '--duration': '520ms',
            '--easing': 'cubic-bezier(.2,.7,.2,1)'
          } as any}
        >
          <section className="relative" style={{ width: 0, height: 0 }}>
            {gameState.map((hexagon, index) => {
              const position = getHexagonPosition(hexagon.position)
              const isRevealed = hexagon.isRevealed
              
              return (
                <button
                  key={hexagon.id}
                  type="button"
                  className="absolute border-none bg-transparent p-0 cursor-pointer"
                  style={{
                    width: `${hexWidth}px`,
                    height: `${hexWidth * 0.8660254037844386}px`,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'translate(-50%, -50%)',
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  aria-pressed={isRevealed}
                  onClick={() => handleHexagonFlip(hexagon.id)}
                  disabled={disabled || isGameComplete || flipsUsed >= flipsPerRound}
                >
                  {/* Shape container */}
                  <div 
                    className="w-full h-full relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      perspective: '1000px'
                    }}
                  >
                    {/* Flip container */}
                    <div 
                      className="w-full h-full"
                      style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 520ms cubic-bezier(.2,.7,.2,1)',
                        transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* Front face - TEXT */}
                      <div 
                        className="absolute inset-0 border-2 border-blue-700 box-border"
                        style={{
                          backfaceVisibility: 'hidden',
                          background: 'linear-gradient(135deg, #4a90e2, #7bd389)',
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                        }}
                      >
                        <div className="absolute inset-0 grid place-items-center p-2">
                          <div className="text-center text-white font-bold text-sm leading-tight drop-shadow-lg max-w-full overflow-hidden">
                            {hexagon.text.length > 12 ? 
                              hexagon.text.substring(0, 10) + '...' : 
                              hexagon.text
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Back face - STAR or MUSHROOM */}
                      <div 
                        className="absolute inset-0 border-2 border-pink-400 box-border"
                        style={{
                          backfaceVisibility: 'hidden',
                          background: hexagon.hasHiddenStar ? '#ff9500' : '#ff66aa',
                          transform: 'rotateY(180deg)',
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                        }}
                      >
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="text-4xl">
                            {hexagon.hasHiddenStar ? '⭐' : '🍄'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </section>
        </div>
      </main>
    </>
  )
}
