'use client'

import React, { ReactNode, useEffect } from 'react'
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
  heroLogoUrl?: string
  heroLogoWidth?: number
  heroLogoHeight?: number,
  heroUseScoreboard?: boolean,
  heroTitleClass?: string
  
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
  heroBackgroundCss?: string
  mainBackgroundCss?: string
  heroFontUrl?: string
  heroFontStyle?: string
  mainFontUrl?: string
  mainFontStyle?: string
  
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
  heroLogoUrl,
  heroLogoWidth,
  heroLogoHeight,
  heroUseScoreboard,
  heroTitleClass,
  gameContent,
  statusContent,
  descriptionContent,
  theme = 'default',
  backgroundGradient,
  containerClassName,
  heroBackgroundCss,
  mainBackgroundCss,
  heroFontUrl,
  heroFontStyle,
  mainFontUrl,
  mainFontStyle,
  penaltyScore,
  isLoading = false,
  isGameComplete = false,
  onPlayAgain
}: GameLayoutProps) {
  // Enforce no-scroll at the document level while on game
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])
  
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
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}
    >
{/* HERO (18%) */}
<HeroBlock
        backgroundCss={heroBackgroundCss}
        title={penaltyScore ? undefined : `${titleIcon ? `${titleIcon} ` : ''}${title}`}
        logoUrl={heroLogoUrl}
        logoWidth={heroLogoWidth}
        logoHeight={heroLogoHeight}
        useScoreboard={heroUseScoreboard ?? true}
        fontUrl={heroFontUrl}
        fontStyle={heroFontStyle}
        titleClass={heroTitleClass}
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
      <MainBlock backgroundCss={mainBackgroundCss} isGame={true} fontUrl={mainFontUrl} fontStyle={mainFontStyle}>
        {/* Game content only - fills the entire main block */}
        <div className="w-full h-full">
          <div className="w-full h-full">
            {gameContent}
          </div>
        </div>
      </MainBlock>
    </div>
  )
}
