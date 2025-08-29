'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HexagonCard, CreateGameRequest } from '../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Admin Interface for Game Creation
 * 
 * This is a simple interface for creating Stars Hexa games for testing purposes.
 * In a full production version, this would be more sophisticated with authentication,
 * better validation, and more features.
 */
export default function AdminPage() {
  const [gameTitle, setGameTitle] = useState('')
  const [gameDescription, setGameDescription] = useState('')
  const [texts, setTexts] = useState<string[]>([
    'Prize A',
    'Prize B', 
    'Prize C',
    'Prize D',
    'Prize E',
    'Prize F',
    'Prize G'
  ])
  const [selectedStars, setSelectedStars] = useState<number>(2) // Number of stars to place
  const [creating, setCreating] = useState(false)
  const [createdGame, setCreatedGame] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const updateText = (index: number, newText: string) => {
    const newTexts = [...texts]
    newTexts[index] = newText
    setTexts(newTexts)
  }

  const addText = () => {
    if (texts.length < 7) {
      setTexts([...texts, `Text ${texts.length + 1}`])
    }
  }

  const removeText = (index: number) => {
    if (texts.length > 1) {
      setTexts(texts.filter((_, i) => i !== index))
    }
  }

  // Function to create hexagons with random star placement
  const createRandomHexagons = (): HexagonCard[] => {
    // Ensure we have exactly 7 texts, pad or trim if needed
    const finalTexts = [...texts]
    while (finalTexts.length < 7) {
      finalTexts.push(`Text ${finalTexts.length + 1}`)
    }
    if (finalTexts.length > 7) {
      finalTexts.splice(7)
    }

    // Create hexagons with positions 0-6
    const hexagons: HexagonCard[] = finalTexts.map((text, index) => ({
      id: uuidv4(),
      text: text,
      hasHiddenStar: false,
      isRevealed: false,
      position: index,
      color: '#3B82F6'
    }))

    // Randomly select positions for stars
    const starPositions = new Set<number>()
    while (starPositions.size < Math.min(selectedStars, 7)) {
      const randomPosition = Math.floor(Math.random() * 7)
      starPositions.add(randomPosition)
    }

    // Apply stars to selected positions
    starPositions.forEach(position => {
      hexagons[position].hasHiddenStar = true
    })

    return hexagons
  }

  const createGame = async () => {
    if (!gameTitle.trim()) {
      setError('Game title is required')
      return
    }

    if (selectedStars < 1 || selectedStars > 3) {
      setError(`You must select between 1-3 hidden stars. Currently selected: ${selectedStars}`)
      return
    }

    if (texts.length === 0) {
      setError('You must have at least one text entry')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const gameData: CreateGameRequest = {
        title: gameTitle,
        description: gameDescription || undefined,
        type: 'STARS_HEXA',
        status: 'ACTIVE',
        configuration: {
          starsHexa: {
            hexagons: createRandomHexagons(),
            totalStars: selectedStars,
            maxFlipsPerAttempt: 7, // Allow flipping all hexagons
            theme: 'colorful'
          },
          allowMultipleAttempts: true,
          maxAttemptsPerUser: 3,
          requireRegistration: false,
          showResults: true
        },
        targetGroups: [],
        shareLinks: [],
        createdBy: 'admin-test',
        isPublic: true
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create game')
      }

      setCreatedGame(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setCreating(false)
    }
  }

  if (createdGame) {
    const gameUrl = `/play/${createdGame._id}`
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Game Created Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your Stars Hexa game "{createdGame.title}" is now live and ready to play.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Game URL:</div>
              <div className="font-mono text-sm bg-white p-2 rounded border">
                {window.location.origin}{gameUrl}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  const fullUrl = `${window.location.origin}${gameUrl}`
                  window.open(fullUrl, '_blank')
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Play Game
              </button>
              <button
                onClick={() => {
                  setCreatedGame(null)
                  setGameTitle('')
                  setGameDescription('')
                  setError(null)
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Create Another
              </button>
              <Link
                href="/admin/games"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Manage Games
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Stars Hexa Game
          </h1>
          <p className="text-gray-600">
            Set up a new hexagonal star-finding game for your audience
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Game Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Game Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter game title"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={gameDescription}
                  onChange={(e) => setGameDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your game..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Text Configuration */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Game Texts</h2>
              <div className="text-sm text-gray-500">
                Enter the texts that will be randomly placed on the hexagonal board
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Number of Stars Selector */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Hidden Stars (1-3):
                </label>
                <div className="flex space-x-4">
                  {[1, 2, 3].map(num => (
                    <label key={num} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stars"
                        value={num}
                        checked={selectedStars === num}
                        onChange={() => setSelectedStars(num)}
                        className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500"
                      />
                      <span className="text-sm font-medium">{num} Star{num > 1 ? 's' : ''}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  ⭐ Stars will be randomly placed among your texts when the game is created
                </p>
              </div>
              
              {/* Text Entries */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium text-gray-900">Text Entries</h3>
                  <button
                    onClick={addText}
                    disabled={texts.length >= 7}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add Text
                  </button>
                </div>
                
                <div className="space-y-2">
                  {texts.map((text, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded border">
                      <div className="w-8 text-center">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => updateText(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter text for hexagon"
                          maxLength={15}
                        />
                      </div>
                      {texts.length > 1 && (
                        <button
                          onClick={() => removeText(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove text"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-xs text-gray-600">
                  📝 You have {texts.length} text{texts.length !== 1 ? 's' : ''} 
                  {texts.length < 7 && ` (${7 - texts.length} more needed for full board)`}
                  {texts.length > 7 && ` (only first 7 will be used)`}
                </div>
              </div>
              
              {/* Preview */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Game Preview</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>🎲 <strong>Randomization:</strong> Texts will be randomly placed on the hexagonal board</div>
                  <div>⭐ <strong>Star Placement:</strong> {selectedStars} star{selectedStars > 1 ? 's' : ''} will be randomly hidden among the texts</div>
                  <div>🎯 <strong>Layout:</strong> 2-3-2 hexagonal formation (7 total positions)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Create Button */}
          <div className="text-center">
            <button
              onClick={createGame}
              disabled={creating}
              className={`px-8 py-3 rounded-lg font-medium text-lg transition-all ${
                creating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              } text-white`}
            >
              {creating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Game...</span>
                </div>
              ) : (
                'Create Game'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
