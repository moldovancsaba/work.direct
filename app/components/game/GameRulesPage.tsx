'use client'

import React from 'react'
import { GameType } from '../../types'
import { HeroBlock } from '../play/Blocks'

interface GameRulesPageProps {
  gameType: GameType
  gameTitle: string
  gameDescription?: string
  onStartGame: () => void
  theme?: 'default' | 'light' | 'dark'
  className?: string
  customTexts?: {
    howToPlayButton?: string
    gameRulesTitle?: string
    gameRulesText?: string
    winConditionsTitle?: string
    winConditionsText?: string
    gameDescription?: string
    playButton?: string
  }
  // Layout controls for embedding into PenaltyGameLayout
  hideHeader?: boolean
  containerMode?: 'fullscreen' | 'embedded'
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
  className = '',
  customTexts,
  hideHeader = false,
  containerMode = 'fullscreen'
}: GameRulesPageProps) {

  const getPenaltyShootoutRules = () => (
    <div className="space-y-6">
      {/* Header (rendered by global HeroBlock in fullscreen mode) */}
      {hideHeader === false && (
        <></>
      )}

      {/* Rules List */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="space-y-4 text-lg">
          <div dangerouslySetInnerHTML={{
            __html: (customTexts?.gameRulesText || 
              '<div class="flex items-start gap-3"><p><strong>Select 5 players</strong> from 11 team members</p></div><div class="flex items-start gap-3 mt-4"><p>If draw, <strong>Visitor WINS!</strong></p></div>'
            ).replace(/\n/g, '<br>')
          }} />
        </div>
      </div>

      {/* Win Conditions */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-100">
        <h3 className="text-xl font-bold mb-4">
          {customTexts?.winConditionsTitle || 'Win Conditions:'}
        </h3>
        
        <div className="text-lg" dangerouslySetInnerHTML={{
          __html: (customTexts?.winConditionsText ||
            '<div class="flex items-start gap-3"><p>Score <strong>more goals</strong> than opponent</p></div><div class="flex items-start gap-3 mt-3"><p>Select players wisely - <strong>you can\'t see who scores</strong> until selected</p></div><div class="flex items-start gap-3 mt-3"><p>In overtime: <strong>first team to score more wins</strong></p></div>'
          ).replace(/\n/g, '<br>')
        }} />
      </div>

      {/* Game Description */}
      {(customTexts?.gameDescription || gameDescription) && (
        <div className="bg-blue-50 rounded-xl p-6 shadow-lg border border-blue-100">
          <p className="text-blue-800 text-center text-lg">
            {customTexts?.gameDescription || gameDescription}
          </p>
        </div>
      )}

      {/* Play Button (embedded mode renders button inside content) */}
      {containerMode === 'embedded' && (
        <div className="text-center">
          <button
            onClick={onStartGame}
            className="px-12 py-4 text-xl font-bold rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
          >
            {customTexts?.playButton || 'PLAY'}
          </button>
        </div>
      )}
    </div>
  )

  const getStarsHexaRules = () => (
    <div className="space-y-6">
      {/* Header (rendered by global HeroBlock in fullscreen mode) */}
      {hideHeader === false && (
        <></>
      )}

      {/* Rules List */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="space-y-4 text-lg">
          <div className="flex items-start gap-3">
            <p>
              <strong>Find all hidden stars</strong> in the hexagonal cards
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <p>
              You have <strong>limited flips per round</strong>
            </p>
          </div>

          <div className="flex items-start gap-3">
            <p>
              Cards flip back after a short delay if no star found
            </p>
          </div>
        </div>
      </div>

      {/* Win Conditions */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold mb-4">
          Win Conditions:
        </h3>
        
        <div className="space-y-3 text-lg">
          <div className="flex items-start gap-3">
            <p>
              Find <strong>all hidden stars</strong> to win the game
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <p>
              <strong>Remember card positions</strong> - use your memory wisely
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <p>
              <strong>Multiple rounds</strong> if you don't find all stars in one attempt
            </p>
          </div>
        </div>
      </div>

      {/* Game Description */}
      {gameDescription && (
        <div className="bg-blue-50 rounded-xl p-6 shadow-lg border border-blue-100">
          <p className="text-center text-lg">
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

  const Container = ({ children }: { children: React.ReactNode }) => (
    containerMode === 'embedded'
      ? <div className={`${className}`}>{children}</div>
      : <div className={`h-screen w-screen ${themeClasses.container} flex flex-col overflow-hidden ${className}`}>{children}</div>
  )

  return (
    <Container>
      {/* Global Hero Block for Rules page (fullscreen only) */}
{containerMode !== 'embedded' && (
<HeroBlock backgroundClass={undefined} title={gameTitle} />
      )}

      {/* Game Rules Content - Scrollable or embedded */}
      <div className={`flex-1 flex items-center justify-center p-4 ${containerMode === 'embedded' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className="max-w-2xl mx-auto w-full">
          {gameType === 'PENALTY_SHOOTOUT' && getPenaltyShootoutRules()}
          {gameType === 'STARS_HEXA' && getStarsHexaRules()}
        </div>
      </div>

      {/* Play Button - Fixed at bottom (only in fullscreen mode) */}
      {containerMode !== 'embedded' && (
        <div className="flex-shrink-0 text-center p-6 bg-white/10 backdrop-blur-sm">
          <button
            onClick={onStartGame}
            className={`
              px-12 py-4 text-xl font-bold rounded-xl transition-all duration-200 transform hover:scale-105 
              ${themeClasses.playButton}
            `}
          >
            {customTexts?.playButton || 'PLAY'}
          </button>
        </div>
      )}
    </Container>
  )
}
