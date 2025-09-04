'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import StarsHexa from '../../components/games/StarsHexa'
import PenaltyShootout from '../../components/games/PenaltyShootout'
import PenaltyHexa from '../../components/games/PenaltyHexa'
import GameLayout from '../../components/game/GameLayout'
import UnifiedRegistration from '../../components/game/UnifiedRegistration'
import GameRulesPage from '../../components/game/GameRulesPage'
import GameStatus from '../../components/game/GameStatus'
import GameDescription from '../../components/game/GameDescription'
import Toast from '../../components/Toast'
import { Game, GameOutcome, PlayGameResponse, Reward, ParticipantData } from '../../types'

interface Participant {
  name: string
  email?: string
  phone?: string
}

// Utility function to get reward display value
function getRewardDisplayValue(reward: Reward): string {
  switch (reward.type) {
    case 'POINTS':
      const amount = reward.configuration.points?.amount || 0
      const currency = reward.configuration.points?.currency || 'points'
      return `${amount} ${currency}`
      
    case 'COUPON':
      const coupon = reward.configuration.coupon
      if (!coupon) return 'Coupon'
      const discountText = coupon.discountType === 'PERCENTAGE' 
        ? `${coupon.discountValue}% off`
        : `$${coupon.discountValue} off`
      return discountText
      
    case 'PHYSICAL_PRIZE':
      const prize = reward.configuration.physicalPrize
      return prize?.estimatedValue ? `$${prize.estimatedValue}` : 'Prize'
      
    case 'CUSTOM':
      return reward.configuration.custom?.title || 'Custom Reward'
      
    default:
      return 'Reward'
  }
}

/**
 * Game Play Page
 * 
 * Public interface for playing games (Stars Hexa, Penalty Shootout).
 * Features participant registration, game instructions, and results display.
 * Dynamically renders the appropriate game component based on game type.
 * 
 * URL: /play/[gameId]
 */
export default function GamePlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = params.gameId as string
  
  // Extract referral UUID from URL parameters
  const referralUuid = searchParams.get('ref')
  
  // Game state
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Game flow state - 4 steps: registration -> rules -> game -> results
  type GameStep = 'registration' | 'rules' | 'game' | 'results'
  const [currentStep, setCurrentStep] = useState<GameStep>('registration')
  
  // Participant state
  const [participant, setParticipant] = useState<Participant>({ name: '' })
  const [participantUuid, setParticipantUuid] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  
  // Trial mode state
  const [isTrialMode, setIsTrialMode] = useState(false)
  const [trialStarsFound, setTrialStarsFound] = useState(0)
  
  // Game play state
  const [gameResult, setGameResult] = useState<PlayGameResponse | null>(null)
  const [playError, setPlayError] = useState<string | null>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  
  // Penalty shootout score state
  const [penaltyScore, setPenaltyScore] = useState({ home: 0, visitor: 0 })
  
  // Toast notification state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    isVisible: boolean
  } | null>(null)
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
  }
  
  // Hide toast notification
  const hideToast = () => {
    setToast(prev => prev ? { ...prev, isVisible: false } : null)
  }
  
  useEffect(() => {
    if (gameId) {
      loadGame()
    }
  }, [gameId])
  
  const loadGame = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/games/${gameId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load game')
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Game not found')
      }
      
      setGame(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game')
    } finally {
      setLoading(false)
    }
  }
  
  const handleTrialMode = () => {
    setIsTrialMode(true)
    setIsRegistered(true)
    // Reset trial state
    setTrialStarsFound(0)
    setPenaltyScore({ home: 0, visitor: 0 })
    // Set a demo participant for trial mode
    setParticipant({ name: 'Trial Player' })
    
    // Move to rules step in trial mode
    setCurrentStep('rules')
  }
  
  // Handle moving from rules to game
  const handleStartGame = () => {
    setCurrentStep('game')
  }
  
  // Handle game completion and redirect to dedicated results page
  const handleGameComplete = (result: GameOutcome) => {
    // Additional result handling can be added here
    console.log('Game result:', result)
    
    // REDIRECT to dedicated results page when game is completed
    // For Stars Hexa: when all stars are found (foundAllStars)
    // For Penalty: when round is complete (WIN or LOSE or any result type)
    if (result.foundAllStars || result.type === 'WIN' || result.type === 'LOSE') {
      // Build result parameters for the dedicated results page
      const resultParams = new URLSearchParams({
        outcome: result.type,
        won: (result.foundAllStars || result.type === 'WIN').toString(),
        ...(result.starsFound !== undefined && { starsFound: result.starsFound.toString() }),
        ...(result.totalStarsInGame !== undefined && { totalStars: result.totalStarsInGame.toString() }),
        ...(game?.type === 'PENALTY_SHOOTOUT' && {
          userScore: penaltyScore.home.toString(),
          opponentScore: penaltyScore.visitor.toString()
        }),
        ...(result.message && { message: result.message }),
        ...(isTrialMode && { trial: 'true' }),
        ...(referralUuid && { ref: referralUuid })
      })
      
      // REDIRECT to the dedicated results page
      router.push(`/play/${gameId}/result?${resultParams.toString()}`)
    }
  }
  
  // This function is no longer needed since we redirect to dedicated results page
  // The play again functionality is now handled by the GameResultClient component
  
  // Unified registration handler using centralized component
  const handleUnifiedRegistration = async (participantData: ParticipantData) => {
    try {
      setRegistrationError(null)
      
      // Include referral UUID if present
      const registrationData = {
        ...participantData,
        referrerUuid: referralUuid || undefined
      }
      
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed')
      }
      
      // Store participant data and UUID
      setParticipant(participantData)
      setParticipantUuid(data.data.uuid)
      setIsRegistered(true)
      
      // Move to rules step after successful registration
      setCurrentStep('rules')
      
      // Update URL with participant's UUID for sharing/referral
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('ref', data.data.uuid)
      
      // Update the URL without triggering a page reload
      window.history.replaceState({}, '', currentUrl.toString())
      
      // Show success message with sharing option
      showToast('🎮 Registration successful! You can now share your personalized game link!', 'success')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setRegistrationError(errorMessage)
      throw new Error(errorMessage)
    }
  }
  
  const handleFlip = async (hexagonId: string): Promise<GameOutcome> => {
    // Trial mode: Skip API calls, let game components handle their own logic
    if (isTrialMode) {
      // Just return a placeholder - the game components will handle their own trial logic internally
      // This function won't actually be called in trial mode since components handle clicks internally
      throw new Error('Trial mode should not call handleFlip - components handle internally')
    }
    
    try {
      setPlayError(null)
      
      const response = await fetch(`/api/games/${gameId}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participant,
          sessionId,
          hexagonId
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to play game')
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Game play failed')
      }
      
      // Store the full response for later use
      setGameResult(data.data)
      
      // Return just the outcome for the component
      return data.data.result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to flip hexagon'
      setPlayError(errorMessage)
      
      // Show user-friendly toast notification
      showToast(errorMessage, 'error')
      
      throw new Error(errorMessage)
    }
  }
  
  const handleResult = (result: GameOutcome) => {
    // Use the centralized game completion handler
    handleGameComplete(result)
  }
  
  // Memoized penalty score update handler to prevent infinite re-renders
  const handlePenaltyScoreUpdate = useCallback((homeScore: number, visitorScore: number) => {
    setPenaltyScore({ home: homeScore, visitor: visitorScore })
  }, [])
  
  
  // Helper functions for centralized layout
  const getGameTitle = (gameType: string): string => {
    switch (gameType) {
      case 'STARS_HEXA':
        return 'Stars Hexa Quest'
      case 'PENALTY_SHOOTOUT':
        return 'Penalty Shootout Challenge'
      default:
        return game?.title || 'Game'
    }
  }
  
  const getGameSubtitle = (gameType: string): string => {
    switch (gameType) {
      case 'STARS_HEXA':
        return 'Find all hidden stars in hexagonal cards to win!'
      case 'PENALTY_SHOOTOUT':
        // Dynamic score display for penalty shootout - will be styled as bold and bigger
        return `HOME ${penaltyScore.home} - ${penaltyScore.visitor} VISITOR`
      default:
        return game?.description || 'Play to win amazing rewards!'
    }
  }
  
  const getGameIcon = (gameType: string): string => {
    switch (gameType) {
      case 'STARS_HEXA':
        return '⭐'
      case 'PENALTY_SHOOTOUT':
        return '⚽'
      default:
        return '🎮'
    }
  }
  
  // Render game content (2nd position)
  const renderGameContent = () => {
    if (!game) return null
    
    switch (game.type) {
      case 'STARS_HEXA':
        return (
          <StarsHexa
            hexagons={game.configuration.starsHexa?.hexagons || []}
            onFlip={handleFlip}
            onResult={handleResult}
            theme={game.configuration.starsHexa?.theme || 'default'}
            maxFlipsPerAttempt={game.configuration.starsHexa?.maxFlipsPerAttempt || 3}
            attemptsRemaining={gameResult?.attemptsRemaining || game.configuration.maxAttemptsPerUser}
            gameId={gameId}
            isTrialMode={isTrialMode}
            referralUuid={referralUuid}
          />
        )
      case 'PENALTY_SHOOTOUT':
        return (
          <PenaltyHexa
            players={game.configuration.penaltyShootout?.players || []}
            onFlip={handleFlip}
            onResult={handleResult}
            onScoreUpdate={handlePenaltyScoreUpdate}
            theme={game.configuration.penaltyShootout?.theme || 'football'}
            maxFlipsPerAttempt={game.configuration.penaltyShootout?.maxFlipsPerAttempt || 5}
            attemptsRemaining={gameResult?.attemptsRemaining || game.configuration.maxAttemptsPerUser}
            gameId={gameId}
            isTrialMode={isTrialMode}
            referralUuid={referralUuid}
          />
        )
      default:
        return (
          <div className="text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h1 className="text-2xl font-bold text-white mb-2">Game Type Not Supported</h1>
            <p className="text-gray-300">
              This game type ({game.type}) is not yet supported in the play interface.
            </p>
          </div>
        )
    }
  }
  
  // Render game status (3rd position)
  const renderGameStatus = () => {
    if (!game || !gameResult) return null
    
    const result = gameResult.result
    
    switch (game.type) {
      case 'STARS_HEXA':
        return (
          <GameStatus
            gameType={game.type}
            isGameComplete={result.foundAllStars}
            starsHexa={{
              currentRound: 1, // Could be enhanced to track actual rounds
              totalRounds: game.configuration.maxAttemptsPerUser || 3,
              flipsUsed: 0, // This would come from game state
              maxFlipsPerRound: game.configuration.starsHexa?.maxFlipsPerAttempt || 3,
              starsFound: result.starsFound,
              totalStars: result.totalStarsInGame
            }}
          />
        )
      default:
        return null
    }
  }
  
  // Render game description (4th position)
  const renderGameDescription = () => {
    if (!game) return null
    
    switch (game.type) {
      case 'STARS_HEXA':
        return (
          <GameDescription
            gameType={game.type}
            isGameComplete={gameResult?.result?.foundAllStars || false}
            isGameActive={isRegistered && !gameResult?.result?.foundAllStars}
            attemptsRemaining={gameResult?.attemptsRemaining || game.configuration.maxAttemptsPerUser}
            starsHexaRules={{
              maxFlipsPerRound: game.configuration.starsHexa?.maxFlipsPerAttempt || 3,
              totalRounds: game.configuration.maxAttemptsPerUser || 3,
              totalStars: game.configuration.starsHexa?.totalStars || 3,
              autoFlipBackDelay: 1000
            }}
            theme="default"
          />
        )
      case 'PENALTY_SHOOTOUT':
        return (
          <GameDescription
            gameType={game.type}
            isGameComplete={gameResult?.result?.foundAllStars || false}
            isGameActive={isRegistered}
            attemptsRemaining={gameResult?.attemptsRemaining || game.configuration.maxAttemptsPerUser}
            penaltyShootoutRules={{
              totalPlayers: 11,
              playersToSelect: 5,
              totalGoals: 7,
              totalMisses: 4
            }}
            theme="default"
          />
        )
      default:
        return (
          <GameDescription
            gameType={game.type}
            customDescription="Game rules not available for this game type."
          />
        )
    }
  }
  
  if (loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }
  
  if (error || !game) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center overflow-hidden">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Game Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The game you\'re looking for doesn\'t exist or is no longer available.'}
          </p>
          <button
            onClick={loadGame}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
      
      {/* 4-Step Game Flow */}
      {currentStep === 'registration' && (
        <UnifiedRegistration
          onRegister={handleUnifiedRegistration}
          onTrialMode={handleTrialMode}
          gameTitle={game.title}
          gameName={game.title || 'this game'}
          error={registrationError}
          theme="default"
          showTrialOption={true}
        />
      )}
      
      {currentStep === 'rules' && (
        <GameRulesPage
          gameType={game.type}
          gameTitle={game.title}
          gameDescription={game.description}
          onStartGame={handleStartGame}
          theme="default"
        />
      )}
      
      {currentStep === 'game' && (
        <GameLayout
          gameId={gameId}
          gameType={game.type}
          title={getGameTitle(game.type)}
          subtitle={getGameSubtitle(game.type)}
          titleIcon={getGameIcon(game.type)}
          theme="purple"
          isGameComplete={false}
          gameContent={renderGameContent()}
          statusContent={renderGameStatus()}
        />
      )}
      
      {/* Results step removed - now redirects to dedicated /result page */}
    </div>
  )
}
