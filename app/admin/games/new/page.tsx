'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GameType } from '../../../types'
import GameEditor from '../../../components/admin/GameEditor'

// Local interface for compatibility
interface WheelSegment {
  id: string
  label: string
  color: string
  isActive: boolean
}

// Game type information for the selection UI
const GAME_TYPES = [
  {
    type: 'STARS_HEXA' as GameType,
    name: 'Stars Hexa',
    icon: '★',
    description: 'Memory card game with hexagon layout - find the hidden stars!',
    color: 'from-blue-500 to-purple-600'
  },
  {
    type: 'PENALTY_SHOOTOUT' as GameType,
    name: 'Penalty Shootout',
    icon: '⚽',
    description: 'Football penalty shootout - select 5 players and beat the opponent!',
    color: 'from-green-500 to-emerald-600'
  }
]

export default function NewGamePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Game basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [gameType, setGameType] = useState<GameType>('STARS_HEXA')
  
  // Stars Hexa configuration
  const [maxFlipsPerRound, setMaxFlipsPerRound] = useState(3)
  const [maxRounds, setMaxRounds] = useState(3)
  const [hexagons, setHexagons] = useState([
    { id: '1', text: 'Card 1', hasHiddenStar: false },
    { id: '2', text: 'Card 2', hasHiddenStar: false },
    { id: '3', text: 'Card 3', hasHiddenStar: true },
    { id: '4', text: 'Card 4', hasHiddenStar: false },
    { id: '5', text: 'Card 5', hasHiddenStar: true },
    { id: '6', text: 'Card 6', hasHiddenStar: false },
    { id: '7', text: 'Card 7', hasHiddenStar: false }
  ])
  
  // Triple wheel configuration
  const [simpleWheelConfig, setSimpleWheelConfig] = useState({
    jackpotsCount: 1 as 1 | 2 | 3 | 4 | 5 | 6,
    wheel1Segments: 5 as 3 | 4 | 5 | 6 | 7 | 8,
    wheel2Segments: 4 as 3 | 4 | 5 | 6 | 7 | 8,
    wheel3Segments: 6 as 3 | 4 | 5 | 6 | 7 | 8,
    totalSegmentsToUse: 7 as 5 | 6 | 7 | 8 | 9 | 10 | 11,
    segmentNames: [
      'soccer', 'volleyball', 'handball', 'swimming', 
      'wrestling', 'boxing', 'running', 'skiing', 
      'waterpolo', 'basketball'
    ]
  })
  
  // Wheel animation settings
  const [wheelSpins, setWheelSpins] = useState(8)
  const [wheelSpinsPerGame, setWheelSpinsPerGame] = useState(2)
  const [wheelDuration, setWheelDuration] = useState(4500)
  
  const [theme, setTheme] = useState<'default' | 'colorful' | 'minimal'>('default')

  const updateHexagon = (index: number, field: string, value: any) => {
    setHexagons(prev => prev.map((hex, i) => 
      i === index ? { ...hex, [field]: value } : hex
    ))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error('Game title is required')
      }

      let gameData: any = {
        title: title.trim(),
        description: description.trim(),
        type: gameType,
        isActive: isActive,
        maxAttemptsPerUser: maxRounds,
        configuration: {
          allowMultipleAttempts: true,
          maxAttemptsPerUser: maxRounds,
          requireRegistration: true,
          showResults: true
        }
      }

      // Add game-specific configuration
      if (gameType === 'STARS_HEXA') {
        const starCount = hexagons.filter(h => h.hasHiddenStar).length
        if (starCount === 0) {
          throw new Error('At least one hexagon must have a hidden star')
        }
        if (hexagons.some(h => !h.text.trim())) {
          throw new Error('All hexagon cards must have text')
        }

        gameData.configuration.starsHexa = {
          hexagons: hexagons.map((hex, index) => ({
            ...hex,
            position: index
          })),
          totalStars: starCount,
          maxFlipsPerAttempt: maxFlipsPerRound,
          theme
        }
      } else if (gameType === 'PENALTY_SHOOTOUT') {
        // Generate 11 penalty players with random numbers and goal distribution
        const playerNumbers = Array.from({ length: 21 }, (_, i) => i + 2) // 2-22
        const shuffledNumbers = playerNumbers.sort(() => Math.random() - 0.5).slice(0, 11)
        const goalPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5).slice(0, 7) // 7 goals, 4 misses
        
        const players = Array.from({ length: 11 }, (_, index) => ({
          id: `player-${index + 1}`,
          playerNumber: shuffledNumbers[index],
          hasGoal: goalPositions.includes(index),
          isRevealed: false,
          position: index
        }))
        
        gameData.configuration.penaltyShootout = {
          players,
          totalGoals: 7,
          playersToSelect: 5,
          theme: 'football'
        }
      }

      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create game')
      }

      // Redirect to games list
      router.push('/admin/games')
    } catch (error) {
      console.error('Error creating game:', error)
      setError(error instanceof Error ? error.message : 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  const selectedGameType = GAME_TYPES.find(gt => gt.type === gameType)
  const starsCount = hexagons.filter(h => h.hasHiddenStar).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Game</h1>
            <p className="text-gray-600 mt-1">Choose a game type and configure your interactive experience</p>
          </div>
          <Link
            href="/admin/games"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Games
          </Link>
        </div>

        {/* Game Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAME_TYPES.map((type) => (
              <button
                key={type.type}
                type="button"
                onClick={() => router.push(`/admin/games/new/${type.type}`)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  false ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`text-3xl mb-2 bg-gradient-to-r ${type.color} bg-clip-text text-transparent`}>
                  {type.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-red-600">!</span>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Game Type Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GAME_TYPES.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => setGameType(type.type)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    gameType === type.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-3xl mb-2 bg-gradient-to-r ${type.color} bg-clip-text text-transparent`}>
                    {type.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  {gameType === type.type && (
                    <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm">
                      <span>✓</span>
                      <span>Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Game Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black"
                  style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }}
                  placeholder={`My Awesome ${selectedGameType?.name} Game`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ backgroundColor: '#ffffff', color: '#000000' }}
                >
                  <option value="active" className="bg-white text-black">Active</option>
                  <option value="inactive" className="bg-white text-black">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black"
                style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }}
                placeholder="Describe your game..."
              />
            </div>
          </div>

          {/* Game-Specific Configuration */}
          {gameType === 'STARS_HEXA' && (
            <>
              {/* Stars Hexa Rules */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Rules</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flips Per Round</label>
                    <select
                      value={maxFlipsPerRound}
                      onChange={(e) => setMaxFlipsPerRound(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    >
                      {[3, 4, 5, 6, 7].map(num => (
                        <option key={num} value={num} className="bg-white text-black">{num} flip{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Rounds</label>
                    <select
                      value={maxRounds}
                      onChange={(e) => setMaxRounds(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num} className="bg-white text-black">{num} round{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#ffffff', color: '#000000' }}
                    >
                      <option value="default" className="bg-white text-black">Default</option>
                      <option value="colorful" className="bg-white text-black">Colorful</option>
                      <option value="minimal" className="bg-white text-black">Minimal</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    Player gets <strong>{maxFlipsPerRound} flips per round</strong> and <strong>{maxRounds} total rounds</strong> to find all {starsCount} star{starsCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-blue-700 text-xs mt-1">
                    Note: Minimum 3 flips per round ensures fair gameplay with 7 total hexagon cards.
                  </p>
                </div>
              </div>

              {/* Hexagon Cards */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Hexagon Cards (7 cards)</h2>
                  <div className="text-sm text-gray-600">
                    {starsCount} stars | {7 - starsCount} mushrooms
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hexagons.map((hexagon, index) => (
                    <div key={hexagon.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Card {index + 1}</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hexagon.hasHiddenStar}
                            onChange={(e) => updateHexagon(index, 'hasHiddenStar', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"
                          />
                          <span className="text-sm text-gray-600">
                            {hexagon.hasHiddenStar ? 'Has star' : 'Has mushroom'}
                          </span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={hexagon.text}
                        onChange={(e) => updateHexagon(index, 'text', e.target.value)}
                        className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black"
                        style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }}
                        placeholder={`Text for card ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                {starsCount === 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">You need at least one card with a hidden star!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Penalty Shootout Configuration */}
          {gameType === 'PENALTY_SHOOTOUT' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Penalty Shootout Rules</h2>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      11
                    </div>
                    <span className="text-gray-800 font-medium">Players in formation (1-4-3-2-1)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      5
                    </div>
                    <span className="text-gray-800 font-medium">Players to select for penalties</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      7
                    </div>
                    <span className="text-gray-800 font-medium">Players that will score goals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      4
                    </div>
                    <span className="text-gray-800 font-medium">Players that will miss</span>
                  </div>
                </div>
                <div className="border-t border-green-200 pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Game Flow:</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Players get random jersey numbers (2-22)</li>
                    <li>• Goal/miss distribution is randomized each game</li>
                    <li>• Player selects 5 players for penalty shootout</li>
                    <li>• Opponent scores random 0-5 goals</li>
                    <li>• If draw: sudden death overtime begins</li>
                    <li>• Winner determined by who scores more goals</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6">
            <Link
              href="/admin/games"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !title.trim() || (gameType === 'STARS_HEXA' && starsCount === 0)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : `Create ${selectedGameType?.name} Game`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
