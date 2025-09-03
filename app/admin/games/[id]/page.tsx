'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GameType } from '../../../types'

interface HexagonCard {
  id: string
  text: string
  hasHiddenStar: boolean
  color?: string
}

// Local interface for compatibility with existing wheel games
interface WheelSegment {
  id: string
  label: string
  color: string
  isActive: boolean
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
  type: GameType
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
  
  // Wheel of Fortune configuration - Old style (manual segments)
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
  const [wheelSpinsPerGame, setWheelSpinsPerGame] = useState(3)
  const [wheelDuration, setWheelDuration] = useState(4500)
  const [jackpotLabel, setJackpotLabel] = useState('💰 Jackpot')
  const [collectionsNeeded, setCollectionsNeeded] = useState(3)
  
  // Triple wheel configuration - New style (simple config)
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
  
  // Track which type of wheel configuration this game uses
  const [isSimpleWheelConfig, setIsSimpleWheelConfig] = useState(false)
  
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

      console.log('Edit page - Loading game with ID:', gameId)
      const response = await fetch(`/api/admin/games/${gameId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load game')
      }

      const game = data.game
      console.log('Edit page - Loaded game:', game)
      setGameData(game)

      // Set form values
      setTitle(game.title || '')
      setDescription(game.description || '')
      setIsActive(game.status === 'ACTIVE')

      // Set Stars Hexa configuration
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

      // Set Wheel of Fortune configuration
      if (game.configuration.wheelOfFortune) {
        setWheelSpins(game.configuration.wheelOfFortune.spins || 8)
        setWheelSpinsPerGame(game.configuration.wheelOfFortune.spinsPerGame || 3)
        setWheelDuration(game.configuration.wheelOfFortune.durationMs || 4500)
        setTheme(game.configuration.wheelOfFortune.theme || 'default')
        
        if (game.configuration.wheelOfFortune.gameRule) {
          setJackpotLabel(game.configuration.wheelOfFortune.gameRule.jackpotLabel || '💰 Jackpot')
          setCollectionsNeeded(game.configuration.wheelOfFortune.gameRule.collectionsNeeded || 3)
        }
        
        // Check if this is a new-style simple configuration
        if (game.configuration.wheelOfFortune.simpleConfig) {
          setIsSimpleWheelConfig(true)
          setSimpleWheelConfig({
            jackpotsCount: game.configuration.wheelOfFortune.simpleConfig.jackpotsCount || 1,
            wheel1Segments: game.configuration.wheelOfFortune.simpleConfig.wheel1Segments || 5,
            wheel2Segments: game.configuration.wheelOfFortune.simpleConfig.wheel2Segments || 4,
            wheel3Segments: game.configuration.wheelOfFortune.simpleConfig.wheel3Segments || 6,
            totalSegmentsToUse: game.configuration.wheelOfFortune.simpleConfig.totalSegmentsToUse || 7,
            segmentNames: game.configuration.wheelOfFortune.simpleConfig.segmentNames || [
              'soccer', 'volleyball', 'handball', 'swimming', 
              'wrestling', 'boxing', 'running', 'skiing', 
              'waterpolo', 'basketball'
            ]
          })
        } else {
          // Old-style manual segments configuration
          setIsSimpleWheelConfig(false)
          if (game.configuration.wheelOfFortune.segments && game.configuration.wheelOfFortune.segments.length > 0) {
            setWheelSegments(game.configuration.wheelOfFortune.segments.map((segment: any, index: number) => ({
              id: segment.id || `segment-${index + 1}-${Date.now()}`, // Ensure unique IDs
              label: segment.label || `Segment ${index + 1}`,
              color: segment.color || '#' + Math.floor(Math.random()*16777215).toString(16),
              isActive: segment.isActive !== false
            })))
          }
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

  const updateWheelSegment = (index: number, field: keyof WheelSegment, value: any) => {
    setWheelSegments(prev => prev.map((segment, i) => 
      i === index ? { ...segment, [field]: value } : segment
    ))
  }

  const addWheelSegment = () => {
    const newId = `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const segmentNumber = wheelSegments.length + 1
    setWheelSegments(prev => [...prev, {
      id: newId,
      label: `Segment ${segmentNumber}`,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      isActive: true
    }])
  }

  const removeWheelSegment = (index: number) => {
    if (wheelSegments.length > 2) {
      setWheelSegments(prev => prev.filter((_, i) => i !== index))
    }
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
      if (!title.trim()) {
        throw new Error('Game title is required')
      }

      if (!gameData) {
        throw new Error('Game data not loaded')
      }

      let updateData: any = {
        title: title.trim(),
        description: description.trim(),
        type: gameData.type,
        isActive,
        maxAttemptsPerUser: maxRounds,
        configuration: {
          maxAttemptsPerUser: maxRounds
        },
        rewards: rewards.filter(r => r.title.trim())
      }

      // Add game-specific configuration
      if (gameData.type === 'STARS_HEXA') {
        const starCount = hexagons.filter(h => h.hasHiddenStar).length
        if (starCount === 0) {
          throw new Error('At least one hexagon must have a hidden star')
        }
        if (hexagons.some(h => !h.text.trim())) {
          throw new Error('All hexagon cards must have text')
        }

        updateData.configuration.starsHexa = {
          hexagons: hexagons.map((hex, index) => ({
            ...hex,
            position: index
          })),
          maxFlipsPerAttempt: maxFlipsPerRound,
          theme,
          totalStars: starCount
        }
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
  const gameTypeName = gameData?.type === 'STARS_HEXA' ? 'Stars Hexa' : 'Game'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit {gameTypeName} Game</h1>
            <p className="text-gray-600 mt-1">Modify your {gameTypeName} game configuration</p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`My Awesome ${gameTypeName} Game`}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your game..."
              />
            </div>
          </div>

          {/* Game-Specific Configuration */}
          {gameData?.type === 'STARS_HEXA' && (
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
              disabled={saving || !title.trim() || 
                (gameData?.type === 'STARS_HEXA' && starsCount === 0)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : `Update ${gameTypeName} Game`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
