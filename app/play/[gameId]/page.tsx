'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import StarsHexa from '../../components/StarsHexa'
import Toast from '../../components/Toast'
import { Game, GameOutcome, PlayGameResponse, Reward } from '../../types'

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
 * Public interface for playing Stars Hexa games.
 * Features participant registration, game instructions, and results display.
 * 
 * URL: /play/[gameId]
 */
export default function GamePlayPage() {
  const params = useParams()
  const gameId = params.gameId as string
  
  // Game state
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Participant state
  const [participant, setParticipant] = useState<Participant>({ name: '' })
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  
  // Trial mode state
  const [isTrialMode, setIsTrialMode] = useState(false)
  
  // Game play state
  const [gameResult, setGameResult] = useState<PlayGameResponse | null>(null)
  const [playError, setPlayError] = useState<string | null>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  
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
    // Set a demo participant for trial mode
    setParticipant({ name: 'Trial Player' })
  }
  
  const handleTrialFlip = async (hexagonId: string): Promise<GameOutcome> => {
    // Simulate realistic delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    if (!game?.configuration.starsHexa?.hexagons) {
      throw new Error('Game configuration not available')
    }
    
    // For trial mode, we need to create a simple result based on the hexagon ID
    // Since the StarsHexa component handles the actual shuffled state internally,
    // we'll create a mock result that works with any hexagon ID
    
    // Get original configuration for reference
    const originalHexagons = game.configuration.starsHexa.hexagons
    const totalStarsInGame = originalHexagons.filter(h => h.hasHiddenStar).length
    
    // For trial mode, randomly determine if this flip found a star (30% chance)
    const foundStar = Math.random() < 0.3
    const starsFound = foundStar ? 1 : 0
    
    // Simple trial logic - randomly determine if all stars found (20% chance if found a star)
    const foundAllStars = foundStar && Math.random() < 0.2
    
    // Use a generic message since we don't know the actual shuffled text
    let outcomeType: 'WIN' | 'NO_REWARD' = 'NO_REWARD'
    let message = foundStar ? 'You found a star!' : 'No star here, keep trying!'
    
    if (foundStar) {
      outcomeType = 'WIN'
      message = foundAllStars 
        ? `🎉 Amazing! You found a star and completed the game!`
        : `⭐ Great! You found a star!`
    }
    
    return {
      type: outcomeType,
      hexagonId: hexagonId,
      starsFound: starsFound,
      totalStarsInGame: totalStarsInGame,
      foundAllStars: foundAllStars,
      value: foundStar ? 'Hidden Star!' : 'Empty',
      rewardIds: [], // No rewards in trial mode
      message: message
    }
  }
  
  const handleParticipantRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!participant.name.trim()) {
      setRegistrationError('Name is required')
      return
    }
    
    if (!participant.email && !participant.phone) {
      setRegistrationError('Either email or phone number is required')
      return
    }
    
    try {
      setRegistrationError(null)
      
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(participant)
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed')
      }
      
      setIsRegistered(true)
    } catch (err) {
      setRegistrationError(err instanceof Error ? err.message : 'Registration failed')
    }
  }
  
  const handleFlip = async (hexagonId: string): Promise<GameOutcome> => {
    // If in trial mode, use trial flip handler
    if (isTrialMode) {
      return handleTrialFlip(hexagonId)
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
      
      // Return just the outcome for the wheel component
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
    // Additional result handling can be added here
    console.log('Game result:', result)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }
  
  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
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
    <div className="min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
      
      {!isRegistered ? (
        /* Registration Form with Trial Option */
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join the Game
                </h2>
              </div>
              
              <form onSubmit={handleParticipantRegistration} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={participant.name}
                    onChange={(e) => setParticipant({ ...participant, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    value={participant.email || ''}
                    onChange={(e) => setParticipant({ ...participant, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <input
                    type="tel"
                    value={participant.phone || ''}
                    onChange={(e) => setParticipant({ ...participant, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                {registrationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{registrationError}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-all"
                >
                  Start Playing
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleTrialMode}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-4 rounded-lg font-medium transition-all"
                >
                  Try Without Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ONLY HEXAGONS - NOTHING ELSE */
        <StarsHexa
          hexagons={game.configuration.starsHexa?.hexagons || []}
          onFlip={handleFlip}
          onResult={handleResult}
          theme={game.configuration.starsHexa?.theme || 'default'}
          maxFlipsPerAttempt={game.configuration.starsHexa?.maxFlipsPerAttempt || 3}
          attemptsRemaining={gameResult?.attemptsRemaining || game.configuration.maxAttemptsPerUser}
          gameId={gameId}
          isTrialMode={isTrialMode}
        />
      )}
    </div>
  )
}
