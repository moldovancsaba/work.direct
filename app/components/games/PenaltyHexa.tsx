'use client'

import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PenaltyCard, GameOutcome } from '../../types'

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

// EXACT coordinates from reference HTML - the 11 highlighted hexagons (numbered 1-11)
const HIGHLIGHT_LIST = [
  [-1, -1], [-2, 1], [-1, 0], [0, -1], [1, -2],
  [-1, 1], [0, 0], [1, -1], [0, 1], [1, 0], [1, 1]
]

// Create map for fast lookup: "q,r" -> player number (1-11)
const HIGHLIGHTS = new Map(HIGHLIGHT_LIST.map((coord, idx) => [`${coord[0]},${coord[1]}`, idx]))

// Boundaries for responsive fit (from reference HTML)
const FIT_TOP: [number, number] = [-1, -1]
const FIT_BOTTOM: [number, number] = [1, 1]
const FIT_LEFT: [number, number] = [-2, 2]
const FIT_RIGHT: [number, number] = [2, -2]

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
  referralUuid
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
    if (players.length > 0) {
      const initialState = initializeGame(players)
      dispatch({
        type: 'INITIALIZE_GAME',
        payload: {
          players: initialState,
          totalGoals: 7 // 7 possible goals in penalty shootout (as per configuration)
        }
      })
    }
  }, [players])

  // Update parent component with score changes
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(gameState.goalsScored, gameState.opponentScore)
    }
  }, [gameState.goalsScored, gameState.opponentScore, onScoreUpdate])

  // Layout positioning using EXACT axial coordinates from football formation reference
  const getHexagonPosition = (position: number) => {
    // EXACT coordinates from reference HTML - proper football formation
    const axialCoords = [
      [-1, -1], // Position 0 - Player #1
      [-2,  1], // Position 1 - Player #2  
      [-1,  0], // Position 2 - Player #3
      [ 0, -1], // Position 3 - Player #4
      [ 1, -2], // Position 4 - Player #5
      [-1,  1], // Position 5 - Player #6
      [ 0,  0], // Position 6 - Player #7 (center)
      [ 1, -1], // Position 7 - Player #8
      [ 0,  1], // Position 8 - Player #9
      [ 1,  0], // Position 9 - Player #10
      [ 1,  1]  // Position 10 - Player #11
    ]
    
    const coord = axialCoords[position] || [0, 0]
    const [q, r] = coord
    const s = hexWidth // Use hexWidth as the radius
    const SQRT3 = Math.sqrt(3)
    
    // EXACT axial to pixel conversion from reference (flat-top BEFORE rotation)
    const x = s * (1.5 * q)
    const y = s * ((SQRT3/2) * q + SQRT3 * r)
    
    return { x, y }
  }

  // ULTRA-FAST hexagon flip handler - EXACT COPY FROM STARS_HEXA WITH PENALTY ADAPTATIONS
  const handleHexagonFlip = useCallback((playerId: string) => {
    // EXACT SAME minimal validation as STARS_HEXA
    if (disabled || gameState.isGameComplete || gameState.flipsUsed >= flipsPerRound) return
    
    const player = gameState.players.find(p => p.id === playerId)
    if (!player || player.isRevealed) return

    // INSTANT UI UPDATE - no waiting, pure speed (EXACT COPY FROM STARS_HEXA)
    dispatch({ type: 'FLIP_PLAYER', payload: { playerId } })

    // Calculate game logic in parallel with animation (ADAPTED FROM STARS_HEXA)
    setTimeout(() => {
      const updatedPlayers = gameState.players.map(p => 
        p.id === playerId ? { ...p, isRevealed: true } : p
      )
      const revealedCards = updatedPlayers.filter(p => p.isRevealed)
      const newFlipsUsed = gameState.flipsUsed + 1
      const newGoalsScored = player.hasGoal ? gameState.goalsScored + 1 : gameState.goalsScored
      const roundComplete = newFlipsUsed >= flipsPerRound

      // Auto-flip back mechanism - EXACT SAME as STARS_HEXA but adapted for penalty rounds
      if (roundComplete) {
        // Clear any existing timer
        if (autoFlipTimerRef.current) {
          clearTimeout(autoFlipTimerRef.current)
        }
        
        // 1-second auto-flip back timer EXACT SAME as STARS_HEXA
        autoFlipTimerRef.current = setTimeout(() => {
          const revealedIds = revealedCards.map(p => p.id)
          dispatch({ type: 'FLIP_BACK_PLAYERS', payload: { playerIds: revealedIds } })
        }, 1000) // Exactly 1 second like STARS_HEXA
      }
      
      // Handle penalty shootout completion - complete after first round of 5 kicks
      if (roundComplete) {
        // Use the current opponent score without additional random calculation
        // The opponent score is already calculated during each user flip
        const finalOpponentScore = gameState.opponentScore
        
        // HOME wins only if score is higher, VISITOR wins on draw or higher score
        const homeWon = newGoalsScored > finalOpponentScore
        const isDraw = newGoalsScored === finalOpponentScore
        
        const result: GameOutcome = homeWon ? {
          type: 'WIN',
          hexagonId: playerId,
          starsFound: newGoalsScored,
          totalStarsInGame: gameState.totalGoals,
          foundAllStars: true,
          value: `${newGoalsScored}-${finalOpponentScore}`,
          rewardIds: [],
          message: `⚽ HOME won the penalty shootout ${newGoalsScored}-${finalOpponentScore}!`
        } : {
          type: isDraw ? 'LOSE' : 'LOSE', // In penalty shootouts, draws are treated as losses for the user
          hexagonId: playerId,
          starsFound: newGoalsScored,
          totalStarsInGame: gameState.totalGoals,
          foundAllStars: false,
          value: `${newGoalsScored}-${finalOpponentScore}`,
          rewardIds: [],
          message: isDraw 
            ? `🎆 DRAW ${newGoalsScored}-${finalOpponentScore} - VISITOR wins on penalties!`
            : `💀 VISITOR won the penalty shootout ${newGoalsScored}-${finalOpponentScore}`
        }
        
        dispatch({ type: 'COMPLETE_GAME', payload: { result } })
        if (onResult) onResult(result)
      }
      
      // Network call runs in background - EXACT COPY FROM STARS_HEXA
      // Skip API calls in trial mode - game logic is handled internally
      if (onFlip && !isTrialMode) {
        onFlip(playerId).then(result => {
          // In registered mode, use API result if available
          if (onResult) onResult(result)
        }).catch(error => {
          console.warn('Network error:', error)
        })
      }
    }, 0) // Run immediately but non-blocking - EXACT SAME as STARS_HEXA
  }, [disabled, gameState, flipsPerRound, totalRounds, onFlip, onResult])

  // EXACT math from reference HTML for responsive grid layout
  const DEG = Math.PI / 180
  const ROT = 30 * DEG // rotate hex geometry by +30°
  const cosR = Math.cos(ROT)
  const sinR = Math.sin(ROT)
  const SQRT3 = Math.sqrt(3)

  // axial -> pixel center (flat-top) BEFORE rotation - EXACT from reference
  const axialToPixel = (q: number, r: number, s: number) => {
    const x = s * (1.5 * q)
    const y = s * ((SQRT3/2) * q + SQRT3 * r)
    return { x, y }
  }

  // Rotate a point (x,y) by +30° about the origin - EXACT from reference
  const rot = (x: number, y: number) => {
    return { x: x * cosR - y * sinR, y: x * sinR + y * cosR }
  }

  // Hex vertices around (cx,cy) BEFORE rotation - EXACT from reference
  const hexVertices = (cx: number, cy: number, s: number) => {
    const pts = []
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 // 0,60,...,300 (flat-top)
      pts.push({ x: cx + s * Math.cos(a), y: cy + s * Math.sin(a) })
    }
    return pts
  }

  // Compute rotated extrema box using boundary hexes - EXACT from reference
  const computeFitBox = (s: number) => {
    const rotatedHexExtrema = (q: number, r: number) => {
      const c = axialToPixel(q, r, s)
      const verts = hexVertices(c.x, c.y, s).map(p => rot(p.x, p.y))
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      verts.forEach(v => {
        if (v.x < minX) minX = v.x
        if (v.x > maxX) maxX = v.x
        if (v.y < minY) minY = v.y
        if (v.y > maxY) maxY = v.y
      })
      return { minX, minY, maxX, maxY }
    }

    const top = rotatedHexExtrema(...FIT_TOP)
    const bottom = rotatedHexExtrema(...FIT_BOTTOM)
    const left = rotatedHexExtrema(...FIT_LEFT)
    const right = rotatedHexExtrema(...FIT_RIGHT)

    const minY = Math.min(top.minY, bottom.minY, left.minY, right.minY)
    const maxY = Math.max(top.maxY, bottom.maxY, left.maxY, right.maxY)
    const minX = Math.min(top.minX, bottom.minX, left.minX, right.minX)
    const maxX = Math.max(top.maxX, bottom.maxX, left.maxX, right.maxX)

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
    
    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        // center before rotation - EXACT from reference
        const c = axialToPixel(q, r, s)
        // rotate each vertex, then offset to screen center - EXACT from reference
        const verts = hexVertices(c.x, c.y, s).map(p => {
          const rr = rot(p.x, p.y)
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
        const isHighlighted = HIGHLIGHTS.has(key)
        const playerIndex = HIGHLIGHTS.get(key)
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
                    ? (player.hasGoal ? '#c00000' : '#ffffff') // Blood red for goals, white for misses
                    : '#c00000' // Blood red highlight for players at beginning
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
                fill="#2ecc71" // Grass green background
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
        backgroundColor: '#2ecc71' // Grass green solid background
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
