'use client'

import { useState, useEffect } from 'react'
import ShareButtons from './ShareButtons'
import { logger } from '../../lib/logger'

/**
 * ReferralDashboard Component (v4.10.0)
 * 
 * WHAT: User-facing referral dashboard with stats and share options
 * WHY: Enable users to track referrals and share links easily
 */

interface ReferralDashboardProps {
  userUuid: string
  userName?: string
  gameId?: string
  className?: string
}

export default function ReferralDashboard({
  userUuid,
  userName = 'Friend',
  gameId,
  className = ''
}: ReferralDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [referralLink, setReferralLink] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  // Fetch or generate referral link
  useEffect(() => {
    const initializeReferral = async () => {
      try {
        setLoading(true)
        setError(null)

        // Generate new referral link
        const response = await fetch('/api/referrals/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referrerUuid: userUuid,
            gameId: gameId || null,
            source: 'dashboard'
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to generate referral link')
        }

        setReferralLink(result.data.referralUrl)
        setReferralCode(result.data.referralCode)

        // Fetch user stats
        const statsResponse = await fetch(`/api/referrals/stats?uuid=${userUuid}&type=user`)
        const statsResult = await statsResponse.json()

        if (statsResponse.ok && statsResult.success) {
          setStats(statsResult.data.stats)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referral data')
        logger.error('Referral dashboard init error', { error: err, userUuid })
      } finally {
        setLoading(false)
      }
    }

    initializeReferral()
  }, [userUuid, gameId])

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading referral dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎁 Invite Friends & Earn Rewards
        </h2>
        <p className="text-gray-600">
          Share your referral link and earn points when your friends join!
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-blue-600">{stats.totalReferrals || 0}</div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-green-600">{stats.convertedReferrals || 0}</div>
            <div className="text-sm text-gray-600">Joined</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-purple-600">{stats.referralPoints || 0}</div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-orange-600">
              {stats.conversionRate ? `${stats.conversionRate.toFixed(1)}%` : '0%'}
            </div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
        </div>
      )}

      {/* Referral Link */}
      {referralLink && referralCode && (
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <code className="text-sm text-gray-800 break-all">{referralLink}</code>
          </div>

          <ShareButtons
            referralUrl={referralLink}
            shareMessage={`Hey! Join me on PlayMass and let's play together!`}
            referralCode={referralCode}
            onShare={(platform) => {
              logger.info('Share from dashboard', { platform, userUuid })
            }}
          />
        </div>
      )}

      {/* How it Works */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="text-2xl mr-3">1️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Share Your Link</div>
              <div className="text-sm text-gray-600">Send your referral link to friends via WhatsApp, Facebook, or email</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">2️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Friend Signs Up</div>
              <div className="text-sm text-gray-600">When they sign up using your link, you both get rewards</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-2xl mr-3">3️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Earn Points</div>
              <div className="text-sm text-gray-600">Get 10 bonus points when they play their first game</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
