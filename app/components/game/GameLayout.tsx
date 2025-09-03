'use client'

import React, { ReactNode } from 'react'

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
  isGameComplete = false
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

  return (
    <div className={`min-h-screen ${getBackgroundGradient()} flex flex-col items-center justify-center p-6`}>
      <div className={`w-full max-w-4xl ${containerClassName || ''}`}>
        
        {/* 1st Position: Game Header - Consistent title and subtitle positioning */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {titleIcon && <span className="mr-3">{titleIcon}</span>}
            {title}
          </h1>
          <p className="text-xl text-gray-200">
            {subtitle}
          </p>
        </div>

        {/* 2nd Position: Game Content - Individual game without extra wrapper */}
        <div className="mb-8">
          {gameContent}
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
        
        {/* Game completion state indicator */}
        {isGameComplete && (
          <div className="text-center mt-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-gray-300">
                Game completed. Redirecting to results...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
