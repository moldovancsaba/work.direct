'use client'

import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PenaltyCard, GameOutcome } from '../../types'
import { axialToPixel, rotatePoint, hexVertices, SQRT3 } from '@/lib/hex/geometry'

interface PenaltyTexts {
  // Registration texts
  gameTitle?: string
  namePlaceholder?: string
  emailPlaceholder?: string
  phonePlaceholder?: string
  contactRequiredError?: string
  startPlayingButton?: string
  tryWithoutRegText?: string
  tryWithoutRegButton?: string
  
  // Game texts
  gameRulesTitle?: string
  gameRulesText?: string
  winConditionsTitle?: string
  winConditionsText?: string
  gameDescription?: string
  playButton?: string
  
  // Result texts
  playAgainButton?: string
  shareWithFriendsButton?: string
  shareResultTitle?: string
  copyLinkButton?: string
  shareButton?: string
  inviteFriendsButton?: string
  
  // Win/Loss texts
  defeatIcon?: string
  defeatTitle?: string
  trialModeIndicator?: string
  yourGoalsLabel?: string
  opponentGoalsLabel?: string
  visitorWinMessage?: string
  drawIcon?: string
  drawMessage?: string
  visitorPenaltyWinMessage?: string
  victoryIcon?: string
  victoryTitle?: string
  homeWinMessage?: string
}

interface PenaltyColors {
  // Background colors
  pageBackground?: string
  blockBackground?: string
  
  // Button colors
  primaryButton?: string
  secondaryButton?: string
  
  // Game field colors
  homeScoreCard?: string
  visitorScoreCard?: string
  gameField?: string
  playerCard?: string
  failedPenalty?: string
}

interface PenaltyHexaProps {
  players: PenaltyCard[]
  onFlip?: (playerId: string) => Promise<GameOutcome>
  onResult?: (result: GameOutcome) => void
  onScoreUpdate?: (homeScore: number, visitorScore: number) => void
  disabled?: boolean
  maxFlipsPerAttempt?: number
  attemptsRemaining?: number
  maxFlipsPerRound?: number
  maxRounds?: number
  theme?: 'default' | 'colorful' | 'football'
  gameId?: string
  isTrialMode?: boolean
  referralUuid?: string | null
  customTexts?: Partial<PenaltyTexts>
  customColors?: Partial<PenaltyColors>
}

// Game state interface for useReducer
interface GameState {
  players: PenaltyCard[]
  flipsUsed: number
  goalsScored: number
  totalGoals: number
  currentRound: number
  isGameComplete: boolean
  gameResult: GameOutcome | null
  opponentScore: number
}

// Action types for game state management
type GameAction = 
  | { type: 'INITIALIZE_GAME'; payload: { players: PenaltyCard[]; totalGoals: number } }
  | { type: 'FLIP_PLAYER'; payload: { playerId: string } }
  | { type: 'FLIP_BACK_PLAYERS'; payload: { playerIds: string[] } }
  | { type: 'START_NEW_ROUND' }
  | { type: 'COMPLETE_GAME'; payload: { result: GameOutcome } }
  | { type: 'RESET_GAME' }

// Session-selected 11 active axial coords from a random #soccer map (fallback to default 11)
// WHAT: Use Hexa Creator maps tagged "soccer" to position the 11 penalty players.
// WHY: Product requirement to align Penalty hex positions with curated maps.
const DEFAULT_FORMATION: Array<[number, number]> = [
  [-1, -1], [-2, 1], [-1, 0], [0, -1], [1, -2],
  [-1, 1], [0, 0], [1, -1], [0, 1], [1, 0], [1, 1]
]

// Selected axial coordinates for this session and selected map id (for audit/traceability)
const SELECT_KEY_PREFIX = 'playmass:penalty:sel'

// Ultra-fast game state reducer - PENALTY SHOOTOUT IMPLEMENTATION
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...state,
        players: action.payload.players,
        totalGoals: action.payload.totalGoals,
        flipsUsed: 0,
        goalsScored: 0,
        currentRound: 1,
        isGameComplete: false,
        gameResult: null,
        opponentScore: 0 // Start with 0, calculate round-based
      }
      
    case 'FLIP_PLAYER':
      const { playerId } = action.payload
      const player = state.players.find(p => p.id === playerId)
      if (!player || player.isRevealed) return state
      
      const updatedPlayers = state.players.map(p => 
        p.id === playerId ? { ...p, isRevealed: true } : p
      )
      const newGoalsScored = player.hasGoal ? state.goalsScored + 1 : state.goalsScored
      const newFlipsUsed = state.flipsUsed + 1
      
      // Calculate visitor score after each user attempt (round-based)
      // 60% chance visitor scores on each attempt
      const visitorScores = Math.random() < 0.6
      const newOpponentScore = visitorScores ? state.opponentScore + 1 : state.opponentScore
      
      return {
        ...state,
        players: updatedPlayers,
        flipsUsed: newFlipsUsed,
        goalsScored: newGoalsScored,
        opponentScore: newOpponentScore
      }
      
    case 'FLIP_BACK_PLAYERS':
      const { playerIds } = action.payload
      return {
        ...state,
        players: state.players.map(p => 
          playerIds.includes(p.id) ? { ...p, isRevealed: false } : p
        )
      }
      
    case 'START_NEW_ROUND':
      return {
        ...state,
        players: state.players.map(p => ({ ...p, isRevealed: false })),
        flipsUsed: 0,
        goalsScored: 0,
        currentRound: state.currentRound + 1,
        opponentScore: Math.floor(Math.random() * 6) // New random opponent score
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
        players: state.players.map(p => ({ ...p, isRevealed: false })),
        flipsUsed: 0,
        goalsScored: 0,
        currentRound: 1,
        isGameComplete: false,
        gameResult: null,
        opponentScore: Math.floor(Math.random() * 6)
      }
      
    default:
      return state
  }
}

/**
 * PenaltyHexa Component - BASED ON STARS_HEXA ARCHITECTURE
 * 
 * PERFORMANCE FEATURES (COPIED FROM STARS_HEXA):
 * - Pre-generated player cards (all DOM elements ready on mount)
 * - Parallel click support (no debouncing or blocking)
 * - Lightning-fast 200ms animations
 * - Auto-flip back mechanism (1 second delay for non-matching cards)
 * - Hardware-accelerated CSS transforms
 * - Optimized state management with useReducer
 * - No network calls blocking UI updates
 * 
 * GAME RULES (PENALTY ADAPTATION):
 * - 5 flips per round (penalty kicks), 3 rounds total
 * - Player must score more goals than opponent to win
 * - Cards auto-flip back after 1 second if round not complete
 * - Hexagons positioned in EXACT SAME 2-3-2 formation as STARS_HEXA
 */
export default function PenaltyHexa({
  players,
  onFlip,
  onResult,
  onScoreUpdate,
  disabled = false,
  maxFlipsPerAttempt = 5, // 5 penalty kicks per round
  attemptsRemaining = 3,
  maxFlipsPerRound = 5,
  maxRounds = 3,
  theme = 'football',
  gameId,
  isTrialMode = false,
  referralUuid,
  customTexts = {},
  customColors = {}
}: PenaltyHexaProps) {
  const router = useRouter()
  const params = useParams()
  
  // Configuration values (EXACT COPY FROM STARS_HEXA)
  const flipsPerRound = maxFlipsPerAttempt || maxFlipsPerRound
  const totalRounds = attemptsRemaining || maxRounds
  
  // Optimized game state with useReducer for batched updates (EXACT COPY FROM STARS_HEXA)
  const [gameState, dispatch] = useReducer(gameReducer, {
    players: [],
    flipsUsed: 0,
    goalsScored: 0,
    totalGoals: 0,
    currentRound: 1,
    isGameComplete: false,
    gameResult: null,
    opponentScore: 0
  })

  // Session-selected active axial coordinates for this game
  const [selectedAxial, setSelectedAxial] = useState<Array<[number, number]>>(DEFAULT_FORMATION)
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)

  // Layout state for hexagon positioning (EXACT COPY FROM STARS_HEXA)
  const stageRef = useRef<HTMLDivElement>(null)
  const [hexWidth, setHexWidth] = useState(120)
  const [scale, setScale] = useState(1)

  // Auto-flip back timer for non-matching cards (EXACT COPY FROM STARS_HEXA)
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Shuffle utility - used only at game start (EXACT COPY FROM STARS_HEXA)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Initialize game - shuffle positions and assign goals (ADAPTED FOR 11 PENALTY PLAYERS)
  const initializeGame = (originalPlayers: PenaltyCard[]) => {
    const allNumbers = originalPlayers.map(p => p.playerNumber || (Math.floor(Math.random() * 21) + 2))
    const shuffledNumbers = shuffleArray(allNumbers)
    const goalsCount = 7 // 7 goals out of 11 hexagons for penalty kicks (as per configuration)
    const goalPositions = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, goalsCount)
    
    // Pre-generate all 11 cards immediately - no lazy loading (EXACT PATTERN FROM STARS_HEXA)
    return originalPlayers.map((originalPlayer, index) => ({
      id: originalPlayer.id,
      playerNumber: shuffledNumbers[index],
      hasGoal: goalPositions.includes(index),
      isRevealed: false, // All cards start face-down but are fully generated
      position: index,
      color: originalPlayer.color,
      backgroundColor: originalPlayer.backgroundColor
    }))
  }

  // Initialize game when players change - immediate full generation (EXACT COPY FROM STARS_HEXA)
  useEffect(() => {
    // Only initialize if players exist and game is not already initialized
    if (players.length > 0 && gameState.players.length === 0) {
      const initialState = initializeGame(players)
      
      dispatch({
        type: 'INITIALIZE_GAME',
        payload: {
          players: initialState,
          totalGoals: 7 // 7 possible goals in penalty shootout (as per configuration)
        }
      })
    }
  }, [players, gameState.players.length])

  // Select 11 highlighted positions from random #soccer map (session-stable)
  useEffect(() => {
    const selectSoccerMap = async () => {
      try {
        const gid = (gameId || (params.gameId as string))
        const sidKeyBase = `playmass:session:${gid}`
        let sessionId = 'trial'
        try {
          const raw = localStorage.getItem(sidKeyBase)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.sessionId) sessionId = parsed.sessionId
          }
        } catch {}
        const selKey = `${SELECT_KEY_PREFIX}:${gid}:${sessionId}`
        const existing = localStorage.getItem(selKey)
        if (existing) {
          const parsed = JSON.parse(existing)
          if (Array.isArray(parsed?.coords) && parsed.coords.length === 11) {
            setSelectedAxial(parsed.coords)
            setSelectedMapId(parsed.mapId || null)
            return
          }
        }

        // Fetch a random active #soccer map
        const res = await fetch(`/api/hexmaps/random?tag=soccer`, { cache: 'no-store' })
        let coords: Array<[number, number]>
        let mapId: string | null = null
        if (res.ok) {
          const data = await res.json()
          const all: Array<{ q: number; r: number }> = data?.data?.coords || []
          mapId = data?.data?._id || null
          const shuffled = [...all]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          if (shuffled.length >= 11) {
            coords = shuffled.slice(0, 11).map(c => [c.q, c.r]) as Array<[number, number]>
          } else {
            coords = DEFAULT_FORMATION
          }
        } else {
          coords = DEFAULT_FORMATION
          mapId = null
        }
        setSelectedAxial(coords)
        setSelectedMapId(mapId)
        const gid2 = (gameId || (params.gameId as string))
        const selKey2 = `${SELECT_KEY_PREFIX}:${gid2}:${sessionId}`
        localStorage.setItem(selKey2, JSON.stringify({ mapId, coords }))
      } catch (e) {
        // On failure, simply keep DEFAULT_FORMATION
        setSelectedAxial(DEFAULT_FORMATION)
        setSelectedMapId(null)
      }
    }
    selectSoccerMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update parent component with score changes - FIXED: Remove onScoreUpdate from dependencies to prevent infinite loops
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(gameState.goalsScored, gameState.opponentScore)
    }
  }, [gameState.goalsScored, gameState.opponentScore]) // Remove onScoreUpdate from dependencies

  // Handle round completion and game completion
  useEffect(() => {
    if (gameState.flipsUsed >= flipsPerRound && !gameState.isGameComplete) {
      const revealedCards = gameState.players.filter(p => p.isRevealed)
      
      // Auto-flip back mechanism after 1 second
      if (autoFlipTimerRef.current) {
        clearTimeout(autoFlipTimerRef.current)
      }
      
      autoFlipTimerRef.current = setTimeout(() => {
        const revealedIds = revealedCards.map(p => p.id)
        dispatch({ type: 'FLIP_BACK_PLAYERS', payload: { playerIds: revealedIds } })
      }, 1000)
      
      // Check for game completion
      const homeWon = gameState.goalsScored > gameState.opponentScore
      const isDraw = gameState.goalsScored === gameState.opponentScore
      
      const result: GameOutcome = homeWon ? {
        type: 'WIN',
        hexagonId: 'game-complete',
        starsFound: gameState.goalsScored,
        totalStarsInGame: gameState.totalGoals,
        foundAllStars: true,
        value: `${gameState.goalsScored}-${gameState.opponentScore}`,
        rewardIds: [],
        message: customTexts.homeWinMessage || `HOME won the penalty shootout ${gameState.goalsScored}-${gameState.opponentScore}!`
      } : {
        type: isDraw ? 'LOSE' : 'LOSE',
        hexagonId: 'game-complete',
        starsFound: gameState.goalsScored,
        totalStarsInGame: gameState.totalGoals,
        foundAllStars: false,
        value: `${gameState.goalsScored}-${gameState.opponentScore}`,
        rewardIds: [],
        message: isDraw 
          ? (customTexts.visitorPenaltyWinMessage || `${customTexts.drawIcon || '='} ${customTexts.drawMessage || 'DRAW'} ${gameState.goalsScored}-${gameState.opponentScore} - VISITOR wins on penalties!`)
          : (customTexts.visitorWinMessage || `VISITOR won the penalty shootout ${gameState.goalsScored}-${gameState.opponentScore}`)
      }
      
      // Complete the game after a short delay to show the flipped cards
      setTimeout(() => {
        dispatch({ type: 'COMPLETE_GAME', payload: { result } })
        if (onResult) onResult(result)
      }, 1500) // 1.5 seconds to show results
    }
  }, [gameState.flipsUsed, gameState.goalsScored, gameState.opponentScore, gameState.isGameComplete, gameState.totalGoals, gameState.players, flipsPerRound, onResult])

  // Layout positioning using selected axial coordinates
  const getHexagonPosition = (position: number) => {
    const coord = selectedAxial[position] || [0, 0]
    const [q, r] = coord
    const s = hexWidth // Use hexWidth as the radius
    const x = s * (1.5 * q)
    const y = s * ((SQRT3/2) * q + SQRT3 * r)
    return { x, y }
  }

  // ULTRA-FAST hexagon flip handler - SIMPLIFIED AND FIXED
  const handleHexagonFlip = useCallback((playerId: string) => {
    // Basic validation
    if (disabled || gameState.isGameComplete || gameState.flipsUsed >= flipsPerRound) return
    
    const player = gameState.players.find(p => p.id === playerId)
    if (!player || player.isRevealed) return

    // INSTANT UI UPDATE - let reducer handle ALL logic
    dispatch({ type: 'FLIP_PLAYER', payload: { playerId } })
      
    // Network call runs in background - ONLY for registered mode
    if (onFlip && !isTrialMode) {
      onFlip(playerId).then(result => {
        // In registered mode, use API result if available
        if (onResult) onResult(result)
      }).catch(error => {
        console.warn('Network error:', error)
      })
    }
  }, [disabled, gameState.isGameComplete, gameState.flipsUsed, gameState.players, flipsPerRound, onFlip, onResult, isTrialMode])

  // EXACT math from reference HTML for responsive grid layout
  // Using shared geometry utilities: axialToPixel, rotatePoint, hexVertices, SQRT3

  // Compute rotated bounding box from all selected active hexes (dynamic fit)
  const computeFitBox = (s: number) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [q, r] of selectedAxial) {
      const c = axialToPixel(q, r, s)
      const verts = hexVertices(c.x, c.y, s).map(p => rotatePoint(p.x, p.y))
      verts.forEach(v => {
        if (v.x < minX) minX = v.x
        if (v.x > maxX) maxX = v.x
        if (v.y < minY) minY = v.y
        if (v.y > maxY) maxY = v.y
      })
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
  }

  // Layout calculation - EXACT responsive fit algorithm from reference
  useEffect(() => {
    const updateLayout = () => {
      if (!stageRef.current) return
      
      const containerRect = stageRef.current.getBoundingClientRect()
      const vw = containerRect.width || 800
      const vh = containerRect.height || 600
      const margin = 0.96 // small breathing room - EXACT from reference

      // Start with a convenient radius, then scale to fit exact bounds - EXACT from reference
      const s0 = Math.max(20, Math.min(vw, vh) / 10)
      const box0 = computeFitBox(s0)
      const scaleCalc = Math.min((vw * margin) / box0.w, (vh * margin) / box0.h)
      const s = s0 * scaleCalc

      setHexWidth(s)
      setScale(1) // No additional scaling needed - built into s calculation
    }
    
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  // EXACT SAME redirect logic as STARS_HEXA but with penalty parameters
  useEffect(() => {
    if (gameState.isGameComplete) {
      const targetGameId = gameId || params.gameId as string
      if (targetGameId) {
        const resultParams = new URLSearchParams({
          won: (gameState.goalsScored > gameState.opponentScore).toString(),
          userScore: gameState.goalsScored.toString(),
          opponentScore: gameState.opponentScore.toString(),
          rounds: gameState.currentRound.toString(),
          ...(isTrialMode && { trial: 'true' }),
          ...(referralUuid && { ref: referralUuid })
        })
        
        // IMMEDIATE redirect - no delay for flash gaming experience (EXACT COPY FROM STARS_HEXA)
        router.push(`/play/${targetGameId}/result?${resultParams.toString()}`)
      }
    }
  }, [gameState.isGameComplete, gameState.goalsScored, gameState.opponentScore, gameState.currentRound, gameId, params.gameId, isTrialMode, referralUuid, router])

  // Generate honeycomb grid like reference HTML - EXACT implementation
  const renderHoneycombGrid = () => {
    if (!stageRef.current) return null
    
    const containerRect = stageRef.current.getBoundingClientRect()
    const vw = containerRect.width || 800
    const vh = containerRect.height || 600
    const s = hexWidth
    
    // Recompute with final s to center accurately - EXACT from reference
    const box = computeFitBox(s)
    const bx = (box.minX + box.maxX) / 2
    const by = (box.minY + box.maxY) / 2
    const offsetX = vw / 2 - bx
    const offsetY = vh / 2 - by
    
    // Build a sufficiently large grid area - EXACT from reference
    const xStep = 1.5 * s
    const yStep = SQRT3 * s
    const cols = Math.ceil(vw / xStep) + 8
    const rows = Math.ceil(vh / (yStep / 2)) + 8
    const qMin = -Math.ceil(cols / 2), qMax = Math.ceil(cols / 2)
    const rMin = -Math.ceil(rows / 4), rMax = Math.ceil(rows / 4)
    
    const strokeW = Math.max(1, s * 0.06)
    const fontSize = Math.max(12, s * 0.55)
    
    const hexagons = []
    
    // Build a lookup map for highlighted positions: "q,r" -> player index
    const highlightsMap = new Map<string, number>()
    selectedAxial.forEach((coord, idx) => highlightsMap.set(`${coord[0]},${coord[1]}`, idx))

    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        // center before rotation - EXACT from reference
        const c = axialToPixel(q, r, s)
        // rotate each vertex, then offset to screen center - EXACT from reference
        const verts = hexVertices(c.x, c.y, s).map(p => {
          const rr = rotatePoint(p.x, p.y)
          return { x: rr.x + offsetX, y: rr.y + offsetY }
        })
        
        // quick cull - EXACT from reference
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        verts.forEach(v => {
          if (v.x < minX) minX = v.x
          if (v.x > maxX) maxX = v.x
          if (v.y < minY) minY = v.y
          if (v.y > maxY) maxY = v.y
        })
        if (maxX < -s || minX > vw + s || maxY < -s || minY > vh + s) continue
        
        const key = `${q},${r}`
        const isHighlighted = highlightsMap.has(key)
        const playerIndex = highlightsMap.get(key)
        const player = isHighlighted && playerIndex !== undefined ? gameState.players[playerIndex] : null
        const isClickable = isHighlighted && player && !disabled && !gameState.isGameComplete && 
                           gameState.flipsUsed < flipsPerRound && !player.isRevealed
        
        // Calculate center for text placement - EXACT from reference
        const cx = (verts[0].x + verts[1].x + verts[2].x + verts[3].x + verts[4].x + verts[5].x) / 6
        const cy = (verts[0].y + verts[1].y + verts[2].y + verts[3].y + verts[4].y + verts[5].y) / 6
        
        hexagons.push(
          <g key={key}>
            {/* Hexagon shape */}
            {isHighlighted && player ? (
              // Interactive hexagon for players
              <g
                style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
                onClick={isClickable ? () => handleHexagonFlip(player.id) : undefined}
              >
                {/* Front face (when not revealed) or back face (when revealed) */}
                <polygon
                  points={verts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={player.isRevealed 
                    ? (player.hasGoal ? (customColors.playerCard || '#c00000') : (customColors.failedPenalty || '#ffffff'))
                    : (customColors.playerCard || '#c00000')
                  }
                  stroke="#ffffff"
                  strokeWidth={strokeW}
                  style={{
                    transition: 'fill 200ms ease-out',
                    transform: player.isRevealed ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`
                  }}
                />
                
                {/* Player jersey numbers */}
                <text
                  x={cx}
                  y={cy}
                  fill={player.isRevealed 
                    ? (player.hasGoal ? '#ffffff' : '#000000') // White text on red background, black text on white background
                    : '#ffffff' // White text on red background for unrevealed players
                  }
                  fontSize={fontSize * 1.2}
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {player.isRevealed 
                    ? (player.hasGoal ? '⚽' : '❌') // Show result when revealed
                    : player.playerNumber // Show jersey number for unrevealed players
                  }
                </text>
              </g>
            ) : (
              // Background hexagon (non-interactive)
              <polygon
                points={verts.map(p => `${p.x},${p.y}`).join(' ')}
                fill={customColors.gameField || '#2ecc71'}
                stroke="#ffffff"
                strokeWidth={strokeW}
              />
            )}
          </g>
        )
      }
    }
    
    return hexagons
  }
  
  return (
    // Container with grass green solid background - MAXIMIZED
    <div 
      ref={stageRef}
      className="relative w-full h-full"
      style={{
        minHeight: '100%',
        backgroundColor: customColors.gameField || '#2ecc71'
      }}
    >
      {/* SVG Honeycomb Grid - EXACT like reference HTML */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      >
        {renderHoneycombGrid()}
      </svg>
    </div>
  )
}
