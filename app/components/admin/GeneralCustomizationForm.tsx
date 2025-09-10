'use client'

import React from 'react'

interface GeneralCustomizationFormProps {
  texts: Record<string, any>
  colors: Record<string, any>
  onTextsChange: (next: Record<string, any>) => void
  onColorsChange: (next: Record<string, any>) => void
}

// GeneralCustomizationForm — Shared general blocks for ALL games
// What: Provides General Text Blocks and General Color Blocks independent of game type.
// Why: Enforces consistent admin UX and centralizes non-game-specific copy and styling.
export default function GeneralCustomizationForm({ texts, colors, onTextsChange, onColorsChange }: GeneralCustomizationFormProps) {
  const updateText = (key: string, value: string) => {
    onTextsChange({ ...texts, [key]: value })
  }

  const updateColor = (key: string, value: string) => {
    onColorsChange({ ...colors, [key]: value })
  }

  const get = (obj: Record<string, any>, key: string, fallback = '') => (obj?.[key] ?? fallback) as string

  return (
    <div className="space-y-8">
      {/* GENERAL TEXT BLOCKS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">General Text Blocks</h2>

        {/* 🎯 Welcome & Registration */}
        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">🎯 Welcome & Registration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Title (Scoreboard / Header)</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameTitle')} onChange={(e)=>updateText('gameTitle', e.target.value)} placeholder="Game Title"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name Placeholder</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'namePlaceholder')} onChange={(e)=>updateText('namePlaceholder', e.target.value)} placeholder="Enter your name"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Placeholder</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'emailPlaceholder')} onChange={(e)=>updateText('emailPlaceholder', e.target.value)} placeholder="your@email.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Placeholder</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'phonePlaceholder')} onChange={(e)=>updateText('phonePlaceholder', e.target.value)} placeholder="+1 (555) 123-4567"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Required Error</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'contactRequiredError')} onChange={(e)=>updateText('contactRequiredError', e.target.value)} placeholder="Please provide either email or phone number"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Playing Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'startPlayingButton')} onChange={(e)=>updateText('startPlayingButton', e.target.value)} placeholder="Start Playing"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Try Without Registration Text</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'tryWithoutRegText')} onChange={(e)=>updateText('tryWithoutRegText', e.target.value)} placeholder="Want to try without registration?"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Try Without Registration Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'tryWithoutRegButton')} onChange={(e)=>updateText('tryWithoutRegButton', e.target.value)} placeholder="Try Without Registration"/>
            </div>
          </div>
        </div>

        {/* 📋 Game Rules & Description */}
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">📋 Game Rules & Description</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Rules Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameRulesTitle')} onChange={(e)=>updateText('gameRulesTitle', e.target.value)} placeholder="Game Rules:"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Play Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'playButton')} onChange={(e)=>updateText('playButton', e.target.value)} placeholder="PLAY"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Rules Text (multi-line)</label>
              <textarea className="w-full px-3 py-2 border rounded-md min-h-24" value={get(texts,'gameRulesText')} onChange={(e)=>updateText('gameRulesText', e.target.value)} placeholder={'Select 5 players...\nIf draw, Visitor WINS!'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Win Conditions Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'winConditionsTitle')} onChange={(e)=>updateText('winConditionsTitle', e.target.value)} placeholder="Win Conditions:"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Win Conditions Text (multi-line)</label>
              <textarea className="w-full px-3 py-2 border rounded-md min-h-24" value={get(texts,'winConditionsText')} onChange={(e)=>updateText('winConditionsText', e.target.value)} placeholder={'Score more than opponent...'} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Description</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameDescription')} onChange={(e)=>updateText('gameDescription', e.target.value)} placeholder="Describe your game..."/>
            </div>
          </div>
        </div>

        {/* 🏆 Result Page & Result Messages */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">🏆 Result Page & Result Messages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Results Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameResultsTitle')} onChange={(e)=>updateText('gameResultsTitle', e.target.value)} placeholder="GAME RESULTS"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Play Again Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'playAgainButton')} onChange={(e)=>updateText('playAgainButton', e.target.value)} placeholder="Play Again"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Share with Friends Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'shareWithFriendsButton')} onChange={(e)=>updateText('shareWithFriendsButton', e.target.value)} placeholder="Share with Friends"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Victory Result Message</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'victoryResultMessage')} onChange={(e)=>updateText('victoryResultMessage', e.target.value)} placeholder="Fantastic! You won..."/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defeat Result Message</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'defeatResultMessage')} onChange={(e)=>updateText('defeatResultMessage', e.target.value)} placeholder="Good effort! You lost..."/>
            </div>
          </div>
        </div>

        {/* 📊 Win/Loss Messages */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">📊 Win/Loss Messages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defeat Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'defeatTitle')} onChange={(e)=>updateText('defeatTitle', e.target.value)} placeholder="Defeat!"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Victory Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'victoryTitle')} onChange={(e)=>updateText('victoryTitle', e.target.value)} placeholder="Victory!"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Draw Message</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'drawMessage')} onChange={(e)=>updateText('drawMessage', e.target.value)} placeholder="DRAW"/>
            </div>
          </div>
        </div>

        {/* ⚠️ Loading & Error Messages */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-2">⚠️ Loading & Error Messages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loading Game Text</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'loadingGameText')} onChange={(e)=>updateText('loadingGameText', e.target.value)} placeholder="Loading game..."/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Not Found Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameNotFoundTitle')} onChange={(e)=>updateText('gameNotFoundTitle', e.target.value)} placeholder="Game Not Found"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Not Found Message</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameNotFoundMessage')} onChange={(e)=>updateText('gameNotFoundMessage', e.target.value)} placeholder="The game you're looking for..."/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Try Again Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'tryAgainButton')} onChange={(e)=>updateText('tryAgainButton', e.target.value)} placeholder="Try Again"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type Not Supported Title</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameTypeNotSupportedTitle')} onChange={(e)=>updateText('gameTypeNotSupportedTitle', e.target.value)} placeholder="Game Type Not Supported"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type Not Supported Message</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(texts,'gameTypeNotSupportedMessage')} onChange={(e)=>updateText('gameTypeNotSupportedMessage', e.target.value)} placeholder="This game type is not yet supported..."/>
            </div>
          </div>
        </div>
      </div>

      {/* GENERAL COLOR BLOCKS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">General Color Blocks</h2>

        {/* 🎨 Background Colors */}
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">🎨 Background Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Background</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'pageBackground')} onChange={(e)=>updateColor('pageBackground', e.target.value)} placeholder="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block Background</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'blockBackground')} onChange={(e)=>updateColor('blockBackground', e.target.value)} placeholder="bg-white/10 backdrop-blur-sm"/>
            </div>
          </div>
        </div>

        {/* 🔘 Button Colors */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">🔘 Button Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'primaryButton')} onChange={(e)=>updateColor('primaryButton', e.target.value)} placeholder="bg-gradient-to-r from-green-600 to-emerald-600 ..."/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'secondaryButton')} onChange={(e)=>updateColor('secondaryButton', e.target.value)} placeholder="bg-gradient-to-r from-blue-600 to-purple-600 ..."/>
            </div>
          </div>
        </div>

        {/* ⚽ Game Field Colors */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 mb-2">⚽ Game Field Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Score Card</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'homeScoreCard','#c00000')} onChange={(e)=>updateColor('homeScoreCard', e.target.value)} placeholder="#c00000"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Score Card</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'visitorScoreCard','#0066cc')} onChange={(e)=>updateColor('visitorScoreCard', e.target.value)} placeholder="#0066cc"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Field</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'gameField','#2ecc71')} onChange={(e)=>updateColor('gameField', e.target.value)} placeholder="#2ecc71"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player Card</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'playerCard','#c00000')} onChange={(e)=>updateColor('playerCard', e.target.value)} placeholder="#c00000"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Failed Penalty</label>
              <input className="w-full px-3 py-2 border rounded-md" value={get(colors,'failedPenalty','#ffffff')} onChange={(e)=>updateColor('failedPenalty', e.target.value)} placeholder="#ffffff"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

