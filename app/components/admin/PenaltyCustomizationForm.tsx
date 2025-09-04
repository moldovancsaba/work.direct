'use client'

import React, { useState } from 'react'

interface PenaltyTexts {
  // Registration texts
  joinButton: string
  gameTitle: string
  registrationSubtitle: string
  namePlaceholder: string
  emailPlaceholder: string
  phonePlaceholder: string
  contactRequiredError: string
  startPlayingButton: string
  tryWithoutRegText: string
  tryWithoutRegButton: string
  
  // Game texts
  gameIcon: string
  howToPlayButton: string
  gameRulesTitle: string
  gameRulesText: string
  winConditionsTitle: string
  winConditionsText: string
  gameDescription: string
  playButton: string
  
  // Result texts
  gameSubtitle: string
  playAgainButton: string
  shareWithFriendsButton: string
  shareResultTitle: string
  copyLinkButton: string
  shareButton: string
  
  // Win/Loss texts
  defeatIcon: string
  defeatTitle: string
  trialModeIndicator: string
  yourGoalsLabel: string
  opponentGoalsLabel: string
  visitorWinMessage: string
  drawIcon: string
  drawMessage: string
  visitorPenaltyWinMessage: string
  victoryIcon: string
  victoryTitle: string
  homeWinMessage: string
}

interface PenaltyColors {
  // Background colors
  pageBackground: string
  blockBackground: string
  
  // Button colors
  primaryButton: string
  secondaryButton: string
  
  // Game field colors
  scoreboardCard: string
  gameField: string
  playerCard: string
  failedPenalty: string
}

interface PenaltyCustomizationFormProps {
  texts?: Partial<PenaltyTexts>
  colors?: Partial<PenaltyColors>
  onChange: (texts: Partial<PenaltyTexts>, colors: Partial<PenaltyColors>) => void
}

// Default values
const defaultTexts: PenaltyTexts = {
  // Registration texts
  joinButton: 'Join',
  gameTitle: 'DVTK Büntető Párbaj',
  registrationSubtitle: 'Enter your details to play',
  namePlaceholder: 'Enter your name',
  emailPlaceholder: 'your@email.com',
  phonePlaceholder: '+1 (555) 123-4567',
  contactRequiredError: 'Please provide either email or phone number',
  startPlayingButton: '🎮 Start Playing',
  tryWithoutRegText: 'Want to try without registration?',
  tryWithoutRegButton: '🎯 Try Without Registration',
  
  // Game texts
  gameIcon: '⚽',
  howToPlayButton: '📋 How to Play',
  gameRulesTitle: '🎮 Game Rules:',
  gameRulesText: '⚽ Select 5 players from 11 team members\n⚡ If draw, Visitor WINS!',
  winConditionsTitle: '🏆 Win Conditions:',
  winConditionsText: '🏆 Score more goals than opponent\n⚽ Select players wisely - you can\'t see who scores until selected\n🔥 In overtime: first team to score more wins',
  gameDescription: 'Válaszd ki a büntetőpárbajban résztvevő játékosokat és ha győzöl megkaphatod a DVTK FanZone ajándékok egyikét',
  playButton: '🎮 PLAY',
  
  // Result texts
  gameSubtitle: '⚽Penalty Shootout Challenge',
  playAgainButton: '🎮 Play Again',
  shareWithFriendsButton: '🚀 Share with Friends',
  shareResultTitle: 'Share Your Result',
  copyLinkButton: '📋 Copy Link',
  shareButton: '📱 Share',
  
  // Win/Loss texts
  defeatIcon: '⚽😕',
  defeatTitle: 'Defeat!',
  trialModeIndicator: '👀 Trial Mode',
  yourGoalsLabel: 'Your Goals',
  opponentGoalsLabel: 'Opponent Goals',
  visitorWinMessage: '💀 VISITOR won the penalty shootout',
  drawIcon: '🎆',
  drawMessage: 'DRAW',
  visitorPenaltyWinMessage: 'VISITOR wins on penalties!',
  victoryIcon: '⚽🎆',
  victoryTitle: 'Victory! You won',
  homeWinMessage: '⚽ HOME won the penalty shootout'
}

const defaultColors: PenaltyColors = {
  // Background colors
  pageBackground: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
  blockBackground: 'bg-white/10 backdrop-blur-sm',
  
  // Button colors
  primaryButton: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
  secondaryButton: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
  
  // Game field colors
  scoreboardCard: '#000000',
  gameField: '#2ecc71',
  playerCard: '#c00000',
  failedPenalty: '#ffffff'
}

export default function PenaltyCustomizationForm({ texts = {}, colors = {}, onChange }: PenaltyCustomizationFormProps) {
  const [currentTexts, setCurrentTexts] = useState<Partial<PenaltyTexts>>({ ...defaultTexts, ...texts })
  const [currentColors, setCurrentColors] = useState<Partial<PenaltyColors>>({ ...defaultColors, ...colors })
  const [activeTab, setActiveTab] = useState<'texts' | 'colors'>('texts')

  const updateTexts = (key: keyof PenaltyTexts, value: string) => {
    const newTexts = { ...currentTexts, [key]: value }
    setCurrentTexts(newTexts)
    onChange(newTexts, currentColors)
  }

  const updateColors = (key: keyof PenaltyColors, value: string) => {
    const newColors = { ...currentColors, [key]: value }
    setCurrentColors(newColors)
    onChange(currentTexts, newColors)
  }

  const resetToDefaults = () => {
    if (activeTab === 'texts') {
      setCurrentTexts(defaultTexts)
      onChange(defaultTexts, currentColors)
    } else {
      setCurrentColors(defaultColors)
      onChange(currentTexts, defaultColors)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('texts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'texts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Game Texts
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'colors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Colors & Styling
          </button>
        </nav>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {activeTab === 'texts' ? 'Customize Game Texts' : 'Customize Colors'}
        </h3>
        <button
          onClick={resetToDefaults}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-500 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          Reset to Defaults
        </button>
      </div>

      {activeTab === 'texts' && (
        <div className="space-y-8">
          {/* Registration Texts */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Registration Page</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Button</label>
                <input
                  type="text"
                  value={currentTexts.joinButton || ''}
                  onChange={(e) => updateTexts('joinButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Title</label>
                <input
                  type="text"
                  value={currentTexts.gameTitle || ''}
                  onChange={(e) => updateTexts('gameTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Subtitle</label>
                <input
                  type="text"
                  value={currentTexts.registrationSubtitle || ''}
                  onChange={(e) => updateTexts('registrationSubtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name Placeholder</label>
                <input
                  type="text"
                  value={currentTexts.namePlaceholder || ''}
                  onChange={(e) => updateTexts('namePlaceholder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Placeholder</label>
                <input
                  type="text"
                  value={currentTexts.emailPlaceholder || ''}
                  onChange={(e) => updateTexts('emailPlaceholder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Placeholder</label>
                <input
                  type="text"
                  value={currentTexts.phonePlaceholder || ''}
                  onChange={(e) => updateTexts('phonePlaceholder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Required Error</label>
                <input
                  type="text"
                  value={currentTexts.contactRequiredError || ''}
                  onChange={(e) => updateTexts('contactRequiredError', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Playing Button</label>
                <input
                  type="text"
                  value={currentTexts.startPlayingButton || ''}
                  onChange={(e) => updateTexts('startPlayingButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Try Without Registration Text</label>
                <input
                  type="text"
                  value={currentTexts.tryWithoutRegText || ''}
                  onChange={(e) => updateTexts('tryWithoutRegText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Try Without Registration Button</label>
                <input
                  type="text"
                  value={currentTexts.tryWithoutRegButton || ''}
                  onChange={(e) => updateTexts('tryWithoutRegButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Game Texts */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Game Rules & Description</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Icon</label>
                <input
                  type="text"
                  value={currentTexts.gameIcon || ''}
                  onChange={(e) => updateTexts('gameIcon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How to Play Button</label>
                <input
                  type="text"
                  value={currentTexts.howToPlayButton || ''}
                  onChange={(e) => updateTexts('howToPlayButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Rules Title</label>
                <input
                  type="text"
                  value={currentTexts.gameRulesTitle || ''}
                  onChange={(e) => updateTexts('gameRulesTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Win Conditions Title</label>
                <input
                  type="text"
                  value={currentTexts.winConditionsTitle || ''}
                  onChange={(e) => updateTexts('winConditionsTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Play Button</label>
                <input
                  type="text"
                  value={currentTexts.playButton || ''}
                  onChange={(e) => updateTexts('playButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Rules Text (multi-line)</label>
              <textarea
                value={currentTexts.gameRulesText || ''}
                onChange={(e) => updateTexts('gameRulesText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Win Conditions Text (multi-line)</label>
              <textarea
                value={currentTexts.winConditionsText || ''}
                onChange={(e) => updateTexts('winConditionsText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Description</label>
              <textarea
                value={currentTexts.gameDescription || ''}
                onChange={(e) => updateTexts('gameDescription', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Result Texts */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Results & Sharing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Subtitle</label>
                <input
                  type="text"
                  value={currentTexts.gameSubtitle || ''}
                  onChange={(e) => updateTexts('gameSubtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Play Again Button</label>
                <input
                  type="text"
                  value={currentTexts.playAgainButton || ''}
                  onChange={(e) => updateTexts('playAgainButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share with Friends Button</label>
                <input
                  type="text"
                  value={currentTexts.shareWithFriendsButton || ''}
                  onChange={(e) => updateTexts('shareWithFriendsButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share Result Title</label>
                <input
                  type="text"
                  value={currentTexts.shareResultTitle || ''}
                  onChange={(e) => updateTexts('shareResultTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Copy Link Button</label>
                <input
                  type="text"
                  value={currentTexts.copyLinkButton || ''}
                  onChange={(e) => updateTexts('copyLinkButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share Button</label>
                <input
                  type="text"
                  value={currentTexts.shareButton || ''}
                  onChange={(e) => updateTexts('shareButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Win/Loss Texts */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Win/Loss Messages</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Defeat Icon</label>
                <input
                  type="text"
                  value={currentTexts.defeatIcon || ''}
                  onChange={(e) => updateTexts('defeatIcon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Defeat Title</label>
                <input
                  type="text"
                  value={currentTexts.defeatTitle || ''}
                  onChange={(e) => updateTexts('defeatTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trial Mode Indicator</label>
                <input
                  type="text"
                  value={currentTexts.trialModeIndicator || ''}
                  onChange={(e) => updateTexts('trialModeIndicator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Goals Label</label>
                <input
                  type="text"
                  value={currentTexts.yourGoalsLabel || ''}
                  onChange={(e) => updateTexts('yourGoalsLabel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opponent Goals Label</label>
                <input
                  type="text"
                  value={currentTexts.opponentGoalsLabel || ''}
                  onChange={(e) => updateTexts('opponentGoalsLabel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Win Message</label>
                <input
                  type="text"
                  value={currentTexts.visitorWinMessage || ''}
                  onChange={(e) => updateTexts('visitorWinMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Draw Icon</label>
                <input
                  type="text"
                  value={currentTexts.drawIcon || ''}
                  onChange={(e) => updateTexts('drawIcon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Draw Message</label>
                <input
                  type="text"
                  value={currentTexts.drawMessage || ''}
                  onChange={(e) => updateTexts('drawMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Penalty Win Message</label>
                <input
                  type="text"
                  value={currentTexts.visitorPenaltyWinMessage || ''}
                  onChange={(e) => updateTexts('visitorPenaltyWinMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Victory Icon</label>
                <input
                  type="text"
                  value={currentTexts.victoryIcon || ''}
                  onChange={(e) => updateTexts('victoryIcon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Victory Title</label>
                <input
                  type="text"
                  value={currentTexts.victoryTitle || ''}
                  onChange={(e) => updateTexts('victoryTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Home Win Message</label>
                <input
                  type="text"
                  value={currentTexts.homeWinMessage || ''}
                  onChange={(e) => updateTexts('homeWinMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div className="space-y-8">
          {/* Background Colors */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Background Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Background (CSS class)</label>
                <input
                  type="text"
                  value={currentColors.pageBackground || ''}
                  onChange={(e) => updateColors('pageBackground', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block Background (CSS class)</label>
                <input
                  type="text"
                  value={currentColors.blockBackground || ''}
                  onChange={(e) => updateColors('blockBackground', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bg-white/10 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Button Colors */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Button Colors</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button (CSS class)</label>
                <input
                  type="text"
                  value={currentColors.primaryButton || ''}
                  onChange={(e) => updateColors('primaryButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button (CSS class)</label>
                <input
                  type="text"
                  value={currentColors.secondaryButton || ''}
                  onChange={(e) => updateColors('secondaryButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                />
              </div>
            </div>
          </div>

          {/* Game Field Colors */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Game Field Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scoreboard Card (hex color)</label>
                <div className="flex">
                  <input
                    type="color"
                    value={currentColors.scoreboardCard || '#000000'}
                    onChange={(e) => updateColors('scoreboardCard', e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded-l-md"
                  />
                  <input
                    type="text"
                    value={currentColors.scoreboardCard || ''}
                    onChange={(e) => updateColors('scoreboardCard', e.target.value)}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Field (hex color)</label>
                <div className="flex">
                  <input
                    type="color"
                    value={currentColors.gameField || '#2ecc71'}
                    onChange={(e) => updateColors('gameField', e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded-l-md"
                  />
                  <input
                    type="text"
                    value={currentColors.gameField || ''}
                    onChange={(e) => updateColors('gameField', e.target.value)}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#2ecc71"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Card (hex color)</label>
                <div className="flex">
                  <input
                    type="color"
                    value={currentColors.playerCard || '#c00000'}
                    onChange={(e) => updateColors('playerCard', e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded-l-md"
                  />
                  <input
                    type="text"
                    value={currentColors.playerCard || ''}
                    onChange={(e) => updateColors('playerCard', e.target.value)}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#c00000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Failed Penalty (hex color)</label>
                <div className="flex">
                  <input
                    type="color"
                    value={currentColors.failedPenalty || '#ffffff'}
                    onChange={(e) => updateColors('failedPenalty', e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded-l-md"
                  />
                  <input
                    type="text"
                    value={currentColors.failedPenalty || ''}
                    onChange={(e) => updateColors('failedPenalty', e.target.value)}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
