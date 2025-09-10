'use client'

import React from 'react'

export interface GameDescriptionProps {
  // Game type identification
  gameType: 'STARS_HEXA' | 'PENALTY_SHOOTOUT' | string
  
  // Game state context
  isGameComplete?: boolean
  isGameActive?: boolean
  spinsRemaining?: number
  attemptsRemaining?: number
  
  // Content customization
  title?: string
  showRules?: boolean
  showWinConditions?: boolean
  showCurrentState?: boolean
  
  // Stars Hexa specific content
  starsHexaRules?: {
    maxFlipsPerRound: number
    totalRounds: number
    totalStars: number
    autoFlipBackDelay: number
  }
  
  // Penalty Shootout specific content
  penaltyShootoutRules?: {
    totalPlayers: number
    playersToSelect: number
    totalGoals: number
    totalMisses: number
  }
  
  // Custom content for future games
  customRules?: string[]
  customWinConditions?: string[]
  customDescription?: string
  
  // Styling
  theme?: 'default' | 'compact' | 'detailed'
  className?: string
}

/**
 * GameDescription Component - Centralized game rules and information display (4th position)
 * 
 * This component provides consistent display of game rules, win conditions, and current
 * game state information across all game types. Positioned as the 4th layout element
 * to match the structure established by Triple Wheel Fortune.
 * 
 * Features:
 * - Display game rules and instructions with clear formatting
 * - Show win conditions with dynamic highlighting based on current state
 * - Present current game state information contextually
 * - Support for rich text content and markdown-style formatting
 * - Consistent positioning as 4th layout element across all games
 * - Game-specific customization options while maintaining unified styling
 * 
 * Why centralized:
 * - Ensures consistent rule presentation across all games
 * - Eliminates duplicate description logic in individual components
 * - Provides unified styling for game information
 * - Simplifies content management and updates
 * - Enables dynamic content based on game state
 */
export default function GameDescription({
  gameType,
  isGameComplete = false,
  isGameActive = true,
  spinsRemaining = 0,
  attemptsRemaining = 0,
  title,
  showRules = true,
  showWinConditions = true,
  showCurrentState = true,
  starsHexaRules,
  penaltyShootoutRules,
  customRules,
  customWinConditions,
  customDescription,
  theme = 'default',
  className
}: GameDescriptionProps) {
  
  // Generate Stars Hexa content
  const generateStarsHexaContent = () => {
    if (!starsHexaRules) return null
    
    return {
      rules: [
        `${starsHexaRules.maxFlipsPerRound} flips per round, ${starsHexaRules.totalRounds} rounds total`,
        `Find all ${starsHexaRules.totalStars} hidden stars in a single round to win`,
        `Cards flip back after ${starsHexaRules.autoFlipBackDelay / 1000} second if not all stars found`,
        `Ultra-fast ${200}ms flip animations for lightning gameplay`
      ],
      winConditions: [
        `Find ALL ${starsHexaRules.totalStars} stars in a single round`,
        `Stars must be found within ${starsHexaRules.maxFlipsPerRound} flips`,
        `Win immediately when all stars are revealed`
      ],
      currentState: isGameComplete 
        ? "Game completed! Check your results." 
        : attemptsRemaining > 0 
          ? `${attemptsRemaining} rounds remaining. Find all stars to win!`
          : "Game in progress..."
    }
  }
  
  // Generate Penalty Shootout content
  const generatePenaltyShootoutContent = () => {
    if (!penaltyShootoutRules) return null
    
    return {
      rules: [
        `Select ${penaltyShootoutRules.playersToSelect} players from ${penaltyShootoutRules.totalPlayers} team members`,
        `If draw, Visitor WINS!`
      ],
      winConditions: [
        `Score more goals than opponent`,
        `Select players wisely - you can't see who scores until selected`,
        `In overtime: first team to score more wins`
      ],
      currentState: isGameComplete 
        ? "Penalty shootout completed!" 
        : "Ready for penalty shootout!"
    }
  }
  
  // Generate custom game content
  const generateCustomContent = () => {
    return {
      rules: customRules || [],
      winConditions: customWinConditions || [],
      currentState: customDescription || "Game information not available"
    }
  }
  
  // Get content based on game type
  const getGameContent = () => {
    switch (gameType) {
      case 'STARS_HEXA':
        return generateStarsHexaContent()
      case 'PENALTY_SHOOTOUT':
        return generatePenaltyShootoutContent()
      default:
        return generateCustomContent()
    }
  }
  
  const content = getGameContent()
  
  // Don't render if no content
  if (!content) return null
  
  return (
    <div className={className || ''}>
      {/* Description header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white text-center flex items-center justify-center space-x-2">
          <span>{title || 'How to Play'}</span>
        </h3>
      </div>
      
      <div className="space-y-4">
        
        {/* Game Rules Section */}
        {showRules && content.rules && content.rules.length > 0 && (
          <div>
            <h4 className="text-white font-semibold mb-2 text-center">Game Rules:</h4>
            <div className="bg-white/10 rounded-lg p-4">
              <ul className="space-y-2">
                {content.rules.map((rule, index) => (
                  <li key={index} className="text-gray-200 text-sm">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Win Conditions Section */}
        {showWinConditions && content.winConditions && content.winConditions.length > 0 && (
          <div>
            <h4 className="text-white font-semibold mb-2 text-center">Win Conditions:</h4>
            <div className="bg-white/10 rounded-lg p-4">
              <ul className="space-y-2">
                {content.winConditions.map((condition, index) => (
                  <li key={index} className="text-gray-200 text-sm">
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        
        {/* Detailed theme additional info */}
        {theme === 'detailed' && (
          <div className="mt-4">
            <div className="bg-white/5 rounded-lg p-3 border-l-4 border-blue-400">
              <p className="text-gray-300 text-xs">
<strong>Tip:</strong> {gameType === 'STARS_HEXA'
                  ? "Look for patterns in the hexagon layout to optimize your star-finding strategy."
                  : gameType === 'PENALTY_SHOOTOUT'
                    ? "Remember the formation: top striker, midfield, and defense players might have different scoring chances!"
                    : "Follow the game rules carefully to maximize your chances of winning."
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Compact theme summary */}
        {theme === 'compact' && (
          <div className="text-center">
            <p className="text-gray-400 text-xs">
              {gameType === 'STARS_HEXA' 
                ? `${starsHexaRules?.totalStars || 3} stars, ${starsHexaRules?.maxFlipsPerRound || 3} flips/round`
                : gameType === 'PENALTY_SHOOTOUT'
                  ? `${penaltyShootoutRules?.playersToSelect || 5} penalties, ${penaltyShootoutRules?.totalGoals || 7}/${penaltyShootoutRules?.totalPlayers || 11} goals`
                  : "Game in progress"
              }
            </p>
          </div>
        )}
        
      </div>
    </div>
  )
}
