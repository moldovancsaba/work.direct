'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Game } from '../../types'

/**
 * Games Management Page
 * 
 * Lists all created games with CRUD operations.
 * Allows admins to view, edit, delete, and manage games.
 */
export default function GamesManagementPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/games')
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load games')
      }
      
      setGames(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (gameId: string) => {
    if (deleteConfirm !== gameId) {
      setDeleteConfirm(gameId)
      return
    }

    try {
      setDeleting(gameId)
      setError(null)
      
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete game')
      }
      
      // Remove from local state
      setGames(games.filter(game => game._id.toString() !== gameId))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game')
    } finally {
      setDeleting(null)
    }
  }

  const toggleGameStatus = async (gameId: string, currentStatus: string) => {
    try {
      setError(null)
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update game status')
      }
      
      // Update local state
      setGames(games.map(game => 
        game._id.toString() === gameId ? { ...game, status: newStatus } : game
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading games...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Games Management
            </h1>
            <p className="text-gray-600">
              Manage your Lucky Wheel games
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/admin"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create New Game
            </Link>
            <button
              onClick={loadGames}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Refresh
            </button>
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

        {/* Games List */}
        {games.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Games Created Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first Lucky Wheel game to get started.
            </p>
            <Link
              href="/admin"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Game
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-3">Game</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Participants</div>
                <div className="col-span-2">Total Plays</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Games List */}
            <div className="divide-y divide-gray-200">
              {games.map((game) => (
                <div key={game._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Game Info */}
                    <div className="col-span-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {game.title}
                        </h3>
                        {game.description && (
                          <p className="text-sm text-gray-600 truncate">
                            {game.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {game._id}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <button
                        onClick={() => toggleGameStatus(game._id.toString(), game.status)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(game.status)} hover:opacity-80 transition-opacity`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${game.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        {game.status}
                      </button>
                    </div>

                    {/* Participants */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {game.totalParticipants || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        participants
                      </div>
                    </div>

                    {/* Total Plays */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {game.totalPlays || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        plays
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {formatDate(game.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {game.createdBy || 'Unknown'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        {/* Play Game */}
                        <button
                          onClick={() => {
                            const gameUrl = `/play/${game._id}`
                            const fullUrl = `${window.location.origin}${gameUrl}`
                            window.open(fullUrl, '_blank')
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          title="Play Game"
                        >
                          🎮
                        </button>

                        {/* Edit Game */}
                        <Link
                          href={`/admin/games/${game._id}/edit`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          title="Edit Game"
                        >
                          ✏️
                        </Link>

                        {/* Delete Game */}
                        <button
                          onClick={() => handleDelete(game._id.toString())}
                          disabled={deleting === game._id.toString()}
                          className={`text-sm font-medium ${
                            deleteConfirm === game._id.toString()
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                          title={deleteConfirm === game._id.toString() ? "Click again to confirm" : "Delete Game"}
                        >
                          {deleting === game._id.toString() ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            deleteConfirm === game._id.toString() ? '✅' : '🗑️'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Total Games: {games.length} | 
          Active: {games.filter(g => g.status === 'ACTIVE').length} | 
          Total Participants: {games.reduce((sum, g) => sum + (g.totalParticipants || 0), 0)} | 
          Total Plays: {games.reduce((sum, g) => sum + (g.totalPlays || 0), 0)}
        </div>
      </div>
    </div>
  )
}
