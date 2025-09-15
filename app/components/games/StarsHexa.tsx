'use client'

import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { HexagonCard, GameOutcome } from '../../types'
import { axialToPixel, rotatePoint, hexVertices, SQRT3 } from '../../lib/hex/geometry'

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
  referralUuid?: string | null
  winEmoji?: string
  loseEmoji?: string
  // HUD updater for parent to show stars remaining : flips remaining in hero scoreboard
  onHUDUpdate?: (starsRemaining: number, flipsRemaining: number) => void
  // Optional round reporting to parent (currentRound, totalRounds)
  onRoundUpdate?: (currentRound: number, totalRounds: number) => void
  // Hex grid styling (front/back/edge colors) coming from editor
  hexGridStyles?: {
    activeHexBg?: string
    flipGoodBg?: string
    flipBadBg?: string
    inactiveHexBg?: string
    edgeStrokeColor?: string
  }
}

// Game state interface for useReducer
interface GameState {
  hexagons: HexagonCard[]
  flipsUsed: number
  starsFound: number
  totalStars: number
  currentRound: number
  isGameComplete: boolean
  gameResult: GameOutcome | null
}

// Action types for game state management
type GameAction = 
  | { type: 'INITIALIZE_GAME'; payload: { hexagons: HexagonCard[]; totalStars: number } }
  | { type: 'FLIP_HEXAGON'; payload: { hexagonId: string } }
  | { type: 'FLIP_BACK_HEXAGONS'; payload: { hexagonIds: string[] } }
  | { type: 'START_NEW_ROUND' }
  | { type: 'COMPLETE_GAME'; payload: { result: GameOutcome } }
  | { type: 'RESET_GAME' }

// Ultra-fast game state reducer - no blocking operations
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...state,
        hexagons: action.payload.hexagons,
        totalStars: action.payload.totalStars,
        flipsUsed: 0,
        starsFound: 0,
        currentRound: 1,
        isGameComplete: false,
        gameResult: null
      }
      
    case 'FLIP_HEXAGON':
      const { hexagonId } = action.payload
      const hexagon = state.hexagons.find(h => h.id === hexagonId)
      if (!hexagon || hexagon.isRevealed) return state
      
      const updatedHexagons = state.hexagons.map(h => 
        h.id === hexagonId ? { ...h, isRevealed: true } : h
      )
      const newStarsFound = hexagon.hasHiddenStar ? state.starsFound + 1 : state.starsFound
      
      return {
        ...state,
        hexagons: updatedHexagons,
        flipsUsed: state.flipsUsed + 1,
        starsFound: newStarsFound
      }
      
    case 'FLIP_BACK_HEXAGONS':
      const { hexagonIds } = action.payload
      return {
        ...state,
        hexagons: state.hexagons.map(h => 
          hexagonIds.includes(h.id) ? { ...h, isRevealed: false } : h
        )
      }
      
    case 'START_NEW_ROUND':
      return {
        ...state,
        hexagons: state.hexagons.map(h => ({ ...h, isRevealed: false })),
        flipsUsed: 0,
        starsFound: 0,
        currentRound: state.currentRound + 1
      }
      
    case 'COMPLETE_GAME':
      return {
        ...state,
        isGameComplete: true,
        gameResult: action.payload.result
      }
      
    case 'RESET_GAME':
      return {
        ...state,
        hexagons: state.hexagons.map(h => ({ ...h, isRevealed: false })),
        flipsUsed: 0,
        starsFound: 0,
        currentRound: 1,
        isGameComplete: false,
        gameResult: null
      }
      
    default:
      return state
  }
}

/**
 * StarsHexa Component - ULTRA-FAST FLASH GAMING OPTIMIZED
 * 
 * PERFORMANCE FEATURES:
 * - Pre-generated hexagon cards (all DOM elements ready on mount)
 * - Parallel click support (no debouncing or blocking)
 * - Lightning-fast 200ms animations
 * - Auto-flip back mechanism (1 second delay for non-matching cards)
 * - Hardware-accelerated CSS transforms
 * - Optimized state management with useReducer
 * - No network calls blocking UI updates
 * 
 * GAME RULES:
 * - 3 flips per round, 3 rounds total (3 attempts)
 * - Player must find ALL stars in a single round to win
 * - Cards auto-flip back after 1 second if not all stars
 * - Every NEW game starts with shuffle
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
  isTrialMode = false,
  referralUuid,
  winEmoji = '⭐️',
  loseEmoji = '🍄',
  onHUDUpdate,
  onRoundUpdate,
  hexGridStyles
}: StarsHexaProps) {
  const router = useRouter()
  const params = useParams()
  
  // Configuration values
  const flipsPerRound = maxFlipsPerAttempt || maxFlipsPerRound
  const totalRounds = attemptsRemaining || maxRounds
  
  // Optimized game state with useReducer for batched updates
  const [gameState, dispatch] = useReducer(gameReducer, {
    hexagons: [],
    flipsUsed: 0,
    starsFound: 0,
    totalStars: 0,
    currentRound: 1,
    isGameComplete: false,
    gameResult: null
  })
  
  // Inform parent of initial round/total and on any change
  useEffect(() => {
    if (typeof onRoundUpdate === 'function') {
      onRoundUpdate(gameState.currentRound, totalRounds || 0)
    }
  }, [gameState.currentRound, totalRounds, onRoundUpdate])
  
  // Layout state for hexagon positioning
  const stageRef = useRef<HTMLDivElement>(null)
  // Geometry sizing: we compute radius (s). The visual hex width W = 2*s.
  const [radius, setRadius] = useState(60)
  const [scale, setScale] = useState(1) // kept for compatibility; will remain 1 after fit calc

  // Auto-flip back timer for non-matching cards
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Shuffle utility - used only at game start
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Initialize game - shuffle positions and texts
  const initializeGame = (originalHexagons: HexagonCard[]) => {
    const allTexts = originalHexagons.map(h => h.text)
    const shuffledTexts = shuffleArray(allTexts)
    const starsCount = originalHexagons.filter(h => h.hasHiddenStar).length
    const starPositions = shuffleArray([0, 1, 2, 3, 4, 5, 6]).slice(0, starsCount)
    
    // Pre-generate all cards immediately - no lazy loading
    return originalHexagons.map((originalHex, index) => ({
      id: originalHex.id,
      text: shuffledTexts[index],
      hasHiddenStar: starPositions.includes(index),
      isRevealed: false, // All cards start face-down but are fully generated
      position: index,
      color: originalHex.color || '#4a90e2'
    }))
  }

  // Initialize game when hexagons change - immediate full generation
  useEffect(() => {
    if (hexagons.length > 0) {
      const initialState = initializeGame(hexagons)
      dispatch({
        type: 'INITIALIZE_GAME',
        payload: {
          hexagons: initialState,
          totalStars: hexagons.filter(h => h.hasHiddenStar).length
        }
      })
    }
  }, [hexagons])

  // Notify parent HUD of current stars/flips remaining
  useEffect(() => {
    if (!onHUDUpdate) return
    const flipsPerRoundLocal = maxFlipsPerAttempt || maxFlipsPerRound
    const starsRemaining = Math.max(0, gameState.totalStars - gameState.starsFound)
    const flipsRemaining = Math.max(0, flipsPerRoundLocal - gameState.flipsUsed)
    onHUDUpdate(starsRemaining, flipsRemaining)
  }, [gameState.starsFound, gameState.flipsUsed, gameState.totalStars, maxFlipsPerAttempt, maxFlipsPerRound, onHUDUpdate])

  // Selected axial coordinates for this session (7 active hexes)
  const [selectedAxial, setSelectedAxial] = useState<Array<{ q: number; r: number }>>([])
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)

  // Layout positioning using selected axial coordinates
  const getHexagonPosition = (position: number) => {
    const coord = selectedAxial[position] || { q: 0, r: 0 }
    const s = radius // geometry radius; visual width W = 2*s

    const p = axialToPixel(coord.q, coord.r, s)
    return { x: p.x, y: p.y }
  }

  // ULTRA-FAST hexagon flip handler - NO BLOCKING, NO DEBOUNCING
  const handleHexagonFlip = useCallback((hexagonId: string) => {
    // Minimal validation only - allow rapid parallel clicks
    if (disabled || gameState.isGameComplete || gameState.flipsUsed >= flipsPerRound) return
    
    const hexagon = gameState.hexagons.find(h => h.id === hexagonId)
    if (!hexagon || hexagon.isRevealed) return

    // INSTANT UI UPDATE - no waiting, pure speed
    dispatch({ type: 'FLIP_HEXAGON', payload: { hexagonId } })

    // Calculate game logic in parallel with animation
    setTimeout(() => {
      const updatedHexagons = gameState.hexagons.map(h => 
        h.id === hexagonId ? { ...h, isRevealed: true } : h
      )
      const revealedCards = updatedHexagons.filter(h => h.isRevealed)
      const newFlipsUsed = gameState.flipsUsed + 1
      const newStarsFound = hexagon.hasHiddenStar ? gameState.starsFound + 1 : gameState.starsFound
      const allStarsFound = newStarsFound >= gameState.totalStars
      
      // Auto-flip back mechanism - 3 cards revealed but not all stars
      if (revealedCards.length === 3 && !allStarsFound) {
        // Clear any existing timer
        if (autoFlipTimerRef.current) {
          clearTimeout(autoFlipTimerRef.current)
        }
        
        // 1-second auto-flip back timer as requested
        autoFlipTimerRef.current = setTimeout(() => {
          const revealedIds = revealedCards.map(h => h.id)
          dispatch({ type: 'FLIP_BACK_HEXAGONS', payload: { hexagonIds: revealedIds } })
        }, 1000) // Exactly 1 second as requested
      }
      
      // Handle game completion
      if (allStarsFound || newFlipsUsed >= flipsPerRound) {
        if (allStarsFound) {
          const result: GameOutcome = {
            type: 'WIN',
            hexagonId,
            starsFound: newStarsFound,
            totalStarsInGame: gameState.totalStars,
            foundAllStars: true,
            value: 'All stars found!',
            rewardIds: [],
            message: 'Congratulations! You found all the stars!'
          }
          dispatch({ type: 'COMPLETE_GAME', payload: { result } })
          if (onResult) onResult(result)
        } else if (gameState.currentRound >= totalRounds) {
          const result: GameOutcome = {
            type: 'NO_REWARD',
            hexagonId,
            starsFound: newStarsFound,
            totalStarsInGame: gameState.totalStars,
            foundAllStars: false,
            value: 'Game over',
            rewardIds: [],
            message: 'Game over! Try again.'
          }
          dispatch({ type: 'COMPLETE_GAME', payload: { result } })
          if (onResult) onResult(result)
        } else {
          // Start next round
          setTimeout(() => {
            dispatch({ type: 'START_NEW_ROUND' })
          }, 1500)
        }
      }
      
      // Network call runs in background - doesn't block UI
      // Skip API calls in trial mode - game logic is handled internally
      if (onFlip && !isTrialMode) {
        onFlip(hexagonId).then(result => {
          // In registered mode, use API result if available
          if (onResult) onResult(result)
        }).catch(error => {
          console.warn('Network error:', error)
        })
      }
    }, 0) // Run immediately but non-blocking
  }, [disabled, gameState, flipsPerRound, totalRounds, onFlip, onResult])

  // Compute rotated bounding box for a given radius over selected active axial coords
  const computeFitBox = useCallback((s: number) => {
    if (selectedAxial.length !== 7) return { w: 0, h: 0 }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const { q, r } of selectedAxial) {
      const c = axialToPixel(q, r, s)
      const verts = hexVertices(c.x, c.y, s).map((p) => rotatePoint(p.x, p.y))
      for (const v of verts) {
        if (v.x < minX) minX = v.x
        if (v.x > maxX) maxX = v.x
        if (v.y < minY) minY = v.y
        if (v.y > maxY) maxY = v.y
      }
    }
    return { w: maxX - minX, h: maxY - minY }
  }, [selectedAxial])

  // Layout calculation for responsive hexagons within container (fit to active 7 only)
  useEffect(() => {
    const updateLayout = () => {
      if (!stageRef.current || selectedAxial.length !== 7) return

      const rect = stageRef.current.getBoundingClientRect()
      const vw = rect.width || 800
      const vh = rect.height || 600
      const margin = 0.96

      // Start with a base radius, then scale to fit the rotated bounding box
      const s0 = Math.max(16, Math.min(vw, vh) / 10)
      const box0 = computeFitBox(s0)
      if (box0.w <= 0 || box0.h <= 0) return
      const scaleCalc = Math.min((vw * margin) / box0.w, (vh * margin) / box0.h)
      const s = s0 * scaleCalc

      setRadius(s)
      setScale(1)
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [computeFitBox, selectedAxial])

  // Redirect to results IMMEDIATELY when game completes - no delay
  useEffect(() => {
    if (gameState.isGameComplete) {
      const targetGameId = gameId || params.gameId as string
      if (targetGameId) {
        const resultParams = new URLSearchParams({
          won: (gameState.starsFound >= gameState.totalStars).toString(),
          starsFound: gameState.starsFound.toString(),
          totalStars: gameState.totalStars.toString(),
          flipsUsed: gameState.flipsUsed.toString(),
          roundsUsed: gameState.currentRound.toString(),
          ...(isTrialMode && { trial: 'true' }),
          ...(referralUuid && { ref: referralUuid })
        })
        
        // IMMEDIATE redirect - no delay for flash gaming experience
        router.push(`/play/${targetGameId}/result?${resultParams.toString()}`)
      }
    }
  }, [gameState.isGameComplete, gameState.starsFound, gameState.totalStars, gameState.flipsUsed, gameState.currentRound, gameId, params.gameId, isTrialMode, referralUuid, router])

  // Resolve hex grid styles with sensible fallbacks
  const resolvedStyles = useMemo(() => ({
    activeHexBg: (hexGridStyles?.activeHexBg || 'linear-gradient(135deg, #4a90e2, #7bd389)') as string,
    flipGoodBg: (hexGridStyles?.flipGoodBg || '#ff9500') as string,
    flipBadBg: (hexGridStyles?.flipBadBg || '#ff66aa') as string,
    edgeStrokeColor: (hexGridStyles?.edgeStrokeColor || '#4fc3f7') as string
  }), [hexGridStyles])

  // Session-stable random map selection (per sessionId if available)
  useEffect(() => {
    const selectMapAndPositions = async () => {
      try {
        const sidKeyBase = `playmass:session:${gameId || (params.gameId as string)}`
        let sessionId = 'trial'
        try {
          const raw = localStorage.getItem(sidKeyBase)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.sessionId) sessionId = parsed.sessionId
          }
        } catch {}
        const selKey = `playmass:hexa:sel:${gameId || (params.gameId as string)}:${sessionId}`
        const existing = localStorage.getItem(selKey)
        if (existing) {
          const parsed = JSON.parse(existing)
          if (Array.isArray(parsed?.coords) && parsed.coords.length === 7) {
            setSelectedAxial(parsed.coords)
            setSelectedMapId(parsed.mapId || null)
            return
          }
        }
        // Fetch a random active #water map
        const res = await fetch(`/api/hexmaps/random?tag=water`, { cache: 'no-store' })
        let coords: Array<{ q: number; r: number }>
        let mapId: string | null = null
        if (res.ok) {
          const data = await res.json()
          const all: Array<{ q: number; r: number }> = data?.data?.coords || []
          mapId = data?.data?._id || null
          // Shuffle and take first 7 coords; if fewer than 7, fall back to default layout
          const shuffled = shuffleArray(all)
          if (shuffled.length >= 7) {
            coords = shuffled.slice(0, 7)
          } else {
            coords = [
              { q: 0, r: -1 },
              { q: 1, r: -1 },
              { q: -1, r: 0 },
              { q: 0, r: 0 },
              { q: 1, r: 0 },
              { q: -1, r: 1 },
              { q: 0, r: 1 }
            ]
          }
        } else {
          // No maps for tag — fall back to default 2-3-2
          coords = [
            { q: 0, r: -1 },
            { q: 1, r: -1 },
            { q: -1, r: 0 },
            { q: 0, r: 0 },
            { q: 1, r: 0 },
            { q: -1, r: 1 },
            { q: 0, r: 1 }
          ]
          mapId = null
        }
        setSelectedAxial(coords)
        setSelectedMapId(mapId)
        localStorage.setItem(selKey, JSON.stringify({ mapId, coords }))
      } catch (e) {
        // As a last resort, redirect to result page rather than show an error page
        try {
          const targetGameId = gameId || (params.gameId as string)
          if (targetGameId) {
            router.push(`/play/${targetGameId}/result?won=false&error=map`)
          }
        } catch {}
      }
    }
    selectMapAndPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div 
      ref={stageRef}
      className="relative w-full h-full grid place-items-center bg-white/5 backdrop-blur-sm rounded-2xl"
      style={{
        minHeight: '100%'
      }}
    >
      <div 
        className="relative"
        style={{
          width: 0,
          height: 0,
          transformOrigin: '0 0',
          transform: `rotate(30deg) scale(${scale})`,
        }}
      >
        <section className="relative" style={{ width: 0, height: 0 }}>
          {gameState.hexagons.map((hexagon) => {
            const position = getHexagonPosition(hexagon.position)
            const isRevealed = hexagon.isRevealed
            
            // Ultra-fast clickable state calculation
            const isClickable = !disabled && !gameState.isGameComplete && 
                               gameState.flipsUsed < flipsPerRound && !hexagon.isRevealed
            
            const W = radius * 2
            const H = W * (SQRT3 / 2)

            return (
              <button
                key={hexagon.id}
                type="button"
                className={`absolute border-none bg-transparent p-0 ${ 
                  isClickable 
                    ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-75' 
                    : 'cursor-not-allowed'
                }`}
                style={{
                  width: `${W}px`,
                  height: `${H}px`,
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'translate(-50%, -50%)',
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  WebkitTapHighlightColor: 'transparent',
                  willChange: 'transform'
                }}
                onClick={() => handleHexagonFlip(hexagon.id)}
                disabled={!isClickable}
              >
                {/* Shape container with 3D perspective */}
                <div 
                  className="w-full h-full relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                >
                  {/* Flip container - 200ms ultra-fast animation */}
                  <div 
                    className="w-full h-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 200ms ease-out',
                      transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front face - TEXT */}
                    <div 
                      className="absolute inset-0 box-border"
                      style={{
                        backfaceVisibility: 'hidden',
                        background: resolvedStyles.activeHexBg,
                        border: `2px solid ${resolvedStyles.edgeStrokeColor}`,
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                      }}
                    >
                      <div className="absolute inset-0 grid place-items-center p-2" style={{ transform: 'rotate(-30deg)' }}>
                        <div className="text-center text-white font-bold text-xs leading-tight drop-shadow-lg">
                          {hexagon.text.length > 10 ? 
                            hexagon.text.substring(0, 8) + '...' : 
                            hexagon.text}
                        </div>
                      </div>
                    </div>
                    
                    {/* Back face - STAR or MUSHROOM */}
                    <div 
                      className="absolute inset-0 box-border"
                      style={{
                        backfaceVisibility: 'hidden',
                        background: hexagon.hasHiddenStar ? resolvedStyles.flipGoodBg : resolvedStyles.flipBadBg,
                        border: `2px solid ${resolvedStyles.edgeStrokeColor}`,
                        transform: 'rotateY(180deg)',
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                      }}
                    >
                      <div className="absolute inset-0 grid place-items-center" style={{ transform: 'rotate(-30deg)' }}>
                        <div className="text-3xl font-bold text-white drop-shadow-lg select-none">
                          {hexagon.hasHiddenStar ? (winEmoji || '⭐️') : (loseEmoji || '🍄')}
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
      
      {/* Game completion indicator */}
      {gameState.isGameComplete && (
        <div className="absolute top-4 right-4 bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm">
          {gameState.starsFound >= gameState.totalStars ? 'YOU WON!' : 'GAME OVER'}
        </div>
      )}
    </div>
  )
}
