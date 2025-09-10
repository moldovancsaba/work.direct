'use client'

import React from 'react'

export interface GameStatusProps {
  // Game type identification
  gameType: 'STARS_HEXA' | string
  
  // Common game state
  isGameComplete?: boolean
  isLoading?: boolean
  
  // Stars Hexa specific stats
  starsHexa?: {
    currentRound: number
    totalRounds: number
    flipsUsed: number
    maxFlipsPerRound: number
    starsFound: number
    totalStars: number
  }
  
  
  // Custom stats for future game types
  customStats?: Array<{
    label: string
    value: string | number
    description: string
    isHighlighted?: boolean
  }>
  
  // Styling
  theme?: 'default' | 'compact' | 'detailed'
  className?: string
}

/**
 * GameStatus Component - Centralized game progress and statistics display (3rd position)
 * 
 * This component extracts status tracking logic from individual game components,
 * particularly from WheelGamePlay, and provides a unified interface for displaying
 * game progress across all game types.
 * 
 * Features:
 * - Displays attempts/spins remaining with clear visual indicators
 * - Shows current progress metrics (stars found, results collected, etc.)
 * - Includes game-specific statistics with appropriate formatting
 * - Consistent positioning as 3rd layout element in all games
 * - Flexible interface supporting current and future game types
 * - Responsive design with theme customization
 * 
 * Why centralized:
 * - Provides consistent status display across all games
 * - Eliminates duplicate status logic in individual components
 * - Enables unified styling and interaction patterns
 * - Simplifies maintenance and feature additions
 * - Matches the position/styling of Triple Wheel Fortune status block
 */
export default function GameStatus({
  gameType,
  isGameComplete = false,
  isLoading = false,
  starsHexa,
  customStats,
  theme = 'default',
  className
}: GameStatusProps) {
  
  // Don't render if no stats provided
  if (!starsHexa && !customStats) {
    return null
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`${className || ''}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="h-8 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Render Stars Hexa status
  const renderStarsHexaStatus = () => {
    if (!starsHexa) return null
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{starsHexa.currentRound}</p>
            <p className="text-gray-300">Current Round</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{starsHexa.flipsUsed}</p>
            <p className="text-gray-300">Flips Used</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{starsHexa.starsFound}</p>
            <p className="text-gray-300">Stars Found</p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-white text-sm">
              Round {starsHexa.currentRound}/{starsHexa.totalRounds} • 
              {' '}{starsHexa.maxFlipsPerRound - starsHexa.flipsUsed} flips remaining • 
              {' '}{starsHexa.totalStars - starsHexa.starsFound} stars to find
            </p>
          </div>
        </div>
      </>
    )
  }
  
  
  // Render custom stats
  const renderCustomStats = () => {
    if (!customStats || customStats.length === 0) return null
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {customStats.slice(0, 3).map((stat, index) => (
            <div key={index} className={stat.isHighlighted ? 'border border-yellow-400 rounded-lg p-2' : ''}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-300">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {customStats.length > 3 && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            {customStats.slice(3).map((stat, index) => (
              <div key={index + 3} className="bg-white/20 rounded p-2">
                <p className="text-white font-semibold text-sm">{stat.label}</p>
                <p className="text-white">{stat.value}</p>
                {stat.description && (
                  <p className="text-gray-300 text-xs">{stat.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }
  
  return (
    <div className={className || ''}>
      {/* Game status header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white text-center flex items-center justify-center space-x-2">
          <span>Game Status</span>
          {isGameComplete && <span className="text-green-400">Complete</span>}
        </h3>
      </div>
      
      {/* Render appropriate status based on game type */}
      {gameType === 'STARS_HEXA' && renderStarsHexaStatus()}
      {customStats && renderCustomStats()}
      
      {/* Game completion indicator */}
      {isGameComplete && (
        <div className="mt-4 text-center">
          <div className="bg-green-500/20 border border-green-400 rounded-lg p-3">
            <p className="text-green-300 font-semibold">
              Game Complete!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
