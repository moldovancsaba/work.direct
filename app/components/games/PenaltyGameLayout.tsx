'use client'

import React from 'react'
import PenaltyScoreboard from './PenaltyScoreboard'
import { logger } from '../../lib/logger'

interface PenaltyGameLayoutProps {
  homeScore: number
  visitorScore: number
  gameContent: React.ReactNode
  homeScoreCardColor?: string
  visitorScoreCardColor?: string
  // Optional custom content for the scoreboard area (replaces PenaltyScoreboard if provided)
  scoreboardContent?: React.ReactNode
  // Background colors from game configuration
  pageBackground?: string      // Overall page background (gameField color)
  titleFieldBackground?: string // Title/Scoreboard section background (titleField color)
  gameBackground?: string      // Game section background (blockBackground)
}

/**
 * PenaltyGameLayout Component - Updated layout
 * 
 * Layout breakdown:
 * - 2% margin from top
 * - 18% height for scoreboard 
 * - 2% margin
 * - 78% height for game content
 * - No bottom margin
 * Total: 2 + 18 + 2 + 78 = 100%
 */
export default function PenaltyGameLayout({ homeScore, visitorScore, homeScoreCardColor, visitorScoreCardColor, gameContent, scoreboardContent, pageBackground, titleFieldBackground, gameBackground }: PenaltyGameLayoutProps) {
  logger.debug('PenaltyGameLayout receiving colors', {
    homeScoreCardColor,
    visitorScoreCardColor
  })
  return (
    <div className="penalty-game-layout">
      <style jsx>{`
        .penalty-game-layout {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: ${pageBackground || '#228B22'};
        }

        .top-margin {
          height: 2%;
          flex-shrink: 0;
        }

        .scoreboard-container {
          height: 18%;
          flex-shrink: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${titleFieldBackground || '#444444'};
        }

        .middle-margin {
          height: 2%;
          flex-shrink: 0;
        }

        .game-container {
          height: 78%;
          flex-shrink: 0;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${gameBackground || '#333333'};
        }
      `}</style>

      {/* 2% margin from top */}
      <div className="top-margin"></div>

      {/* 18% height for scoreboard or custom content */}
      <div className="scoreboard-container">
        {scoreboardContent ? (
          <div className="w-full h-full flex items-center justify-center">
            {scoreboardContent}
          </div>
        ) : (
          <PenaltyScoreboard 
            homeScore={homeScore} 
            visitorScore={visitorScore} 
            homeScoreCardColor={homeScoreCardColor}
            visitorScoreCardColor={visitorScoreCardColor}
          />
        )}
      </div>

      {/* 2% margin */}
      <div className="middle-margin"></div>

      {/* 78% height for game content */}
      <div className="game-container">
        {gameContent}
      </div>
    </div>
  )
}
