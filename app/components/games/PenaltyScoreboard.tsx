'use client'

import React from 'react'

/**
 * PenaltyScoreboard Component (Legacy Stub)
 * 
 * What: Displays penalty game scores in a simple scoreboard format
 * Why: Maintains backward compatibility while penalty games are deprecated
 * 
 * Note: This is a minimal stub since Penalty games have been removed in favor of QUIZZZ.
 * The component remains to prevent build errors in legacy code paths.
 */

interface PenaltyScoreboardProps {
  homeScore: number
  visitorScore: number
  homeScoreCardColor?: string
  visitorScoreCardColor?: string
}

export default function PenaltyScoreboard({ 
  homeScore, 
  visitorScore, 
  homeScoreCardColor = '#c00000', 
  visitorScoreCardColor = '#0000c0' 
}: PenaltyScoreboardProps) {
  // Simple scoreboard display using the provided colors
  // What: Shows home and visitor scores side by side
  // Why: Legacy component maintained for backward compatibility
  
  return (
    <div className="flex gap-8 items-center justify-center">
      {/* Home Score */}
      <div 
        className="flex flex-col items-center justify-center w-24 h-24 rounded-lg text-white font-bold text-4xl shadow-lg"
        style={{ backgroundColor: homeScoreCardColor }}
      >
        {homeScore}
      </div>
      
      {/* Separator */}
      <div className="text-white text-2xl font-bold">:</div>
      
      {/* Visitor Score */}
      <div 
        className="flex flex-col items-center justify-center w-24 h-24 rounded-lg text-white font-bold text-4xl shadow-lg"
        style={{ backgroundColor: visitorScoreCardColor }}
      >
        {visitorScore}
      </div>
    </div>
  )
}
