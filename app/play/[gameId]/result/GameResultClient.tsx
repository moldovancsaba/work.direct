'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Game } from '../../../types'
import SimpleGameLayout from '../../../components/game/SimpleGameLayout'
import PenaltyGameLayout from '../../../components/games/PenaltyGameLayout'
import PenaltyCardText from '../../../components/games/PenaltyCardText'

interface GameResultData {
  won: boolean
  starsFound?: number
  totalStars?: number
  roundsUsed?: number
  userScore?: number
  opponentScore?: number
  isTrialMode?: boolean
  gameType: 'STARS_HEXA' | 'PENALTY_SHOOTOUT' | 'FIND_RED' | 'WHEEL_OF_FORTUNE' | 'QUIZZ'
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
    const gameType = game.type
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
          text: `Check out this ${gameType === 'PENALTY_SHOOTOUT' ? 'penalty shootout' : gameType === 'STARS_HEXA' ? 'Hexa' : gameType === 'FIND_RED' ? 'Get Shorty' : 'Wheel of Fortune'} game!`,
          url: referralUrl
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(referralUrl)
        alert('Game link copied to clipboard! Share it with your friends.')
      }
    } catch (error) {
      console.error('Error sharing game:', error)
      // Fallback: just copy the game URL without referral
      const fallbackUrl = `${window.location.origin}/play/${gameId}`
      try {
        await navigator.clipboard.writeText(fallbackUrl)
        alert('Game link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
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
  const getHomeScorecardColor = () => {
    if (gameType === 'PENALTY_SHOOTOUT') {
      return game.configuration?.penaltyShootout?.colors?.homeScoreCard || '#c00000'
    }
    return '#c00000' // Default red for home team
  }

  // Get game background colors
  const getGameBlockBackgroundColor = () => {
    if (gameType === 'PENALTY_SHOOTOUT') {
      return game.configuration?.penaltyShootout?.colors?.blockBackground || '#444444'
    }
    return '#444444' // Default dark background
  }

  const getGameFieldColor = () => {
    if (gameType === 'PENALTY_SHOOTOUT') {
      return game.configuration?.penaltyShootout?.colors?.gameField || '#228B22'
    }
    return '#228B22' // Default green field color
  }

  // No need for custom components - use centralized PenaltyCardText

  const getResultTitle = () => {
    if (gameType === 'STARS_HEXA') {
      return won ? 'You found all the stars!' : `You found ${starsFound} out of ${totalStars} stars`
    }
    if (gameType === 'FIND_RED') {
      return won ? 'You found Shorty!' : `You found ${starsFound} of ${totalStars} Shorties`
    }
    if (gameType === 'WHEEL_OF_FORTUNE') {
      return won ? 'Winner!' : 'Better luck next spin!'
    }
    if (gameType === 'QUIZZ') {
      return won ? 'Quiz Winner!' : 'Quiz over — try again!'
    }
    if (gameType === 'PENALTY_SHOOTOUT') {
      const customTexts = game.configuration?.penaltyShootout?.texts
      // Use simple win/loss text without score display
      return won ? 'Victory!' : 'Defeat!'
    }
    return 'Game completed!'
  }

  const getResultMessage = () => {
    if (message) return message
    
    if (gameType === 'STARS_HEXA') {
      if (won) {
        const roundsText = roundsUsed === 1 ? 'round' : 'rounds'
        return `Amazing! You completed the game in ${roundsUsed} ${roundsText}!`
      } else {
        const starsText = starsFound === 1 ? 'star' : 'stars'
        return `Good try! You found ${starsFound} ${starsText} out of ${totalStars}.`
      }
    }

    if (gameType === 'FIND_RED') {
      if (won) {
        return `Great! You found all Shorties!`
      } else {
        return `You found ${starsFound} / ${totalStars} Shorties.`
      }
    }

    if (gameType === 'WHEEL_OF_FORTUNE') {
      return won ? 'Congrats! The wheel landed on a winning segment.' : 'No reward this time — try another spin.'
    }
    
    if (gameType === 'PENALTY_SHOOTOUT') {
      const customTexts = game.configuration?.penaltyShootout?.texts
      if (won) {
        return `${customTexts?.victoryResultMessage || 'Fantastic! You won the penalty shootout'} ${userScore}-${opponentScore}!`
      } else {
        return `${customTexts?.defeatResultMessage || 'Good effort! You lost the penalty shootout. Try again!'} ${userScore}-${opponentScore}.`
      }
    }
    
    return 'Game completed!'
  }

  const MainContent = () => (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-0">
      <div className="rounded-2xl shadow-lg p-8 mb-8" style={{ backgroundColor: getGameBlockBackgroundColor() }}>
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {gameType === 'STARS_HEXA' 
              ? (won ? '' : '')
              : gameType === 'PENALTY_SHOOTOUT'
                ? (won 
                    ? (game.configuration?.penaltyShootout?.texts?.victoryResultEmoji || '')
                    : (game.configuration?.penaltyShootout?.texts?.defeatResultEmoji || '')
                  )
                : (won ? '' : '')
            }
          </div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 text-white`}>
            {gameType === 'STARS_HEXA'
              ? (won ? 'Congratulations!' : 'Game Over')
              : gameType === 'PENALTY_SHOOTOUT'
                ? (won 
                    ? (game.configuration?.penaltyShootout?.texts?.congratulationsText || 'Victory!') 
                    : (game.configuration?.penaltyShootout?.texts?.gameOverText || 'Defeat!')
                  )
                : (won ? 'Winner!' : 'Complete')
            }
          </h2>
          <h3 className="text-xl md:text-2xl text-white mb-4">
            {getResultTitle()}
          </h3>
        </div>

        {gameType === 'STARS_HEXA' ? (
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
        ) : gameType === 'PENALTY_SHOOTOUT' ? (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">
                {userScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">{game.configuration?.penaltyShootout?.texts?.yourGoalsLabel || 'Your Goals'}</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-3xl font-bold text-red-600">
                {opponentScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">{game.configuration?.penaltyShootout?.texts?.opponentGoalsLabel || 'Opponent Goals'}</div>
            </div>
          </div>
        ) : null}

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
            {gameType === 'PENALTY_SHOOTOUT' 
              ? (game.configuration?.penaltyShootout?.texts?.playAgainButton || 'Play Again')
              : 'Play Again'
            }
          </button>
          
          <button
            onClick={handleInviteFriends}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {gameType === 'PENALTY_SHOOTOUT' 
              ? (game.configuration?.penaltyShootout?.texts?.inviteFriendsButton || 'Invite Friends')
              : 'Invite Friends'
            }
          </button>
        </div>
      </div>
    </div>
  )

  // Use PenaltyGameLayout for penalty games to match the game interface
  if (gameType === 'PENALTY_SHOOTOUT') {
    return (
      <PenaltyGameLayout
        homeScore={userScore || 0}
        visitorScore={opponentScore || 0}
        homeScoreCardColor={game.configuration?.penaltyShootout?.colors?.homeScoreCard}
        visitorScoreCardColor={game.configuration?.penaltyShootout?.colors?.visitorScoreCard}
        pageBackground={getGameFieldColor()}
        titleFieldBackground={game.configuration?.penaltyShootout?.colors?.titleField || '#444444'}
        gameBackground={getGameBlockBackgroundColor()}
        scoreboardContent={
          <PenaltyCardText
            text={game.configuration?.penaltyShootout?.texts?.gameResultsTitle || "GAME RESULTS"}
            backgroundColor={getHomeScorecardColor()}
          />
        }
        gameContent={<MainContent />}
      />
    )
  }

  // Use SimpleGameLayout for other game types
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
