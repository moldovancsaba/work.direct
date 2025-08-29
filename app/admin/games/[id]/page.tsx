'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface HexagonCard {
  id: string
  text: string
  hasHiddenStar: boolean
  color?: string
}

interface RewardConfig {
  title: string
  description: string
  type: 'DISCOUNT' | 'FREEBIE' | 'POINTS'
  value: number
  maxQuantity: number
  isActive: boolean
}

interface GameData {
  _id: string
  title: string
  description?: string
  status: string
  configuration: {
    starsHexa?: {
      hexagons: HexagonCard[]
      maxFlipsPerAttempt: number
      theme: 'default' | 'colorful' | 'minimal'
      totalStars: number
    }
    maxAttemptsPerUser: number
  }
  rewards: RewardConfig[]
}

export default function EditGamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Game data
  const [gameData, setGameData] = useState<GameData | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  // Game configuration
  const [maxFlipsPerRound, setMaxFlipsPerRound] = useState(3)
  const [maxRounds, setMaxRounds] = useState(3)
  const [theme, setTheme] = useState<'default' | 'colorful' | 'minimal'>('default')
  
  // Hexagons configuration
  const [hexagons, setHexagons] = useState<HexagonCard[]>([
    { id: '1', text: 'Card 1', hasHiddenStar: false },
    { id: '2', text: 'Card 2', hasHiddenStar: false },
    { id: '3', text: 'Card 3', hasHiddenStar: true },
    { id: '4', text: 'Card 4', hasHiddenStar: false },
    { id: '5', text: 'Card 5', hasHiddenStar: true },
    { id: '6', text: 'Card 6', hasHiddenStar: false },
    { id: '7', text: 'Card 7', hasHiddenStar: false }
  ])
  
  // Rewards configuration
  const [rewards, setRewards] = useState<RewardConfig[]>([])

  // Load game data
  useEffect(() => {
    if (gameId) {
      loadGame()
    }
  }, [gameId])

  const loadGame = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/games/${gameId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load game')
      }

      const game = data.game
      setGameData(game)

      // Set form values
      setTitle(game.title || '')
      setDescription(game.description || '')
      setIsActive(game.status === 'ACTIVE')

      // Set configuration
      if (game.configuration.starsHexa) {
        setMaxFlipsPerRound(game.configuration.starsHexa.maxFlipsPerAttempt || 3)
        setTheme(game.configuration.starsHexa.theme || 'default')
        
        if (game.configuration.starsHexa.hexagons && game.configuration.starsHexa.hexagons.length === 7) {
          setHexagons(game.configuration.starsHexa.hexagons.map((hex: any, index: number) => ({
            id: hex.id || (index + 1).toString(),
            text: hex.text || `Card ${index + 1}`,
            hasHiddenStar: hex.hasHiddenStar || false,
            color: hex.color
          })))
        }
      }

      setMaxRounds(game.configuration.maxAttemptsPerUser || 3)

      // Set rewards
      if (game.rewards && Array.isArray(game.rewards)) {
        setRewards(game.rewards.map((reward: any) => ({
          title: reward.title || '',
          description: reward.description || '',
          type: reward.type || 'DISCOUNT',
          value: reward.value || 0,
          maxQuantity: reward.maxQuantity || 1,
          isActive: reward.isActive !== false
        })))
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game')
    } finally {
      setLoading(false)
    }
  }

  const updateHexagon = (index: number, field: keyof HexagonCard, value: any) => {
    setHexagons(prev => prev.map((hex, i) => 
      i === index ? { ...hex, [field]: value } : hex
    ))
  }

  const addReward = () => {
    setRewards(prev => [...prev, {
      title: '',
      description: '',
      type: 'DISCOUNT',
      value: 0,
      maxQuantity: 1,
      isActive: true
    }])
  }

  const updateReward = (index: number, field: keyof RewardConfig, value: any) => {
    setRewards(prev => prev.map((reward, i) => 
      i === index ? { ...reward, [field]: value } : reward
    ))
  }

  const removeReward = (index: number) => {
    setRewards(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error('Game title is required')
      }

      if (hexagons.some(h => !h.text.trim())) {
        throw new Error('All hexagon cards must have text')
      }

      const starCount = hexagons.filter(h => h.hasHiddenStar).length
      if (starCount === 0) {
        throw new Error('At least one hexagon must have a hidden star')
      }

      // Create game data
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        type: 'STARS_HEXA',
        isActive,
        maxAttemptsPerUser: maxRounds,
        configuration: {
          starsHexa: {
            hexagons: hexagons.map((hex, index) => ({
              ...hex,
              position: index
            })),
            maxFlipsPerAttempt: maxFlipsPerRound,
            theme,
            totalStars: starCount
          },
          maxAttemptsPerUser: maxRounds
        },
        rewards: rewards.filter(r => r.title.trim()) // Only include rewards with titles
      }

      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update game')
      }

      // Redirect to games list
      router.push('/admin/games')
    } catch (error) {
      console.error('Error updating game:', error)
      setError(error instanceof Error ? error.message : 'Failed to update game')
    } finally {
      setSaving(false)
    }
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

  if (error && !gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Game Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/admin/games"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Games
          </Link>
        </div>
      </div>
    )
  }

  const starsCount = hexagons.filter(h => h.hasHiddenStar).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Game</h1>
            <p className="text-gray-600 mt-1">Modify your Stars vs Mushrooms game</p>
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
          {/* Basic Game Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Game Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Awesome Stars Game"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your game..."
              />
            </div>
          </div>

          {/* Game Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Rules</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flips Per Round
                </label>
                <select
                  value={maxFlipsPerRound}
                  onChange={(e) => setMaxFlipsPerRound(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <option key={num} value={num}>{num} flip{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Rounds
                </label>
                <select
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} round{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="colorful">Colorful</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <span>ℹ️</span>
                <span>Player gets <strong>{maxFlipsPerRound} flips per round</strong> and <strong>{maxRounds} total rounds</strong> to find all {starsCount} star{starsCount !== 1 ? 's' : ''}.</span>
              </div>
            </div>
          </div>

          {/* Hexagons Configuration */}
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

          {/* Rewards Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Rewards (Optional)</h2>
              <button
                type="button"
                onClick={addReward}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                + Add Reward
              </button>
            </div>

            {rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No rewards configured. Players will just play for fun!</p>
                <p className="text-sm mt-1">Click "Add Reward" to create incentives for players.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Reward {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeReward(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Title</label>
                        <input
                          type="text"
                          value={reward.title}
                          onChange={(e) => updateReward(index, 'title', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Free Coffee"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Type</label>
                        <select
                          value={reward.type}
                          onChange={(e) => updateReward(index, 'type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="DISCOUNT">Discount</option>
                          <option value="FREEBIE">Freebie</option>
                          <option value="POINTS">Points</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Value</label>
                        <input
                          type="number"
                          value={reward.value}
                          onChange={(e) => updateReward(index, 'value', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 mb-1">Description</label>
                      <input
                        type="text"
                        value={reward.description}
                        onChange={(e) => updateReward(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="Get a free coffee on your next visit!"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              disabled={saving || !title.trim() || starsCount === 0}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Update Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
