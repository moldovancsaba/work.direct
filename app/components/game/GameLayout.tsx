'use client'

import React, { ReactNode } from 'react'
import SplitFlapScoreboard from './SplitFlapScoreboard'

export interface GameLayoutProps {
  // Game identification
  gameId: string
  gameType: string
  
  // Header content (1st position)
  title: string
  subtitle: string
  titleIcon?: string
  
  // Game content (2nd position) 
  gameContent: ReactNode
  
  // Status content (3rd position)
  statusContent?: ReactNode
  
  // Description content (4th position)  
  descriptionContent?: ReactNode
  
  // Layout customization
  theme?: 'default' | 'purple' | 'blue' | 'colorful'
  backgroundGradient?: string
  containerClassName?: string
  
  // State management
  isLoading?: boolean
  isGameComplete?: boolean
  onPlayAgain?: () => void
}

/**
 * GameLayout Component - Centralized layout wrapper for all games
 * 
 * This component provides a consistent structure across all game types:
 * 1. Header: Title and subtitle with consistent positioning
 * 2. Game Content: Individual game components in standardized container blocks
 * 3. Status Block: Game progress and statistics (3rd position)
 * 4. Description Block: Rules, instructions, and game state info (4th position)
 * 
 * Matches the layout pattern established by Triple Wheel Fortune and ensures
 * visual consistency across Stars Hexa, Wheel games, and future game types.
 * 
 * Features:
 * - Responsive design with mobile-first approach
 * - Customizable themes and gradients  
 * - Flexible content slots for game-specific elements
 * - Hardware-accelerated animations and smooth transitions
 * - Consistent spacing and visual hierarchy
 */
export default function GameLayout({
  gameId,
  gameType,
  title,
  subtitle,
  titleIcon,
  gameContent,
  statusContent,
  descriptionContent,
  theme = 'default',
  backgroundGradient,
  containerClassName,
  isLoading = false,
  isGameComplete = false,
  onPlayAgain
}: GameLayoutProps) {
  
  // Theme-based background gradients
  const getBackgroundGradient = () => {
    if (backgroundGradient) return backgroundGradient
    
    switch (theme) {
      case 'purple':
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
      case 'blue':
        return 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900'
      case 'colorful':
        return 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600'
      default:
        return 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
    }
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen ${getBackgroundGradient()} flex flex-col items-center justify-center p-6`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">🎮 Loading game...</p>
        </div>
      </div>
    )
  }

  // Extract scores from subtitle for penalty shootout
  const extractScores = () => {
    if (gameType === 'PENALTY_SHOOTOUT' && subtitle.includes('HOME') && subtitle.includes('VISITOR')) {
      const match = subtitle.match(/HOME (\d+) - (\d+) VISITOR/)
      if (match) {
        return {
          home: parseInt(match[1], 10),
          visitor: parseInt(match[2], 10)
        }
      }
    }
    return { home: 0, visitor: 0 }
  }

  const scores = extractScores()

  return (
    <div className={`min-h-screen ${getBackgroundGradient()} flex flex-col items-center justify-center p-6`}>
      <div className={`w-full max-w-4xl ${containerClassName || ''}`}>
        
        {/* 1st Position: Game Header - Consistent title and subtitle positioning */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {titleIcon && <span className="mr-3">{titleIcon}</span>}
            {title}
          </h1>
          
          {/* Show SplitFlapScoreboard for penalty shootout, regular subtitle for others */}
          {gameType === 'PENALTY_SHOOTOUT' && subtitle.includes('HOME') && subtitle.includes('VISITOR') ? (
            <div className="flex justify-center mt-6">
              <SplitFlapScoreboard 
                homeScore={scores.home} 
                visitorScore={scores.visitor}
                className="scale-90 md:scale-100"
              />
            </div>
          ) : (
            <p className="text-xl text-gray-200">
              {subtitle}
            </p>
          )}
        </div>

        {/* 2nd Position: Game Content - Square container for all games */}
        <div className="mb-8 flex justify-center">
          <div className={`w-full aspect-square ${
            gameType === 'PENALTY_SHOOTOUT' ? 'max-w-3xl' : 'max-w-2xl'
          }`}>
            {gameContent}
          </div>
        </div>

        {/* 3rd Position: Status Block - Game progress and statistics */}
        {statusContent && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            {statusContent}
          </div>
        )}

        {/* 4th Position: Description Block - Rules and game state information */}
        {descriptionContent && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            {descriptionContent}
          </div>
        )}
        
        {/* Results page actions */}
        {isGameComplete && onPlayAgain && (
          <div className="text-center mt-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
              <div className="space-y-4">
                <p className="text-lg text-white font-semibold">
                  🎉 Game Complete!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={onPlayAgain}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    🔄 Play Again
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentUrl = window.location.href
                      navigator.clipboard.writeText(currentUrl)
                      // Could show toast notification here
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    📤 Share Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
