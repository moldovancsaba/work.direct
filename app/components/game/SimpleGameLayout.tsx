'use client'

import React, { ReactNode } from 'react'
// import removed — no scoreboard title usage

export interface SimpleGameLayoutProps {
  // Game identification
  gameId: string
  gameType: string
  
  // Header content (1st position)
  title: string
  subtitle?: string
  titleIcon?: string
  
  // Game content (2nd position) 
  gameContent: ReactNode
  
  // Layout customization
  theme?: 'default' | 'purple' | 'blue' | 'colorful'
  
  // State management
  isGameComplete?: boolean
}

export default function SimpleGameLayout({
  gameId,
  gameType,
  title,
  subtitle,
  titleIcon,
  gameContent,
  theme = 'default',
  isGameComplete = false
}: SimpleGameLayoutProps) {
  
  // Theme-based background gradients
  const getBackgroundGradient = () => {
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

  return (
    <div className={`h-screen w-screen ${getBackgroundGradient()} flex flex-col overflow-hidden`}>
      
      {/* 1st Position: Compact Game Header */}
      <div className="flex-shrink-0 text-center py-4 px-4">
        <div className="flex justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{`${titleIcon ? `${titleIcon} ` : ''}${title}`}</h1>
        </div>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-200 mt-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* 2nd Position: Game Content Area */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <div className="w-full h-full max-w-none flex items-center justify-center">
          <div className="w-full h-full max-w-4xl max-h-4xl">
            {gameContent}
          </div>
        </div>
      </div>
    </div>
  )
}
