'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Game } from '../../../types'

interface GameResultData {
  won: boolean
  starsFound: number
  totalStars: number
  flipsUsed: number
  roundsUsed: number
  isTrialMode?: boolean
}

interface GameResultClientProps {
  gameId: string
  initialGameData: Game
}

export default function GameResultClient({ gameId, initialGameData }: GameResultClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Game state - initialize with server-side data for faster load
  const [game, setGame] = useState<Game>(initialGameData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Result data from URL params
  const [resultData, setResultData] = useState<GameResultData | null>(null)
  
  // Share functionality
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)

  useEffect(() => {
    parseResultData()
  }, [gameId, searchParams])

  const parseResultData = () => {
    const won = searchParams.get('won') === 'true'
    const starsFound = parseInt(searchParams.get('starsFound') || '0')
    const totalStars = parseInt(searchParams.get('totalStars') || '0')
    const flipsUsed = parseInt(searchParams.get('flipsUsed') || '0')
    const roundsUsed = parseInt(searchParams.get('roundsUsed') || '1')
    const isTrialMode = searchParams.get('trial') === 'true'

    setResultData({
      won,
      starsFound,
      totalStars,
      flipsUsed,
      roundsUsed,
      isTrialMode
    })

    // Generate share URL using the configured production URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const playUrl = `${baseUrl}/play/${gameId}`
    setShareUrl(playUrl)
  }

  const handleShare = async (platform: string) => {
    if (!game || !resultData) return

    const resultText = resultData.won 
      ? `🎉 I just won "${game.title}"! Found ${resultData.starsFound}/${resultData.totalStars} stars in ${resultData.roundsUsed} round${resultData.roundsUsed !== 1 ? 's' : ''}!`
      : `🎮 I just played "${game.title}"! Found ${resultData.starsFound}/${resultData.totalStars} stars. Can you do better?`

    const fullText = `${resultText}\n\n🕹️ Play now: ${shareUrl}`

    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`
        window.open(twitterUrl, '_blank', 'width=550,height=420')
        break
        
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(resultText)}`
        window.open(facebookUrl, '_blank', 'width=550,height=420')
        break
        
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`
        window.open(whatsappUrl, '_blank')
        break
        
      case 'copy':
        try {
          // Copy only the game URL, not the full message with emojis and text
          // This provides a clean link that users can paste anywhere
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error('Failed to copy:', err)
        }
        break
        
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: game.title,
              text: resultText,
              url: shareUrl,
            })
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error('Error sharing:', err)
            }
          }
        }
        break
    }
  }

  const handlePlayAgain = () => {
    router.push(`/play/${gameId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !game || !resultData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">😞</div>
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

  const { won, starsFound, totalStars, flipsUsed, roundsUsed, isTrialMode } = resultData

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Result Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">
            {won ? '🎉' : '💀'}
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${won ? 'text-green-600' : 'text-red-600'}`}>
            {won ? 'Congratulations!' : 'Game Over'}
          </h1>
          <h2 className="text-xl text-gray-700 font-medium">
            {game.title}
          </h2>
          {isTrialMode && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                👀 Trial Mode
              </span>
            </div>
          )}
        </div>

        {/* Result Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              {won ? 'You found all the stars!' : `You found ${starsFound} out of ${totalStars} stars`}
            </h3>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {starsFound}/{totalStars}
              </div>
              <div className="text-sm text-gray-600 mt-1">Stars Found</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">
                {roundsUsed}
              </div>
              <div className="text-sm text-gray-600 mt-1">Rounds Used</div>
            </div>
          </div>

          {/* Result Message */}
          <div className={`text-center p-4 rounded-xl ${won ? 'bg-green-50' : 'bg-orange-50'}`}>
            <p className={`text-lg font-medium ${won ? 'text-green-800' : 'text-orange-800'}`}>
              {won 
                ? `Amazing! You completed the game in ${roundsUsed} round${roundsUsed !== 1 ? 's' : ''}!`
                : `Good try! You found ${starsFound} star${starsFound !== 1 ? 's' : ''} out of ${totalStars}.`
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <button
            onClick={handlePlayAgain}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            🎮 Play Again
          </button>

          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            🚀 Share with Friends
          </button>
        </div>

        {/* Share Options */}
        {showShareOptions && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Share Your Result
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleShare('copy')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {/* Native Share (if available) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={() => handleShare('native')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
