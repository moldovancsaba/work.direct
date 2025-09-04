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
      <div className={`h-screen w-screen ${getBackgroundGradient()} flex flex-col items-center justify-center overflow-hidden`}>
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
    <div className={`h-screen w-screen ${getBackgroundGradient()} flex flex-col overflow-hidden`}>
      
      {/* 1st Position: Compact Game Header */}
      <div className="flex-shrink-0 text-center py-4 px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {titleIcon && <span className="mr-2">{titleIcon}</span>}
          {title}
        </h1>
        
        {/* Show SplitFlapScoreboard for penalty shootout, regular subtitle for others */}
        {gameType === 'PENALTY_SHOOTOUT' && subtitle.includes('HOME') && subtitle.includes('VISITOR') ? (
          <div className="flex justify-center mt-2">
            <SplitFlapScoreboard 
              homeScore={scores.home} 
              visitorScore={scores.visitor}
              className="scale-75 md:scale-90"
            />
          </div>
        ) : (
          <p className="text-lg md:text-xl text-gray-200">
            {subtitle}
          </p>
        )}
      </div>

      {/* 2nd Position: MAXIMIZED Game Content Area */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <div className="w-full h-full max-w-none flex items-center justify-center">
          <div className={`${
            gameType === 'PENALTY_SHOOTOUT' 
              ? 'w-full h-full max-w-6xl max-h-6xl' 
              : 'w-full h-full max-w-4xl max-h-4xl'
          }`}>
            {gameContent}
          </div>
        </div>
      </div>

      {/* 3rd & 4th Position: Compact status/description at bottom if needed */}
      {(statusContent || descriptionContent) && (
        <div className="flex-shrink-0 px-4 pb-4 max-h-32 overflow-y-auto">
          {statusContent && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-2 text-sm">
              {statusContent}
            </div>
          )}
          {descriptionContent && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-sm">
              {descriptionContent}
            </div>
          )}
        </div>
      )}
      
      {/* Results page actions */}
      {isGameComplete && onPlayAgain && (
        <div className="flex-shrink-0 p-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={onPlayAgain}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
              >
                🔄 Play Again
              </button>
              
              <button
                onClick={() => {
                  const currentUrl = window.location.href
                  navigator.clipboard.writeText(currentUrl)
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
              >
                📤 Share Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
