'use client'

import React, { ReactNode } from 'react'
import SplitFlapScoreboard from './SplitFlapScoreboard'
import { HeroBlock, MainBlock } from '../play/Blocks'
import FooterLinks from '../play/FooterLinks'

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
  
  // Penalty scoreboard (optional)
  penaltyScore?: { home: number; visitor: number; homeBg?: string; visitorBg?: string; digitColor?: string; showLabels?: boolean; homeLabel?: string; visitorLabel?: string }
  
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
  penaltyScore,
  isLoading = false,
  isGameComplete = false,
  onPlayAgain
}: GameLayoutProps) {
  
// Loading state
  if (isLoading) {
    return (
      <div
        className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">🎮 Loading game...</p>
        </div>
      </div>
    )
  }

  // No subtitle parsing; use explicit penaltyScore when provided

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}
    >
{/* HERO (18%) */}
<HeroBlock
        title={penaltyScore ? undefined : `${titleIcon ? `${titleIcon} ` : ''}${title}`}
        {...(penaltyScore ? { scoreboard: {
          home: penaltyScore.home,
          visitor: penaltyScore.visitor,
          showLabels: penaltyScore.showLabels,
          homeLabel: penaltyScore.homeLabel,
          visitorLabel: penaltyScore.visitorLabel,
          homeBg: penaltyScore.homeBg,
          visitorBg: penaltyScore.visitorBg,
          digitColor: penaltyScore.digitColor
        }} : {})}
      />

      {/* MAIN (76%) */}
      <MainBlock>
        {/* Optional subtitle inside main content to keep hero strictly scoreboard cards */}
        {subtitle && (
          <p className="text-base md:text-lg mb-4" style={{ color: '#FFFFFFFF' }}>
            {subtitle}
          </p>
        )}

        {/* Game content */}
        <div className={`${
          gameType === 'PENALTY_SHOOTOUT' 
            ? 'w-full h-full max-w-6xl max-h-6xl' 
            : 'w-full h-full max-w-4xl max-h-4xl'
        }`}>
          {gameContent}
        </div>

        {/* Status/Description rendered inside main to respect height contract */}
        {(statusContent || descriptionContent) && (
          <div className="mt-4 space-y-2">
            {statusContent && (
              <div className="p-3 text-sm" style={{ backgroundColor: '#FFFFFF1A', color: '#FFFFFFFF' }}>
                {statusContent}
              </div>
            )}
            {descriptionContent && (
              <div className="p-3 text-sm" style={{ backgroundColor: '#FFFFFF1A', color: '#FFFFFFFF' }}>
                {descriptionContent}
              </div>
            )}
          </div>
        )}

        {/* Results page actions (when applicable) */}
        {isGameComplete && onPlayAgain && (
          <div className="mt-4">
            <div className="p-4" style={{ backgroundColor: '#FFFFFF33' }}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={onPlayAgain}
                  className="px-6 py-2 text-white font-bold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  🔄 Play Again
                </button>
                
                <button
                  onClick={() => {
                    const currentUrl = window.location.href
                    navigator.clipboard.writeText(currentUrl)
                  }}
                  className="px-6 py-2 text-white font-bold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                  style={{ backgroundColor: '#4F46E5' }}
                >
                  📤 Share Game
                </button>
              </div>
            </div>
          </div>
        )}
        <FooterLinks gameId={gameId} />
      </MainBlock>
    </div>
  )
}
