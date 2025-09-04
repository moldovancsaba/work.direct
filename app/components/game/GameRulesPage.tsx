'use client'

import React from 'react'
import { GameType } from '../../types'

interface GameRulesPageProps {
  gameType: GameType
  gameTitle: string
  gameDescription?: string
  onStartGame: () => void
  theme?: 'default' | 'light' | 'dark'
  className?: string
}

/**
 * GameRulesPage Component - Shows game rules and description before gameplay
 * 
 * This component displays between registration and actual game play:
 * 1. Login/Registration ✓
 * 2. Game Rules (this component) ← NEW 
 * 3. Game Play
 * 4. Results
 */
export default function GameRulesPage({
  gameType,
  gameTitle,
  gameDescription,
  onStartGame,
  theme = 'default',
  className = ''
}: GameRulesPageProps) {

  const getPenaltyShootoutRules = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 How to Play
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          🎮 Game Rules:
        </h2>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="space-y-4 text-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚽</span>
            <p className="text-gray-800">
              <strong>Select 5 players</strong> from 11 team members
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <p className="text-gray-800">
              If draw, <strong>Visitor WINS!</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Win Conditions */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-100">
        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Win Conditions:
        </h3>
        
        <div className="space-y-3 text-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏆</span>
            <p className="text-green-800">
              Score <strong>more goals</strong> than opponent
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚽</span>
            <p className="text-green-800">
              Select players wisely - <strong>you can't see who scores</strong> until selected
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔥</span>
            <p className="text-green-800">
              In overtime: <strong>first team to score more wins</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Game Description */}
      {gameDescription && (
        <div className="bg-blue-50 rounded-xl p-6 shadow-lg border border-blue-100">
          <p className="text-blue-800 text-center text-lg">
            {gameDescription}
          </p>
        </div>
      )}
    </div>
  )

  const getStarsHexaRules = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">⭐</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 How to Play
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          🎮 Game Rules:
        </h2>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="space-y-4 text-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <p className="text-gray-800">
              <strong>Find all hidden stars</strong> in the hexagonal cards
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <p className="text-gray-800">
              You have <strong>limited flips per round</strong>
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">⏱️</span>
            <p className="text-gray-800">
              Cards flip back after a short delay if no star found
            </p>
          </div>
        </div>
      </div>

      {/* Win Conditions */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Win Conditions:
        </h3>
        
        <div className="space-y-3 text-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⭐</span>
            <p className="text-purple-800">
              Find <strong>all hidden stars</strong> to win the game
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧠</span>
            <p className="text-purple-800">
              <strong>Remember card positions</strong> - use your memory wisely
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎮</span>
            <p className="text-purple-800">
              <strong>Multiple rounds</strong> if you don't find all stars in one attempt
            </p>
          </div>
        </div>
      </div>

      {/* Game Description */}
      {gameDescription && (
        <div className="bg-blue-50 rounded-xl p-6 shadow-lg border border-blue-100">
          <p className="text-blue-800 text-center text-lg">
            {gameDescription}
          </p>
        </div>
      )}
    </div>
  )

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          container: 'bg-gray-50',
          playButton: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
        }
      case 'dark':
        return {
          container: 'bg-gray-900',
          playButton: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
        }
      default:
        return {
          container: 'bg-gradient-to-br from-blue-50 to-indigo-100',
          playButton: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
        }
    }
  }

  const themeClasses = getThemeClasses()

  return (
    <div className={`h-screen w-screen ${themeClasses.container} flex flex-col overflow-hidden ${className}`}>
      
      {/* Game Rules Content - Scrollable */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          {gameType === 'PENALTY_SHOOTOUT' && getPenaltyShootoutRules()}
          {gameType === 'STARS_HEXA' && getStarsHexaRules()}
        </div>
      </div>

      {/* Play Button - Fixed at bottom */}
      <div className="flex-shrink-0 text-center p-6 bg-white/10 backdrop-blur-sm">
        <button
          onClick={onStartGame}
          className={`
            px-12 py-4 text-xl font-bold rounded-xl transition-all duration-200 transform hover:scale-105 
            ${themeClasses.playButton}
          `}
        >
          🎮 PLAY
        </button>
        
        {/* Optional subtitle */}
        <p className="text-white/80 mt-3 text-sm">
          Click PLAY when you're ready to start {gameTitle}
        </p>
      </div>
    </div>
  )
}
