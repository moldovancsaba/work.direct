'use client'

import { useState, useEffect } from 'react'
import { logger } from '../../lib/logger'

/**
 * Admin Referrals Page (v4.10.0)
 * 
 * WHAT: Admin dashboard for referral program analytics
 * WHY: Monitor viral growth, detect fraud, analyze performance
 */

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platformStats, setPlatformStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch platform stats
        const statsRes = await fetch('/api/referrals/stats?type=platform')
        const statsData = await statsRes.json()

        if (statsRes.ok && statsData.success) {
          setPlatformStats(statsData.data)
        }

        // Fetch leaderboard
        const leaderRes = await fetch('/api/referrals/stats?type=leaderboard&limit=20')
        const leaderData = await leaderRes.json()

        if (leaderRes.ok && leaderData.success) {
          setLeaderboard(leaderData.data.leaderboard)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
        logger.error('Admin referrals page error', { error: err })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading referral analytics...</p>
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
                <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load</h3>
                <p className="text-red-800">{error}</p>
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
            🔗 Referral Program Analytics
          </h1>
          <p className="text-gray-600">
            Monitor viral growth and referral performance
          </p>
        </div>

        {/* Platform Stats */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Referrers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {platformStats.overview.totalReferrers || 0}
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
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {platformStats.overview.totalReferrals || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {platformStats.overview.platformConversionRate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg per User</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {platformStats.overview.avgReferralsPerUser?.toFixed(1) || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              🏆 Top Referrers
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Successful</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((user) => (
                  <tr key={user.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        user.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        user.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {user.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.uuid?.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.totalReferrals}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{user.successfulReferrals}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">{user.referralPoints}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🏆</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
              <p className="text-gray-500">Referral data will appear here once users start sharing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
