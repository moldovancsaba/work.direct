'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  overview: {
    totalPlays: number
    totalPlayers: number
    avgSessionTime: string
    completionRate: number
    growth: {
      plays: number
      players: number
    }
  }
  gameStats: Array<{
    id: string
    title: string
    type: string
    status: string
    plays: number
    totalPlays: number
    players: number
    winRate: number
    avgScore: number
    createdAt: string
  }>
  chartData: {
    daily: Array<{
      date: string
      plays: number
      participants: number
    }>
  }
  summary: {
    totalGames: number
    activeGames: number
    totalParticipants: number
    activeParticipants: number
    totalPlays: number
    dateRange: {
      start: string
      end: string
      period: string
    }
  }
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = async (period: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/analytics?dateRange=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch analytics data')
      }
      
      setAnalyticsData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle date range change
  const handleDateRangeChange = (newDateRange: string) => {
    setDateRange(newDateRange)
    fetchAnalyticsData(newDateRange)
  }

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData(dateRange)
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
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
                  Failed to Load Analytics
                </h3>
                <p className="text-red-800 mb-3">{error}</p>
                <button
                  onClick={() => fetchAnalyticsData(dateRange)}
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

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📊</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-500">No analytics data available for the selected period.</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📈 Analytics
              </h1>
              <p className="text-gray-600">
                Game performance insights and user behavior analytics
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <select 
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="px-4 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
              >
                <option value="24h" className="bg-white text-black">Last 24 hours</option>
                <option value="7d" className="bg-white text-black">Last 7 days</option>
                <option value="30d" className="bg-white text-black">Last 30 days</option>
                <option value="90d" className="bg-white text-black">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Plays</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.overview.totalPlays.toLocaleString()}
                </p>
                <p className={`text-xs ${
                  analyticsData.overview.growth.plays >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analyticsData.overview.growth.plays >= 0 ? '+' : ''}{analyticsData.overview.growth.plays.toFixed(1)}% from last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.overview.totalPlayers}
                </p>
                <p className={`text-xs ${
                  analyticsData.overview.growth.players >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analyticsData.overview.growth.players >= 0 ? '+' : ''}{analyticsData.overview.growth.players.toFixed(1)}% from last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.overview.avgSessionTime}
                </p>
                <p className="text-xs text-gray-500">Based on game sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.overview.completionRate}%
                </p>
                <p className="text-xs text-gray-500">Games completed successfully</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Daily Activity
            </h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-4 block">📈</span>
                <p className="text-gray-600 font-medium mb-2">Interactive Chart Coming Soon</p>
                <p className="text-sm text-gray-500">
                  Daily plays and player activity visualization
                </p>
                <div className="mt-4 space-y-2">
                  {analyticsData.chartData.daily.slice(-3).map((day, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className="flex gap-4">
                        <span className="text-blue-600">{day.plays} plays</span>
                        <span className="text-green-600">{day.participants} players</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏅 Game Performance
            </h3>
            <div className="space-y-4">
              {analyticsData.gameStats.map((game, index) => (
                <div key={game.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{game.title}</h4>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Plays:</span>
                      <span className="font-medium ml-1">{game.plays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Win Rate:</span>
                      <span className="font-medium ml-1 text-green-600">{game.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Players:</span>
                      <span className="font-medium ml-1">{game.players}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Score:</span>
                      <span className="font-medium ml-1">{game.avgScore}</span>
                    </div>
                  </div>
                  
                  {/* Progress bar for win rate */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${game.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stats Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Detailed Game Analytics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Plays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Players
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.gameStats.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {game.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.plays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.players}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        game.winRate >= 70
                          ? 'bg-green-100 text-green-800'
                          : game.winRate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {game.winRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {game.avgScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Details
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Export
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Features Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Real Analytics Dashboard
              </h3>
              <p className="text-green-800 mb-3">
                This analytics dashboard is now powered by real data from your database. 
                Additional features planned for future releases:
              </p>
              <ul className="text-green-800 text-sm space-y-1 ml-4">
                <li>• Interactive charts and graphs</li>
                <li>• Advanced player behavior insights</li>
                <li>• Conversion funnel analysis</li>
                <li>• Custom date range selection</li>
                <li>• Export and reporting tools</li>
                <li>• Real-time dashboard updates</li>
              </ul>
              <div className="mt-4 flex gap-2">
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
