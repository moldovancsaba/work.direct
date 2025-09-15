'use client'

import React, { useCallback, useEffect, useState } from 'react'

// Local type for hexagon cards
export interface HexagonCard {
  id: string
  text: string
  hasHiddenStar: boolean
  color?: string
}

export interface StarsHexaTexts {
  // Welcome page
  welcomeTitle?: string
  welcomeSubtitle?: string
  ctaStart?: string
  ctaGuest?: string
  // Rules page
  rulesTitle?: string
  rulesBody?: string
  // Result page
  resultTitle?: string
  resultInviteCTA?: string
  resultPlayAgainCTA?: string
  resultPartnerCTA?: string
  // HUD
  gameHUD?: string
}

export interface StarsHexaColors {
  palette?: {
    primary?: string
    accent?: string
    bg?: string
    text?: string
  }
}

export interface StarsHexaSettings {
  maxFlipsPerAttempt: number
  theme: 'default' | 'colorful' | 'minimal'
  winEmoji: string
  loseEmoji: string
}

interface StarsHexaCustomizationFormProps {
  texts?: Partial<StarsHexaTexts>
  colors?: Partial<StarsHexaColors>
  settings?: StarsHexaSettings
  hexagons: HexagonCard[]
  onHexagonsChange: (hexagons: HexagonCard[]) => void
  onChange: (texts: Partial<StarsHexaTexts>, colors: Partial<StarsHexaColors>, settings: StarsHexaSettings) => void
  hideTextAndColors?: boolean
}

const defaultTexts: StarsHexaTexts = {
  welcomeTitle: 'Welcome to Hexa',
  welcomeSubtitle: 'Find all the hidden stars to win!',
  ctaStart: 'Start',
  ctaGuest: 'Try Without Registration',
  rulesTitle: 'Game Rules',
  rulesBody: 'Flip cards to find hidden stars\nYou have limited flips per round',
  resultTitle: 'Game Results',
  resultInviteCTA: 'Invite Friends',
  resultPlayAgainCTA: 'Play Again',
  resultPartnerCTA: 'Visit Partner',
  gameHUD: ''
}

const defaultColors: StarsHexaColors = {
  palette: {
    primary: '#0EA5E9',
    accent: '#F59E0B',
    bg: '#0B1220',
    text: '#FFFFFF'
  }
}

const defaultSettings: StarsHexaSettings = {
  maxFlipsPerAttempt: 3,
  theme: 'default',
  // Emoji defaults enable quick reskin (e.g., fish 🐟 & chips 🍟)
  winEmoji: '⭐️',
  loseEmoji: '🍄'
}

export default function StarsHexaCustomizationForm({
  texts = {},
  colors = {},
  settings = defaultSettings,
  hexagons,
  onHexagonsChange,
  onChange,
  hideTextAndColors = false
}: StarsHexaCustomizationFormProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'texts' | 'colors'>('rules')
  
  // Ensure valid tab when text/color sections are hidden
  useEffect(() => {
    if (hideTextAndColors && activeTab !== 'rules') {
      setActiveTab('rules')
    }
  }, [hideTextAndColors, activeTab])
  const [currentTexts, setCurrentTexts] = useState<Partial<StarsHexaTexts>>({ ...defaultTexts, ...texts })
  const [currentColors, setCurrentColors] = useState<Partial<StarsHexaColors>>({
    palette: { ...defaultColors.palette, ...(colors.palette || {}) }
  })
  const [currentSettings, setCurrentSettings] = useState<StarsHexaSettings>({ ...defaultSettings, ...settings })

  useEffect(() => {
    setCurrentTexts({ ...defaultTexts, ...texts })
  }, [texts])

  useEffect(() => {
    setCurrentColors({ palette: { ...defaultColors.palette, ...(colors.palette || {}) } })
  }, [colors])

  useEffect(() => {
    setCurrentSettings({ ...defaultSettings, ...settings })
  }, [settings])

  const updateTexts = useCallback((key: keyof StarsHexaTexts, value: string) => {
    const next = { ...currentTexts, [key]: value }
    setCurrentTexts(next)
    onChange(next, currentColors, currentSettings)
  }, [currentTexts, currentColors, currentSettings, onChange])

  const updateColor = useCallback((key: 'primary' | 'accent' | 'bg' | 'text', value: string) => {
    const next = { palette: { ...(currentColors.palette || {}), [key]: value } }
    setCurrentColors(next)
    onChange(currentTexts, next, currentSettings)
  }, [currentTexts, currentColors, currentSettings, onChange])

  const updateSettings = useCallback((key: keyof StarsHexaSettings, value: any) => {
    const next = { ...currentSettings, [key]: value }
    setCurrentSettings(next)
    onChange(currentTexts, currentColors, next)
  }, [currentTexts, currentColors, currentSettings, onChange])

  const updateHexagon = (index: number, field: keyof HexagonCard, value: any) => {
    const next = hexagons.map((h, i) => i === index ? { ...h, [field]: value } : h)
    onHexagonsChange(next)
  }

  const resetToDefaults = () => {
    if (activeTab === 'rules') {
      const nextSettings = { ...defaultSettings }
      setCurrentSettings(nextSettings)
      onChange(currentTexts, currentColors, nextSettings)
    } else if (activeTab === 'texts') {
      const nextTexts = { ...defaultTexts }
      setCurrentTexts(nextTexts)
      onChange(nextTexts, currentColors, currentSettings)
    } else if (activeTab === 'colors') {
      const nextColors = { ...defaultColors }
      setCurrentColors(nextColors)
      onChange(currentTexts, nextColors, currentSettings)
    }
  }

  const starsCount = hexagons.filter(h => h.hasHiddenStar).length

  const renderField = (label: string, key: keyof StarsHexaTexts, placeholder?: string, multiline?: boolean) => (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={(currentTexts[key] as string) || ''}
          onChange={(e) => updateTexts(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={(currentTexts[key] as string) || ''}
          onChange={(e) => updateTexts(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='rules' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Game Settings
          </button>
          {!hideTextAndColors && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('texts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='texts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Game Texts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('colors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='colors' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Colors & Styling
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {activeTab === 'rules' ? 'Game Settings & Configuration' : activeTab === 'texts' ? 'Customize Game Texts' : 'Customize Colors'}
        </h3>
        <button
          type="button"
          onClick={resetToDefaults}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-500 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          Reset to Defaults
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Gameplay Settings */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <span>Gameplay Settings</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flips Per Round</label>
                <select
                  value={currentSettings.maxFlipsPerAttempt}
                  onChange={(e) => updateSettings('maxFlipsPerAttempt', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[3,4,5,6,7].map(num => (<option key={num} value={num} className="bg-white text-black">{num} flips</option>))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Number of cards a player can flip each round</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={currentSettings.theme}
                  onChange={(e) => updateSettings('theme', e.target.value as StarsHexaSettings['theme'])}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default" className="bg-white text-black">Default</option>
                  <option value="colorful" className="bg-white text-black">Colorful</option>
                  <option value="minimal" className="bg-white text-black">Minimal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Visual theme for the game surface</p>
              </div>
              <div className="flex items-end">
                <div className="w-full p-3 bg-white rounded-lg border text-sm text-gray-700">
                  Player gets <strong>{currentSettings.maxFlipsPerAttempt} flips</strong> per round. Hidden stars: <strong>{starsCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Icons & Emoji */}
          <div className="bg-amber-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">😀</span>
              <span>Icons & Emoji</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Win Emoji (e.g., star)</label>
                <input
                  type="text"
                  value={currentSettings.winEmoji}
                  onChange={(e) => updateSettings('winEmoji', e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="⭐️"
                />
                <p className="text-xs text-gray-500 mt-1">Shown on winning tiles (e.g., fish 🐟)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lose Emoji (e.g., mushroom)</label>
                <input
                  type="text"
                  value={currentSettings.loseEmoji}
                  onChange={(e) => updateSettings('loseEmoji', e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="🍄"
                />
                <p className="text-xs text-gray-500 mt-1">Shown on non-winning tiles (e.g., chips 🍟)</p>
              </div>
            </div>
          </div>
          
          {/* Hexagon Cards Editor */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔷</span>
              <span>Hexagon Cards (7)</span>
            </h4>
            <p className="text-sm text-gray-600 mb-4">Configure each card's label and whether it contains a hidden star</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hexagons.map((hex, index) => (
                <div key={hex.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Card {index + 1}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hex.hasHiddenStar}
                        onChange={(e) => updateHexagon(index, 'hasHiddenStar', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"
                      />
<span className="text-sm text-gray-600">{hex.hasHiddenStar ? `Has ${currentSettings.winEmoji || '⭐️'}` : `Has ${currentSettings.loseEmoji || '🍄'}`}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={hex.text}
                    onChange={(e) => updateHexagon(index, 'text', e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
                    placeholder={`Text for card ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            {starsCount === 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">You need at least one card with a hidden star!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!hideTextAndColors && activeTab === 'texts' && (
        <div className="space-y-8">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">🎯 Welcome</h4>
            <p className="text-sm text-gray-600 mb-4">Texts shown on the Welcome screen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Welcome Title', 'welcomeTitle', 'Welcome to Hexa')}
              {renderField('Welcome Subtitle', 'welcomeSubtitle', 'Find all the hidden stars to win!')}
              {renderField('Start Button', 'ctaStart', 'Start')}
              {renderField('Guest Button', 'ctaGuest', 'Try Without Registration')}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">📋 Rules</h4>
            <p className="text-sm text-gray-600 mb-4">Texts shown on the Rules screen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Rules Title', 'rulesTitle', 'Game Rules')}
              {renderField('Rules Body (multi-line)', 'rulesBody', 'Flip cards to find hidden stars\nYou have limited flips per round', true)}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">🏆 Result</h4>
            <p className="text-sm text-gray-600 mb-4">Texts shown on the result screen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Result Title', 'resultTitle', 'Game Results')}
              {renderField('Invite Friends CTA', 'resultInviteCTA', 'Invite Friends')}
              {renderField('Play Again CTA', 'resultPlayAgainCTA', 'Play Again')}
              {renderField('Partner CTA', 'resultPartnerCTA', 'Visit Partner')}
            </div>
          </div>
        </div>
      )}

      {!hideTextAndColors && activeTab === 'colors' && (
        <div className="space-y-8">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">🎨 Palette</h4>
            <p className="text-sm text-gray-600 mb-4">Colors for primary UI elements</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary</label>
                <input
                  type="text"
                  value={currentColors.palette?.primary || ''}
                  onChange={(e) => updateColor('primary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#0EA5E9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent</label>
                <input
                  type="text"
                  value={currentColors.palette?.accent || ''}
                  onChange={(e) => updateColor('accent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#F59E0B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                <input
                  type="text"
                  value={currentColors.palette?.bg || ''}
                  onChange={(e) => updateColor('bg', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#0B1220"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <input
                  type="text"
                  value={currentColors.palette?.text || ''}
                  onChange={(e) => updateColor('text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
