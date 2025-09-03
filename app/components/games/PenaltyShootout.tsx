'use client'

import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PenaltyCard, GameOutcome } from '../../types'

interface PenaltyShootoutProps {
  players: PenaltyCard[]
  onFlip?: (playerId: string) => Promise<GameOutcome>
  onResult?: (result: GameOutcome) => void
  disabled?: boolean
  theme?: 'default' | 'colorful' | 'football'
  gameId?: string
  isTrialMode?: boolean
}

// Game state interface for useReducer
interface PenaltyGameState {
  players: PenaltyCard[]
  selectedPlayers: string[]
  userScore: number
  opponentScore: number
  isGameComplete: boolean
  gameResult: GameOutcome | null
  currentRound: number
  isOvertime: boolean
  roundResults: {
    userGoals: number
    opponentGoals: number
    selectedPlayerIds: string[]
  }[]
}

// Action types for penalty game state management
type PenaltyGameAction = 
  | { type: 'INITIALIZE_GAME'; payload: { players: PenaltyCard[] } }
  | { type: 'SELECT_PLAYER'; payload: { playerId: string } }
  | { type: 'COMPLETE_ROUND'; payload: { userGoals: number; opponentGoals: number; selectedIds: string[] } }
  | { type: 'START_OVERTIME' }
  | { type: 'COMPLETE_GAME'; payload: { result: GameOutcome } }
  | { type: 'RESET_GAME' }

// Ultra-fast penalty game state reducer
const penaltyGameReducer = (state: PenaltyGameState, action: PenaltyGameAction): PenaltyGameState => {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...state,
        players: action.payload.players,
        selectedPlayers: [],
        userScore: 0,
        opponentScore: 0,
        currentRound: 1,
        isGameComplete: false,
        gameResult: null,
        isOvertime: false,
        roundResults: []
      }
      
    case 'SELECT_PLAYER':
      const { playerId } = action.payload
      const isSelected = state.selectedPlayers.includes(playerId)
      
      if (isSelected) {
        // Deselect player
        return {
          ...state,
          selectedPlayers: state.selectedPlayers.filter(id => id !== playerId),
          players: state.players.map(p => 
            p.id === playerId ? { ...p, isRevealed: false } : p
          )
        }
      } else if (state.selectedPlayers.length < 5) {
        // Select player (max 5)
        return {
          ...state,
          selectedPlayers: [...state.selectedPlayers, playerId],
          players: state.players.map(p => 
            p.id === playerId ? { ...p, isRevealed: true } : p
          )
        }
      }
      return state
      
    case 'COMPLETE_ROUND':
      const { userGoals, opponentGoals, selectedIds } = action.payload
      const newRoundResults = [...state.roundResults, { userGoals, opponentGoals, selectedPlayerIds: selectedIds }]
      const newUserScore = state.userScore + userGoals
      const newOpponentScore = state.opponentScore + opponentGoals
      
      return {
        ...state,
        userScore: newUserScore,
        opponentScore: newOpponentScore,
        roundResults: newRoundResults,
        selectedPlayers: [],
        players: state.players.map(p => ({ ...p, isRevealed: false }))
      }
      
    case 'START_OVERTIME':
      return {
        ...state,
        isOvertime: true,
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
        selectedPlayers: [],
        userScore: 0,
        opponentScore: 0,
        currentRound: 1,
        isGameComplete: false,
        gameResult: null,
        isOvertime: false,
        roundResults: [],
        players: state.players.map(p => ({ ...p, isRevealed: false }))
      }
      
    default:
      return state
  }
}

/**
 * PenaltyShootout Component - Football Penalty Shootout Game
 * 
 * GAME MECHANICS:
 * - 11 hexagons in 1-4-3-2-1 formation (like football team formation)
 * - Player selects 5 players for penalties
 * - 7 hexagons contain goals, 4 contain misses
 * - Opponent shoots random 1-5 goals
 * - If draw, goes to sudden death overtime
 * - Uses same centralized layout as Stars Hexa
 * 
 * FORMATION LAYOUT:
 *     [0]
 * [1][2][3][4]
 *  [5][6][7]
 *   [8][9]
 *    [10]
 */
export default function PenaltyShootout({
  players,
  onFlip,
  onResult,
  disabled = false,
  theme = 'default',
  gameId,
  isTrialMode = false
}: PenaltyShootoutProps) {
  const router = useRouter()
  const params = useParams()
  
  // Optimized game state with useReducer for batched updates
  const [gameState, dispatch] = useReducer(penaltyGameReducer, {
    players: [],
    selectedPlayers: [],
    userScore: 0,
    opponentScore: 0,
    isGameComplete: false,
    gameResult: null,
    currentRound: 1,
    isOvertime: false,
    roundResults: []
  })
  
  // Layout state for hexagon positioning
  const stageRef = useRef<HTMLDivElement>(null)
  const [hexWidth, setHexWidth] = useState(100)
  const [scale, setScale] = useState(1)

  // Shuffle utility for randomizing goal distribution
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Generate random player numbers (2-22)
  const generateRandomPlayerNumbers = () => {
    const availableNumbers = Array.from({ length: 21 }, (_, i) => i + 2) // 2-22
    return shuffleArray(availableNumbers).slice(0, 11)
  }

  // Initialize game - set up players with random numbers and goal distribution
  const initializeGame = (originalPlayers: PenaltyCard[]) => {
    const playerNumbers = generateRandomPlayerNumbers()
    const goalPositions = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 7) // 7 goals, 4 misses
    
    return originalPlayers.map((player, index) => ({
      ...player,
      playerNumber: playerNumbers[index],
      hasGoal: goalPositions.includes(index),
      isRevealed: false,
      position: index
    }))
  }

  // Initialize game when players change
  useEffect(() => {
    if (players.length > 0) {
      const initialState = initializeGame(players)
      dispatch({
        type: 'INITIALIZE_GAME',
        payload: { players: initialState }
      })
    }
  }, [players])

  // Get hexagon position based on 1-4-3-2-1 formation
  const getHexagonPosition = (position: number) => {
    // Formation coordinates for 11 players - proper honeycomb spacing
    // For touching hexagons: horizontal spacing = hexWidth * 0.75, vertical spacing = hexHeight * 0.5
    const hexHeight = hexWidth * 0.866 // height = width * sqrt(3)/2
    const horizontalSpacing = hexWidth * 0.75 // 3/4 of width for touching hexagons
    const verticalSpacing = hexHeight * 0.5   // half height for touching rows
    
    const formations = [
      { x: 0, y: -verticalSpacing * 4 },                           // 0: Top center
      { x: -horizontalSpacing * 1.5, y: -verticalSpacing * 2 },   // 1: Second row left
      { x: -horizontalSpacing * 0.5, y: -verticalSpacing * 2 },   // 2: Second row center-left  
      { x: horizontalSpacing * 0.5, y: -verticalSpacing * 2 },    // 3: Second row center-right
      { x: horizontalSpacing * 1.5, y: -verticalSpacing * 2 },    // 4: Second row right
      { x: -horizontalSpacing, y: 0 },                             // 5: Third row left
      { x: 0, y: 0 },                                              // 6: Third row center
      { x: horizontalSpacing, y: 0 },                              // 7: Third row right
      { x: -horizontalSpacing * 0.5, y: verticalSpacing * 2 },    // 8: Fourth row left
      { x: horizontalSpacing * 0.5, y: verticalSpacing * 2 },     // 9: Fourth row right
      { x: 0, y: verticalSpacing * 4 }                             // 10: Bottom center
    ]
    
    return formations[position] || { x: 0, y: 0 }
  }

  // Handle player selection for penalty shootout
  const handlePlayerSelect = useCallback((playerId: string) => {
    if (disabled || gameState.isGameComplete) return
    
    dispatch({ type: 'SELECT_PLAYER', payload: { playerId } })
  }, [disabled, gameState.isGameComplete])

  // Execute penalty shootout when 5 players selected
  const executePenaltyShootout = useCallback(() => {
    if (gameState.selectedPlayers.length !== 5) return
    
    // Calculate user goals from selected players
    const selectedPlayerObjects = gameState.players.filter(p => gameState.selectedPlayers.includes(p.id))
    const userGoals = selectedPlayerObjects.filter(p => p.hasGoal).length
    
    // Generate opponent goals (random 0-5)
    const opponentGoals = Math.floor(Math.random() * 6) // 0 to 5 goals
    
    // Complete round
    dispatch({
      type: 'COMPLETE_ROUND',
      payload: {
        userGoals,
        opponentGoals,
        selectedIds: gameState.selectedPlayers
      }
    })
    
    // Determine game outcome
    setTimeout(() => {
      const finalUserScore = gameState.userScore + userGoals
      const finalOpponentScore = gameState.opponentScore + opponentGoals
      
      if (finalUserScore === finalOpponentScore) {
        // Draw - go to overtime
        dispatch({ type: 'START_OVERTIME' })
      } else {
        // Determine winner
        const won = finalUserScore > finalOpponentScore
        const result: GameOutcome = {
          type: won ? 'WIN' : 'LOSE',
          starsFound: finalUserScore,
          totalStarsInGame: 5,
          foundAllStars: won,
          value: `${finalUserScore}-${finalOpponentScore}`,
          rewardIds: [],
          message: won 
            ? `🎉 You won the penalty shootout ${finalUserScore}-${finalOpponentScore}!`
            : `😞 You lost the penalty shootout ${finalUserScore}-${finalOpponentScore}`
        }
        
        dispatch({ type: 'COMPLETE_GAME', payload: { result } })
        if (onResult) onResult(result)
      }
      
      // Network call for backend
      if (onFlip && gameState.selectedPlayers[0]) {
        onFlip(gameState.selectedPlayers[0]).then(result => {
          if (onResult) onResult(result)
        }).catch(error => {
          console.warn('Network error:', error)
        })
      }
    }, 1000)
  }, [gameState, onFlip, onResult])

  // Auto-execute when 5 players selected
  useEffect(() => {
    if (gameState.selectedPlayers.length === 5) {
      setTimeout(() => {
        executePenaltyShootout()
      }, 500) // Small delay for visual feedback
    }
  }, [gameState.selectedPlayers.length, executePenaltyShootout])

  // Layout calculation for responsive hexagons
  useEffect(() => {
    const updateLayout = () => {
      if (!stageRef.current) return
      
      const containerRect = stageRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width || 800
      const containerHeight = containerRect.height || 600
      const margin = 0.9
      
      // Calculate optimal size for 11 hexagon formation
      const W_w = (containerWidth * margin) / 4 // Based on widest row (4 hexagons)
      const W_h = (containerHeight * margin) / 5 // Based on 5 rows
      let W = Math.floor(Math.min(W_w, W_h))
      if (W < 60) W = 60
      if (W > 100) W = 100
      
      setHexWidth(W)
      
      const estimatedWidth = W * 4
      const estimatedHeight = W * 5
      const scaleW = (containerWidth * margin) / estimatedWidth
      const scaleH = (containerHeight * margin) / estimatedHeight
      const finalScale = Math.min(scaleW, scaleH, 1)
      
      setScale(finalScale)
    }
    
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  // Redirect to results when game completes
  useEffect(() => {
    if (gameState.isGameComplete) {
      const targetGameId = gameId || params.gameId as string
      if (targetGameId) {
        const resultParams = new URLSearchParams({
          won: (gameState.userScore > gameState.opponentScore).toString(),
          userScore: gameState.userScore.toString(),
          opponentScore: gameState.opponentScore.toString(),
          rounds: gameState.currentRound.toString(),
          ...(isTrialMode && { trial: 'true' })
        })
        
        // Redirect to results
        router.push(`/play/${targetGameId}/result?${resultParams.toString()}`)
      }
    }
  }, [gameState.isGameComplete, gameState.userScore, gameState.opponentScore, gameState.currentRound, gameId, params.gameId, isTrialMode, router])

  return (
    <div 
      ref={stageRef}
      className="relative w-full h-full grid place-items-center bg-white/5 backdrop-blur-sm rounded-2xl p-8"
      style={{
        minHeight: '600px',
        background: 'radial-gradient(800px 600px at 50% 50%, #1a4c2b 0%, #0f2916 50%, #0a1f0f 100%)' // Football green gradient
      }}
    >
      {/* Score display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-900 px-6 py-3 rounded-lg font-bold">
        <div className="text-center">
          <div className="text-lg">⚽ PENALTY SHOOTOUT</div>
          <div className="text-xl mt-1">
            YOU {gameState.userScore} - {gameState.opponentScore} OPPONENT
          </div>
          {gameState.isOvertime && (
            <div className="text-sm text-orange-600 mt-1">🔥 SUDDEN DEATH</div>
          )}
        </div>
      </div>

      {/* Selection counter */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-blue-500/20 backdrop-blur text-white px-4 py-2 rounded-lg border border-blue-400">
        <div className="text-center text-sm">
          ⚽ Select 5 players: {gameState.selectedPlayers.length}/5
        </div>
      </div>

      <div 
        className="relative"
        style={{
          width: 0,
          height: 0,
          transformOrigin: '0 0',
          transform: `scale(${scale})`,
        }}
      >
        <section className="relative" style={{ width: 0, height: 0 }}>
          {gameState.players.map((player) => {
            const position = getHexagonPosition(player.position)
            const isSelected = gameState.selectedPlayers.includes(player.id)
            const isClickable = !disabled && !gameState.isGameComplete && 
                               (gameState.selectedPlayers.length < 5 || isSelected)
            
            return (
              <button
                key={player.id}
                type="button"
                className={`absolute border-none bg-transparent p-0 ${ 
                  isClickable 
                    ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-75' 
                    : 'cursor-not-allowed'
                }`}
                style={{
                  width: `${hexWidth}px`,
                  height: `${hexWidth * 0.8660254037844386}px`,
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'translate(-50%, -50%) rotate(30deg)',
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  willChange: 'transform'
                }}
                onClick={() => handlePlayerSelect(player.id)}
                disabled={!isClickable}
              >
                {/* Hexagon shape container */}
                <div className="w-full h-full relative">
                  <div 
                    className={`w-full h-full transition-all duration-200 ${
                      isSelected ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    {/* Hexagon face */}
                    <div 
                      className={`absolute inset-0 border-3 box-border ${
                        isSelected 
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-500 to-orange-600' 
                          : 'border-green-400 bg-gradient-to-br from-green-500 to-green-700'
                      }`}
                      style={{
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                      }}
                    >
                      <div className="absolute inset-0 grid place-items-center p-2" style={{ transform: 'rotate(-30deg)' }}>
                        <div className="text-center text-white font-bold">
                          <div className="text-lg">#{player.playerNumber}</div>
                          {isSelected && (
                            <div className="text-xs mt-1">
                              {player.hasGoal ? '⚽ GOAL' : '❌ MISS'}
                            </div>
                          )}
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
        <div className="absolute bottom-4 right-4 bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm">
          {gameState.userScore > gameState.opponentScore ? '🎉 YOU WON!' : '💀 YOU LOST!'}
        </div>
      )}
    </div>
  )
}
