'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Game } from '../../../types'
import SimpleGameLayout from '../../../components/game/SimpleGameLayout'
import { logger } from '../../../lib/logger'

interface GameResultData {
  won: boolean
  starsFound?: number
  totalStars?: number
  roundsUsed?: number
  userScore?: number
  opponentScore?: number
  isTrialMode?: boolean
  gameType: 'QUIZZZ'
  message?: string
}

interface GameResultClientProps {
  gameId: string
  initialGameData: Game
  participantUuid?: string
}

export default function GameResultClient({ gameId, initialGameData, participantUuid }: GameResultClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [game, setGame] = useState<Game>(initialGameData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<GameResultData | null>(null)
  const [referralUuid, setReferralUuid] = useState<string | null>(null)

  useEffect(() => {
    parseResultData()
  }, [gameId, searchParams])

  const parseResultData = () => {
    const outcome = searchParams.get('outcome')
    const won = outcome === 'WIN' || searchParams.get('won') === 'true'
    const isTrialMode = searchParams.get('trial') === 'true'
    const message = searchParams.get('message') || ''
    const gameType = 'QUIZZZ' as const
    const referralParam = searchParams.get('ref') || null

    const starsFound = parseInt(searchParams.get('starsFound') || '0')
    const totalStars = parseInt(searchParams.get('totalStars') || '0')
    const roundsUsed = parseInt(searchParams.get('roundsUsed') || '1')
    const userScore = parseInt(searchParams.get('userScore') || '0')
    const opponentScore = parseInt(searchParams.get('opponentScore') || '0')

    setReferralUuid(referralParam)
    setResultData({
      won,
      gameType,
      message,
      isTrialMode,
      starsFound,
      totalStars,
      roundsUsed,
      userScore,
      opponentScore
    })
  }

  const handlePlayAgain = () => {
    router.push(`/play/${gameId}`)
  }

  const handleInviteFriends = async () => {
    try {
      // Use the participant's UUID as the referral code for sharing
      // When someone clicks this link, the participant gets credit as the referrer
      const referrerUuid = participantUuid || ''
      
      // Create referral link with participant's UUID as referrer
      const baseUrl = window.location.origin
      const referralUrl = `${baseUrl}/play/${gameId}${referrerUuid ? `?ref=${referrerUuid}` : ''}`
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: game.title || 'Join me in this game!',
text: `Check out this board-quiz game!`,
          url: referralUrl
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(referralUrl)
        alert('Game link copied to clipboard! Share it with your friends.')
      }
    } catch (error) {
      logger.error('Error sharing game', { error, gameId })
      // Fallback: just copy the game URL without referral
      const fallbackUrl = `${window.location.origin}/play/${gameId}`
      try {
        await navigator.clipboard.writeText(fallbackUrl)
        alert('Game link copied to clipboard!')
      } catch (clipboardError) {
        logger.error('Clipboard error', { error: clipboardError, gameId })
        alert('Unable to copy link. Please share manually: ' + fallbackUrl)
      }
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }
  
  if (error || !game || !resultData) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center overflow-hidden">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load game results.'}
          </p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const { won, gameType, message, starsFound, totalStars, roundsUsed, userScore, opponentScore } = resultData

  // Get scorecard styling for titles
  const getHomeScorecardColor = () => { return '#c00000' }

  // Get game background colors (QUIZZZ-only simplified defaults)
  const getGameBlockBackgroundColor = () => {
    return '#444444' // Default dark background
  }

  const getResultTitle = () => {
    return won ? 'Quiz Winner!' : 'Quiz over — try again!'
  }

  const getResultMessage = () => {
    if (message) return message
    return won ? 'Great job! You reached the win limit.' : 'Better luck next time.'
  }

  const MainContent = () => (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-0">
      <div className="rounded-2xl shadow-lg p-8 mb-8" style={{ backgroundColor: getGameBlockBackgroundColor() }}>
        <div className="text-center mb-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black">{getResultTitle()}</h2>
        </div>

        <div className={`text-center p-4 rounded-xl ${won ? 'bg-green-50' : 'bg-orange-50'}`}>
          <p className={`text-lg font-medium ${won ? 'text-green-800' : 'text-orange-800'}`}>
            {getResultMessage()}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={handlePlayAgain}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Play Again
          </button>
          
          <button
            onClick={handleInviteFriends}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Invite Friends
          </button>
        </div>
      </div>
    </div>
  )

  // QUIZZZ — use SimpleGameLayout
  return (
    <SimpleGameLayout
      gameId={gameId}
      gameType={gameType}
      title={game.title}
      subtitle="Game Results"
      theme="purple"
      isGameComplete={true}
      gameContent={<MainContent />}
    />
  )
}
