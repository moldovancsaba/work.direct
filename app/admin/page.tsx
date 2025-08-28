'use client'

import { useState } from 'react'
import { WheelSegment, CreateGameRequest } from '../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Admin Interface for Game Creation
 * 
 * This is a simple interface for creating Lucky Wheel games for testing purposes.
 * In a full production version, this would be more sophisticated with authentication,
 * better validation, and more features.
 */
export default function AdminPage() {
  const [gameTitle, setGameTitle] = useState('')
  const [gameDescription, setGameDescription] = useState('')
  const [segments, setSegments] = useState<WheelSegment[]>([
    { id: uuidv4(), label: 'Try Again', value: 'try-again', probability: 40, color: '#EF4444' },
    { id: uuidv4(), label: '10 Points', value: 10, probability: 30, color: '#3B82F6' },
    { id: uuidv4(), label: '25 Points', value: 25, probability: 20, color: '#10B981' },
    { id: uuidv4(), label: '50 Points', value: 50, probability: 8, color: '#F59E0B' },
    { id: uuidv4(), label: 'JACKPOT!', value: 100, probability: 2, color: '#8B5CF6' }
  ])
  const [creating, setCreating] = useState(false)
  const [createdGame, setCreatedGame] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const addSegment = () => {
    setSegments([...segments, {
      id: uuidv4(),
      label: 'New Segment',
      value: 'new',
      probability: 10,
      color: '#6B7280'
    }])
  }

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const newSegments = [...segments]
    newSegments[index] = { ...newSegments[index], ...updates }
    setSegments(newSegments)
  }

  const removeSegment = (index: number) => {
    if (segments.length > 2) { // Keep at least 2 segments
      setSegments(segments.filter((_, i) => i !== index))
    }
  }

  const getTotalProbability = () => {
    return segments.reduce((sum, segment) => sum + segment.probability, 0)
  }

  const createGame = async () => {
    if (!gameTitle.trim()) {
      setError('Game title is required')
      return
    }

    const totalProbability = getTotalProbability()
    if (Math.abs(totalProbability - 100) > 0.01) {
      setError(`Probabilities must add up to 100%. Current total: ${totalProbability}%`)
      return
    }

    setCreating(true)
    setError(null)

    try {
      const gameData: CreateGameRequest = {
        title: gameTitle,
        description: gameDescription || undefined,
        type: 'LUCKY_WHEEL',
        status: 'ACTIVE',
        configuration: {
          wheel: {
            segments: segments,
            spinDuration: 3000,
            rotations: 4,
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
              Your Lucky Wheel game "{createdGame.title}" is now live and ready to play.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Game URL:</div>
              <div className="font-mono text-sm bg-white p-2 rounded border">
                {window.location.origin}{gameUrl}
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <a
                href={gameUrl}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Play Game
              </a>
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
            Create Lucky Wheel Game
          </h1>
          <p className="text-gray-600">
            Set up a new interactive game for your audience
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

          {/* Wheel Segments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Wheel Segments</h2>
              <button
                onClick={addSegment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Add Segment
              </button>
            </div>
            
            <div className="space-y-3">
              {segments.map((segment, index) => (
                <div key={segment.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={segment.label}
                      onChange={(e) => updateSegment(index, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Segment label"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={segment.probability}
                      onChange={(e) => updateSegment(index, { probability: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="%"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="color"
                      value={segment.color || '#3B82F6'}
                      onChange={(e) => updateSegment(index, { color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded"
                    />
                  </div>
                  {segments.length > 2 && (
                    <button
                      onClick={() => removeSegment(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Total Probability: <span className={`font-semibold ${Math.abs(getTotalProbability() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  {getTotalProbability()}%
                </span>
                {Math.abs(getTotalProbability() - 100) > 0.01 && (
                  <span className="text-red-600 ml-2">(Must equal 100%)</span>
                )}
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
