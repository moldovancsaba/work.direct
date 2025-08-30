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
  
  // Wheel of Fortune configuration
  const [wheelSegments, setWheelSegments] = useState<WheelSegment[]>([
    { id: '1', label: '💰 Jackpot', color: '#F94144', isActive: true },
    { id: '2', label: '🔥 Bonus', color: '#F3722C', isActive: true },
    { id: '3', label: '🎁 Mystery', color: '#F9C74F', isActive: true },
    { id: '4', label: '🍀 Lucky', color: '#90BE6D', isActive: true },
    { id: '5', label: '⚡ Turbo', color: '#577590', isActive: true },
    { id: '6', label: '🎯 Double', color: '#277DA1', isActive: true },
    { id: '7', label: '💎 Gem', color: '#9B5DE5', isActive: true },
    { id: '8', label: '🎉 Win', color: '#B5179E', isActive: true }
  ])
  const [wheelSpins, setWheelSpins] = useState(8)
  const [wheelDuration, setWheelDuration] = useState(4500)
  
  const [theme, setTheme] = useState<'default' | 'colorful' | 'minimal'>('default')

  const updateHexagon = (index: number, field: string, value: any) => {
    setHexagons(prev => prev.map((hex, i) => 
      i === index ? { ...hex, [field]: value } : hex
    ))
  }

  const updateWheelSegment = (index: number, field: keyof WheelSegment, value: any) => {
    setWheelSegments(prev => prev.map((segment, i) => 
      i === index ? { ...segment, [field]: value } : segment
    ))
  }

  const addWheelSegment = () => {
    const newId = (wheelSegments.length + 1).toString()
    setWheelSegments(prev => [...prev, {
      id: newId,
      label: `Segment ${newId}`,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      isActive: true
    }])
  }

  const removeWheelSegment = (index: number) => {
    if (wheelSegments.length > 2) { // Keep at least 2 segments
      setWheelSegments(prev => prev.filter((_, i) => i !== index))
    }
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
        if (wheelSegments.length < 2) {
          throw new Error('At least 2 wheel segments are required')
        }
        if (wheelSegments.some(s => !s.label.trim())) {
          throw new Error('All wheel segments must have labels')
        }

        gameData.configuration.wheelOfFortune = {
          segments: wheelSegments,
          spins: wheelSpins,
          durationMs: wheelDuration,
          pointerAt: 'top',
          size: 520,
          theme,
          allowImmediateReplay: false
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
              {/* Wheel Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Wheel Settings</h2>
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
                    ℹ️ Wheel will spin <strong>{wheelSpins} full rotations</strong> over <strong>{wheelDuration/1000} seconds</strong> before landing on a segment.
                  </p>
                </div>
              </div>

              {/* Wheel Segments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Wheel Segments ({wheelSegments.length} segments)</h2>
                  <button
                    type="button"
                    onClick={addWheelSegment}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    + Add Segment
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wheelSegments.map((segment, index) => (
                    <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Segment {index + 1}</span>
                        {wheelSegments.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeWheelSegment(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={segment.label}
                          onChange={(e) => updateWheelSegment(index, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Segment label (e.g., 💰 Jackpot)"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Color:</label>
                          <input
                            type="color"
                            value={segment.color}
                            onChange={(e) => updateWheelSegment(index, 'color', e.target.value)}
                            className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">{segment.color}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {wheelSegments.length < 2 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">⚠️ You need at least 2 wheel segments!</p>
                  </div>
                )}
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
              disabled={loading || !title.trim() || (gameType === 'STARS_HEXA' && starsCount === 0) || (gameType === '💰🌪️🍀' && wheelSegments.length < 2)}
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
