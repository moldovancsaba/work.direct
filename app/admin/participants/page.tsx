'use client'

import { useState, useEffect } from 'react'
import { logger } from '../../lib/logger'

interface Participant {
  _id: string
  name: string
  email?: string
  phone?: string
  uuid?: string
  referrerUuid?: string
  createdAt: string
  lastActivityAt: string
  totalGamesPlayed: number
  totalRewardsEarned: number
  isActive: boolean
  invitesCount?: number
  loginProvider?: 'facebook' | 'email' | 'guest' | 'unknown'
}

interface ParticipantsStats {
  total: number
  active: number
  recentlyActive: number
  totalGamesPlayed: number
  totalRewardsEarned: number
}

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [stats, setStats] = useState<ParticipantsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch participants stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/participants/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setStats(result.data)
      }
    } catch (err) {
      logger.error('Stats fetch error', { error: err })
      // Don't set error state for stats, just log it
    }
  }

  // Fetch participants data
  const fetchParticipants = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        activeOnly: 'false'
      })
      
      if (search.trim()) {
        queryParams.append('search', search.trim())
      }
      
      const response = await fetch(`/api/participants?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch participants')
      }
      
      setParticipants(result.data)
      if (result.pagination) {
        setCurrentPage(result.pagination.page)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants')
      logger.error('Participants fetch error', { error: err })
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1)
    fetchParticipants(1, newSearchTerm)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchParticipants(page, searchTerm)
  }

  // Handle participant deletion
  const handleDeleteParticipant = async (participantId: string, participantName: string) => {
    if (!confirm(`Are you sure you want to delete participant "${participantName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/participants?id=${participantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete participant')
      }
      
      // Refresh the participants list
      await fetchParticipants(currentPage, searchTerm)
      
      // Show success message
      logger.info('Participant deleted successfully', { participantId, participantName })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete participant'
      alert(`Error: ${errorMessage}`)
      logger.error('Delete participant error', { error: err, participantId, participantName })
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchParticipants()
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading participants...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Failed to Load Participants
                </h3>
                <p className="text-red-800 mb-3">{error}</p>
                <button
                  onClick={() => fetchParticipants()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👥 Participants
          </h1>
          <p className="text-gray-600">
            Manage and monitor game participants
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👤</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.total || participants.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.active || participants.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Games/User</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats && stats.total > 0 ? Math.round(stats.totalGamesPlayed / stats.total) : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalRewardsEarned || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search participants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchTerm)
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleSearch(searchTerm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Games Played
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invites
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.email || participant.phone || 'No contact info'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs">
                        {participant.uuid ? (
                          <>
                            <div className="text-gray-900 font-mono mb-1">
                              ID: {participant.uuid.slice(0, 8)}...
                            </div>
                            {participant.referrerUuid && (
                              <div className="text-gray-500 font-mono">
                                👥 {participant.referrerUuid.slice(0, 8)}...
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">Legacy user</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(participant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        const p = participant.loginProvider || (participant.email ? 'email' : 'unknown')
                        if (p === 'facebook') return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">📘 FB</span>
                        if (p === 'email') return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">📧 Email</span>
                        if (p === 'guest') return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">👤 Guest</span>
                        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">❓ Unknown</span>
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.totalGamesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.totalRewardsEarned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.invitesCount ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        participant.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.isActive ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteParticipant(participant._id, participant.name)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {participants.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">👤</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No participants match "${searchTerm}"`
                  : "No participants have joined yet."
                }
              </p>
            </div>
          )}
        </div>

        {/* Real Data Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Live Participant Management
              </h3>
              <p className="text-green-800">
                This participants management system is now connected to real data from your database. 
                Advanced features planned for future releases:
              </p>
              <ul className="text-green-800 text-sm space-y-1 ml-4 mt-2">
                <li>• Bulk participant operations</li>
                <li>• Advanced filtering and sorting</li>
                <li>• Participant activity timeline</li>
                <li>• Export to CSV/Excel formats</li>
                <li>• Email communication tools</li>
              </ul>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  📊 Live Data
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🚀 Production Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
