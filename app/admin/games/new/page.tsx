'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GameType, WheelSegment } from '../../../types'

// Game type information for the selection UI
const GAME_TYPES = [
  {
    type: 'STARS_HEXA' as GameType,
    name: 'Stars Hexa',
    icon: '⭐',
    description: 'Memory card game with hexagon layout - find the hidden stars!',
    color: 'from-blue-500 to-purple-600'
  },
  {
    type: '💰🌪️🍀' as GameType,
    name: 'Wheel of Fortune',
    icon: '🎰',
    description: 'Spinning wheel game with customizable segments and prizes.',
    color: 'from-green-500 to-teal-600'
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
      } else if (gameType === '💰🌪️🍀') {
        // Triple wheel configuration
        gameData.configuration.wheelOfFortune = {
          segments: [], // Will be auto-generated
          spins: wheelSpins,
          spinsPerGame: wheelSpinsPerGame,
          durationMs: wheelDuration,
          pointerAt: 'top',
          size: 320, // Updated to meet validation requirements (300-800)
          theme,
          allowImmediateReplay: false,
          gameRule: {
            winCondition: 'jackpot_once',
            jackpotLabel: '💰 Jackpot',
            collectionsNeeded: 3
          },
          // Add simple configuration
          simpleConfig: simpleWheelConfig
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-red-600">❌</span>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`My Awesome ${selectedGameType?.name} Game`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[3, 4, 5, 6, 7].map(num => (
                        <option key={num} value={num}>{num} flip{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Rounds</label>
                    <select
                      value={maxRounds}
                      onChange={(e) => setMaxRounds(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num} round{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="default">Default</option>
                      <option value="colorful">Colorful</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    ℹ️ Player gets <strong>{maxFlipsPerRound} flips per round</strong> and <strong>{maxRounds} total rounds</strong> to find all {starsCount} star{starsCount !== 1 ? 's' : ''}.
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
                    ⭐ {starsCount} stars | 🍄 {7 - starsCount} mushrooms
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
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">
                            {hexagon.hasHiddenStar ? '⭐ Has star' : '🍄 Has mushroom'}
                          </span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={hexagon.text}
                        onChange={(e) => updateHexagon(index, 'text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Text for card ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                {starsCount === 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">⚠️ You need at least one card with a hidden star!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {gameType === '💰🌪️🍀' && (
            <>
              {/* Triple Wheel Configuration */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🎰 Triple Wheel Setup</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jackpots Across All Wheels</label>
                        <select
                          value={simpleWheelConfig.jackpotsCount}
                          onChange={(e) => setSimpleWheelConfig(prev => ({
                            ...prev,
                            jackpotsCount: Number(e.target.value) as any
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num} jackpot{num !== 1 ? 's' : ''} total</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wheel 1 Segments</label>
                        <select
                          value={simpleWheelConfig.wheel1Segments}
                          onChange={(e) => setSimpleWheelConfig(prev => ({
                            ...prev,
                            wheel1Segments: Number(e.target.value) as any
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} segments</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wheel 2 Segments</label>
                        <select
                          value={simpleWheelConfig.wheel2Segments}
                          onChange={(e) => setSimpleWheelConfig(prev => ({
                            ...prev,
                            wheel2Segments: Number(e.target.value) as any
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} segments</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wheel 3 Segments</label>
                        <select
                          value={simpleWheelConfig.wheel3Segments}
                          onChange={(e) => setSimpleWheelConfig(prev => ({
                            ...prev,
                            wheel3Segments: Number(e.target.value) as any
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} segments</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Different Segments</label>
                        <select
                          value={simpleWheelConfig.totalSegmentsToUse}
                          onChange={(e) => setSimpleWheelConfig(prev => ({
                            ...prev,
                            totalSegmentsToUse: Number(e.target.value) as any
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[5, 6, 7, 8, 9, 10, 11].map(num => (
                            <option key={num} value={num}>{num} types (including jackpot)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spins Per Game</label>
                        <select
                          value={wheelSpinsPerGame}
                          onChange={(e) => setWheelSpinsPerGame(Number(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {[1, 2, 3].map(num => (
                            <option key={num} value={num}>{num} triple spin{num !== 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-blue-900 font-semibold mb-2">🎮 Game Summary:</h3>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• <strong>3 wheels</strong> with {simpleWheelConfig.wheel1Segments}, {simpleWheelConfig.wheel2Segments}, and {simpleWheelConfig.wheel3Segments} segments each</li>
                        <li>• <strong>{simpleWheelConfig.jackpotsCount} jackpot{simpleWheelConfig.jackpotsCount !== 1 ? 's' : ''}</strong> distributed across the wheels</li>
                        <li>• <strong>{simpleWheelConfig.totalSegmentsToUse} different segments</strong> including sports and jackpot</li>
                        <li>• Players get <strong>{wheelSpinsPerGame} triple spin{wheelSpinsPerGame !== 1 ? 's' : ''}</strong> to win</li>
                        <li>• Win by getting <strong>ANY jackpot</strong> or <strong>3+ matching segments</strong></li>
                      </ul>
                </div>
              </div>
              
              {/* Segment Names */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">⚽ Available Segment Names</h2>
                    <p className="text-gray-600 mb-4">These sport names will be used to fill the wheel segments:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {simpleWheelConfig.segmentNames.map((name, index) => (
                        <div 
                          key={index}
                          className={`rounded-lg p-3 text-center ${
                            index < simpleWheelConfig.totalSegmentsToUse - 1 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <p className={`font-medium text-sm ${
                            index < simpleWheelConfig.totalSegmentsToUse - 1 
                              ? 'text-green-800' 
                              : 'text-gray-500'
                          }`}>
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {index < simpleWheelConfig.totalSegmentsToUse - 1 ? 'USED' : 'unused'}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        🎆 <strong>Auto-generation:</strong> The system will automatically create 3 unique wheels using these segments, 
                        with {simpleWheelConfig.jackpotsCount} jackpot{simpleWheelConfig.jackpotsCount !== 1 ? 's' : ''} distributed fairly across them.
                      </p>
                </div>
              </div>
              
              {/* Wheel Animation Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Animation Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Spins</label>
                    <select
                      value={wheelSpins}
                      onChange={(e) => setWheelSpins(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>{num} spins</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (ms)</label>
                    <select
                      value={wheelDuration}
                      onChange={(e) => setWheelDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={3000}>3.0 seconds</option>
                      <option value={3500}>3.5 seconds</option>
                      <option value={4000}>4.0 seconds</option>
                      <option value={4500}>4.5 seconds</option>
                      <option value={5000}>5.0 seconds</option>
                      <option value={5500}>5.5 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="default">Default</option>
                      <option value="colorful">Colorful</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ℹ️ Each wheel will spin <strong>{wheelSpins} full rotations</strong> over <strong>{wheelDuration/1000} seconds</strong> before landing on a segment.
                  </p>
                </div>
              </div>
            </>
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
