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
  heroTitleColor?: string
  
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
  // Legacy single-main font fields (backward compatibility)
  mainFontUrl?: string
  mainFontStyle?: string
  // New per-type MAIN fonts
  mainFonts?: { h1?: { url?: string; style?: string }; h2?: { url?: string; style?: string }; p?: { url?: string; style?: string } }
  
  // Penalty scoreboard (optional)
  penaltyScore?: { home: number; visitor: number; homeBg?: string; visitorBg?: string; digitColor?: string }
  
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
 * Matches the standardized PlayMass game layout and ensures
 * visual consistency across current and future modules.
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
  heroTitleColor,
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
  mainFonts,
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
        style={{ backgroundColor: '#000000FF', fontFamily: '"Noto Sans", sans-serif' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mb-4 mx-auto"></div>
          <p className="text-lg">🎮 Loading game...</p>
        </div>
      </div>
    )
  }

  // No subtitle parsing; use explicit penaltyScore when provided

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ backgroundColor: '#000000FF', fontFamily: '"Noto Sans", sans-serif' }}
    >
{/* HERO (18%) */}
      <HeroBlock
        backgroundCss={heroBackgroundCss}
        title={penaltyScore ? undefined : `${titleIcon ? `${titleIcon} ` : ''}${title}`}
        titleColor={heroTitleColor}
        logoUrl={heroLogoUrl}
        logoWidth={heroLogoWidth}
        logoHeight={heroLogoHeight}
        useScoreboard={false}
        fontUrl={heroFontUrl}
        fontStyle={heroFontStyle}
        titleClass={heroTitleClass}
        {...(penaltyScore ? { scoreboard: {
          home: penaltyScore.home,
          visitor: penaltyScore.visitor,
          homeBg: penaltyScore.homeBg,
          visitorBg: penaltyScore.visitorBg,
          digitColor: penaltyScore.digitColor
        }} : {})}
      />
      {/* MAIN (76%) */}
      <MainBlock backgroundCss={mainBackgroundCss} isGame={true} fonts={mainFonts} fontUrl={mainFontUrl} fontStyle={mainFontStyle}>
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
