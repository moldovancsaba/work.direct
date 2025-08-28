'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import LuckyWheel from '../../components/LuckyWheel'
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
 * Public interface for playing Lucky Wheel games.
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
  
  // Game play state
  const [gameResult, setGameResult] = useState<PlayGameResponse | null>(null)
  const [playError, setPlayError] = useState<string | null>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  
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
  
  const handleSpin = async (): Promise<GameOutcome> => {
    try {
      setPlayError(null)
      
      const response = await fetch(`/api/games/${gameId}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participant,
          sessionId
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to play game'
      setPlayError(errorMessage)
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {game.title}
            </h1>
            {game.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {game.description}
              </p>
            )}
            <div className="mt-2 inline-flex items-center space-x-4 text-sm text-gray-500">
              <span className="inline-flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Active</span>
              </span>
              <span>{game.totalParticipants} players</span>
              <span>{game.totalPlays} plays</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isRegistered ? (
          /* Registration Form */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Join the Game
                </h2>
                <p className="text-gray-600">
                  Enter your details to start playing
                </p>
              </div>
              
              <form onSubmit={handleParticipantRegistration} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={participant.name}
                    onChange={(e) => setParticipant({ ...participant, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={participant.email || ''}
                    onChange={(e) => setParticipant({ ...participant, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={participant.phone || ''}
                    onChange={(e) => setParticipant({ ...participant, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  * Either email or phone number is required
                </p>
                
                {registrationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{registrationError}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  Start Playing
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Game Interface */
          <div className="space-y-8">
            {/* Game Instructions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How to Play
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Click Spin</div>
                    <div>Press the spin button to start the wheel</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Watch & Wait</div>
                    <div>The wheel will spin and land on a segment</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Collect Rewards</div>
                    <div>Win prizes based on where the wheel stops</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">ℹ️</span>
                  <span className="text-sm text-yellow-800">
                    {game.configuration.allowMultipleAttempts 
                      ? `You can play up to ${game.configuration.maxAttemptsPerUser} times.`
                      : 'You get one chance to spin - make it count!'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            {/* Lucky Wheel */}
            <div className="flex justify-center">
              <LuckyWheel
                segments={game.configuration.wheel?.segments || []}
                onSpin={handleSpin}
                onResult={handleResult}
                theme={game.configuration.wheel?.theme || 'default'}
                spinDuration={game.configuration.wheel?.spinDuration || 3000}
                rotations={game.configuration.wheel?.rotations || 4}
                size={400}
              />
            </div>
            
            {/* Error Display */}
            {playError && (
              <div className="max-w-md mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">❌</span>
                    <div>
                      <div className="font-medium text-red-900">Oops!</div>
                      <div className="text-sm text-red-700">{playError}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Results & Rewards */}
            {gameResult && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Rewards Display */}
                {gameResult.rewards && gameResult.rewards.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-900 mb-4 text-center">
                      🎉 You Won Rewards!
                    </h3>
                    <div className="space-y-3">
                      {gameResult.rewards.map((reward, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {reward.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {reward.description}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {getRewardDisplayValue(reward)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Play Again or Share */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                  <div className="space-y-4">
                    {gameResult.canPlayAgain ? (
                      <div>
                        <p className="text-gray-600 mb-4">
                          {gameResult.attemptsRemaining && gameResult.attemptsRemaining > 1 
                            ? `You have ${gameResult.attemptsRemaining} attempts remaining!`
                            : 'You have 1 more attempt remaining!'
                          }
                        </p>
                        <button
                          onClick={() => {
                            setGameResult(null)
                            setPlayError(null)
                          }}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Play Again
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-4">
                          Thanks for playing! Share this game with your friends.
                        </p>
                        {gameResult.shareUrl && (
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: game.title,
                                  text: `Check out this fun game: ${game.title}`,
                                  url: gameResult.shareUrl
                                })
                              } else {
                                navigator.clipboard.writeText(gameResult.shareUrl!)
                                alert('Link copied to clipboard!')
                              }
                            }}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            Share Game
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl">🎯</span>
              <span className="text-xl font-bold">PlayMass</span>
            </div>
            <p className="text-gray-400">
              Interactive games with rewards management
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
