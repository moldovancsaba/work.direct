'use client'

import React, { useState, useCallback, useEffect } from 'react'

interface PenaltyTexts {
  // Basic game info
  title: string
  description: string
  // Registration texts
  gameTitle: string
  namePlaceholder: string
  emailPlaceholder: string
  phonePlaceholder: string
  contactRequiredError: string
  startPlayingButton: string
  tryWithoutRegText: string
  tryWithoutRegButton: string
  
  // Game texts
  gameRulesTitle: string // Renamed from howToPlayButton
  gameRulesText: string
  winConditionsTitle: string
  winConditionsText: string
  gameDescription: string
  playButton: string
  
  // Result page texts
  gameResultsTitle: string
  playAgainButton: string
  shareWithFriendsButton: string
  shareResultTitle: string
  copyLinkButton: string
  shareButton: string
  congratulationsText: string
  gameOverText: string
  inviteFriendsButton: string // Add invite friends functionality
  
  // Result message emojis and texts
  victoryResultEmoji: string
  defeatResultEmoji: string
  victoryResultMessage: string
  defeatResultMessage: string
  
  // Labels and UI elements
  yourGoalsLabel: string
  opponentGoalsLabel: string
  starsFoundLabel: string
  roundsUsedLabel: string
  
  // Win/Loss texts (legacy - keeping for backwards compatibility)
  defeatIcon: string
  defeatTitle: string
  trialModeIndicator: string
  visitorWinMessage: string
  drawIcon: string
  drawMessage: string
  visitorPenaltyWinMessage: string
  victoryIcon: string
  victoryTitle: string
  homeWinMessage: string
  
  // Loading and Error texts
  loadingGameText: string
  gameNotFoundTitle: string
  gameNotFoundMessage: string
  tryAgainButton: string
  gameTypeNotSupportedTitle: string
  gameTypeNotSupportedMessage: string
}

interface PenaltyColors {
  // Background colors
  pageBackground: string
  blockBackground: string
  
  // Button colors
  primaryButton: string
  secondaryButton: string
  
  // Game field colors
  homeScoreCard: string
  visitorScoreCard: string
  gameField: string
  playerCard: string
  failedPenalty: string
}

interface PenaltyGameSettings {
  totalPlayers: number        // Total team size (11 players in formation)
  penaltyShots: number        // Number of penalty shots to select (5)
  successfulShots: number     // Number of hexagons that contain goals (7)
  missedShots: number         // Number of hexagons that contain misses (4)
}

interface PenaltyCustomizationFormProps {
  texts?: Partial<PenaltyTexts>
  colors?: Partial<PenaltyColors>
  gameSettings?: PenaltyGameSettings
  gameData?: {
    title?: string
    description?: string
  }
  onChange: (texts: Partial<PenaltyTexts>, colors: Partial<PenaltyColors>, gameSettings: PenaltyGameSettings) => void
  onGameDataChange?: (gameData: { title: string; description: string }) => void
  hideTextAndColors?: boolean
}

// Default values
const defaultTexts: PenaltyTexts = {
  // Basic game info
  title: 'My Penalty Shootout Game',
  description: 'An exciting penalty shootout game with customizable rules and rewards',
  // Registration texts
  gameTitle: 'DVTK Büntető Párbaj',
  namePlaceholder: 'Enter your name',
  emailPlaceholder: 'your@email.com',
  phonePlaceholder: '+1 (555) 123-4567',
  contactRequiredError: 'Please provide either email or phone number',
  startPlayingButton: 'Start Playing',
  tryWithoutRegText: 'Want to try without registration?',
  tryWithoutRegButton: 'Try Without Registration',
  
  // Game texts
  gameRulesTitle: 'Game Rules:', // Renamed from howToPlayButton
  gameRulesText: 'Select 5 players from 11 team members\nIf draw, Visitor WINS!',
  winConditionsTitle: 'Win Conditions:',
  winConditionsText: 'Score more goals than opponent\nSelect players wisely - you can\'t see who scores until selected\nIn overtime: first team to score more wins',
  gameDescription: 'Válaszd ki a büntetőpárbajban részt vevő játékosokat és ha győzöl megkaphatod a DVTK FanZone ajándékok egyikét',
  playButton: 'PLAY',
  
  // Result page texts
  gameResultsTitle: 'GAME RESULTS',
  playAgainButton: 'Play Again',
  shareWithFriendsButton: 'Share with Friends',
  shareResultTitle: 'Share Your Result',
  copyLinkButton: 'Copy Link',
  shareButton: 'Share',
  congratulationsText: 'Congratulations!',
  gameOverText: 'Game Over',
  inviteFriendsButton: 'Invite Friends',
  
  // Result message emojis and texts
  victoryResultEmoji: '',
  defeatResultEmoji: '',
  victoryResultMessage: 'Fantastic! You won the penalty shootout',
  defeatResultMessage: 'Good effort! You lost the penalty shootout. Try again!',
  
  // Labels and UI elements
  yourGoalsLabel: 'Your Goals',
  opponentGoalsLabel: 'Opponent Goals',
  starsFoundLabel: 'Stars Found',
  roundsUsedLabel: 'Rounds Used',
  
  // Win/Loss texts (legacy - keeping for backwards compatibility)
  defeatIcon: '',
  defeatTitle: 'Defeat!',
  trialModeIndicator: 'Trial Mode',
  visitorWinMessage: 'VISITOR won the penalty shootout',
  drawIcon: '',
  drawMessage: 'DRAW',
  visitorPenaltyWinMessage: 'VISITOR wins on penalties!',
  victoryIcon: '',
  victoryTitle: 'Victory! You won',
  homeWinMessage: 'HOME won the penalty shootout',
  
  // Loading and Error texts
  loadingGameText: 'Loading game...',
  gameNotFoundTitle: 'Game Not Found',
  gameNotFoundMessage: 'The game you\'re looking for doesn\'t exist or is no longer available.',
  tryAgainButton: 'Try Again',
  gameTypeNotSupportedTitle: 'Game Type Not Supported',
  gameTypeNotSupportedMessage: 'This game type is not yet supported in the play interface.'
}

const defaultColors: PenaltyColors = {
  // Background colors
  pageBackground: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
  blockBackground: 'bg-white/10 backdrop-blur-sm',
  
  // Button colors
  primaryButton: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
  secondaryButton: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
  
  // Game field colors
  homeScoreCard: '#c00000',
  visitorScoreCard: '#0066cc',
  gameField: '#2ecc71',
  playerCard: '#c00000',
  failedPenalty: '#ffffff'
}

// Default penalty game settings
const defaultGameSettings: PenaltyGameSettings = {
  totalPlayers: 11,       // Total team size (11 players in formation)
  penaltyShots: 5,        // Number of penalty shots to select
  successfulShots: 7,     // Number of hexagons that contain goals  
  missedShots: 4          // Number of hexagons that contain misses (calculated: totalPlayers - successfulShots)
}

// Field configuration with proper numbering and organization
const fieldConfig = {
  basicInfo: [
    { key: 'title', label: '1. Game Title *', placeholder: 'My Penalty Shootout Game', description: 'The main title of your game', required: true },
    { key: 'description', label: '2. Description', placeholder: 'An exciting penalty shootout game with customizable rules and rewards', description: 'Optional description of your game', multiline: true }
  ],
  registration: [
    { key: 'gameTitle', label: '3. Game Title (Scoreboard text)', placeholder: 'DVTK Büntető Párbaj', description: 'Shows in the flip cards at top of screen' },
    { key: 'namePlaceholder', label: '4. Name Placeholder', placeholder: 'Enter your name', description: 'Placeholder text in name input field' },
    { key: 'emailPlaceholder', label: '5. Email Placeholder', placeholder: 'your@email.com', description: 'Placeholder text in email input field' },
    { key: 'phonePlaceholder', label: '6. Phone Placeholder', placeholder: '+1 (555) 123-4567', description: 'Placeholder text in phone input field' },
    { key: 'contactRequiredError', label: '7. Contact Required Error', placeholder: 'Please provide either email or phone number', description: 'Error message when no contact info provided' },
    { key: 'startPlayingButton', label: '8. Start Playing Button', placeholder: 'Start Playing', description: 'Main registration submit button text' },
    { key: 'tryWithoutRegText', label: '9. Try Without Registration Text', placeholder: 'Want to try without registration?', description: 'Text above trial mode button' },
    { key: 'tryWithoutRegButton', label: '10. Try Without Registration Button', placeholder: 'Try Without Registration', description: 'Trial mode button text' }
  ],
  gameRules: [
    { key: 'gameRulesTitle', label: '11. Game Rules Title', placeholder: 'Game Rules:', description: 'Title for game rules section' },
    { key: 'gameRulesText', label: '12. Game Rules Text (multi-line)', placeholder: 'Select 5 players from 11 team members\nIf draw, Visitor WINS!', description: 'Detailed game rules text', multiline: true },
    { key: 'winConditionsTitle', label: '13. Win Conditions Title', placeholder: 'Win Conditions:', description: 'Title for win conditions section' },
    { key: 'winConditionsText', label: '14. Win Conditions Text (multi-line)', placeholder: 'Score more goals than opponent\nSelect players wisely - you can\'t see who scores until selected\nIn overtime: first team to score more wins', description: 'Detailed win conditions', multiline: true },
    { key: 'gameDescription', label: '15. Game Description', placeholder: 'Válaszd ki a büntetőpárbajban részt vevő játékosokat és ha győzöl megkaphatod a DVTK FanZone ajándékok egyikét', description: 'Main game description text' },
    { key: 'playButton', label: '16. Play Button', placeholder: 'PLAY', description: 'Button to start the game' }
  ],
  resultPage: [
    { key: 'gameResultsTitle', label: '17. Game Results Title (Scoreboard text)', placeholder: 'GAME RESULTS', description: 'Title shown on results screen' },
    { key: 'playAgainButton', label: '18. Play Again Button (Main action button)', placeholder: 'Play Again', description: 'Button to restart game' },
    { key: 'shareWithFriendsButton', label: '19. Share with Friends Button', placeholder: 'Share with Friends', description: 'Social sharing button' },
    { key: 'shareResultTitle', label: '20. Share Result Title', placeholder: 'Share Your Result', description: 'Title for sharing section' },
    { key: 'copyLinkButton', label: '21. Copy Link Button', placeholder: 'Copy Link', description: 'Button to copy game link' },
    { key: 'shareButton', label: '22. Share Button', placeholder: 'Share', description: 'General share button' },
    { key: 'congratulationsText', label: '23. Congratulations Text (Victory title)', placeholder: 'Congratulations!', description: 'Victory congratulations text' },
    { key: 'gameOverText', label: '24. Game Over Text (Defeat title)', placeholder: 'Game Over', description: 'Game over text for defeat' },
    { key: 'inviteFriendsButton', label: '25. Invite Friends Button', placeholder: 'Invite Friends', description: 'Button to invite friends to play' }
  ],
  resultMessages: [
    { key: 'victoryResultEmoji', label: '26. Victory Result Emoji (Victory icon)', placeholder: '', description: 'Emoji shown on victory results screen' },
    { key: 'defeatResultEmoji', label: '27. Defeat Result Emoji (Defeat icon)', placeholder: '', description: 'Emoji shown on defeat results screen' },
    { key: 'victoryResultMessage', label: '28. Victory Result Message (Victory text)', placeholder: 'Fantastic! You won the penalty shootout', description: 'Message shown when user wins (without score)' },
    { key: 'defeatResultMessage', label: '29. Defeat Result Message (Defeat text)', placeholder: 'Good effort! You lost the penalty shootout. Try again!', description: 'Message shown when user loses (without score)' }
  ],
  legacyWinLoss: [
    { key: 'defeatIcon', label: '30. Defeat Icon', placeholder: '', description: 'Icon shown with defeat' },
    { key: 'defeatTitle', label: '31. Defeat Title', placeholder: 'Defeat!', description: 'Title for defeat state' },
    { key: 'trialModeIndicator', label: '32. Trial Mode Indicator', placeholder: 'Trial Mode', description: 'Indicator for trial mode' },
    { key: 'visitorWinMessage', label: '33. Visitor Win Message', placeholder: 'VISITOR won the penalty shootout', description: 'Message when visitor wins' },
    { key: 'drawIcon', label: '34. Draw Icon', placeholder: '', description: 'Icon for draw/tie' },
    { key: 'drawMessage', label: '35. Draw Message', placeholder: 'DRAW', description: 'Message for draw/tie' },
    { key: 'visitorPenaltyWinMessage', label: '36. Visitor Penalty Win Message', placeholder: 'VISITOR wins on penalties!', description: 'Message when visitor wins on penalties' },
    { key: 'victoryIcon', label: '37. Victory Icon', placeholder: '', description: 'Icon shown with victory' },
    { key: 'victoryTitle', label: '38. Victory Title', placeholder: 'Victory! You won', description: 'Title for victory state' },
    { key: 'homeWinMessage', label: '39. Home Win Message', placeholder: 'HOME won the penalty shootout', description: 'Message when home team wins' }
  ],
  loadingAndErrors: [
    { key: 'loadingGameText', label: '40. Loading Game Text (Loading screen)', placeholder: 'Loading game...', description: 'Text shown while game loads' },
    { key: 'gameNotFoundTitle', label: '41. Game Not Found Title (Error screen title)', placeholder: 'Game Not Found', description: 'Title for game not found error' },
    { key: 'gameNotFoundMessage', label: '42. Game Not Found Message (Error description)', placeholder: 'The game you\'re looking for doesn\'t exist or is no longer available.', description: 'Description for game not found error' },
    { key: 'tryAgainButton', label: '43. Try Again Button (Error retry button)', placeholder: 'Try Again', description: 'Button to retry after error' },
    { key: 'gameTypeNotSupportedTitle', label: '44. Game Type Not Supported Title (Unsupported game)', placeholder: 'Game Type Not Supported', description: 'Title for unsupported game type' },
    { key: 'gameTypeNotSupportedMessage', label: '45. Game Type Not Supported Message (Unsupported description)', placeholder: 'This game type is not yet supported in the play interface.', description: 'Description for unsupported game type' }
  ]
}

export default function PenaltyCustomizationForm({ texts = {}, colors = {}, gameSettings = defaultGameSettings, gameData = {}, onChange, onGameDataChange, hideTextAndColors = false }: PenaltyCustomizationFormProps) {
  const [currentTexts, setCurrentTexts] = useState<Partial<PenaltyTexts>>({ 
    ...defaultTexts, 
    ...texts,
    title: gameData.title || texts.title || defaultTexts.title,
    description: gameData.description || texts.description || defaultTexts.description
  })
  const [currentColors, setCurrentColors] = useState<Partial<PenaltyColors>>({ ...defaultColors, ...colors })
  const [currentGameSettings, setCurrentGameSettings] = useState<PenaltyGameSettings>({ ...defaultGameSettings, ...gameSettings })
  const [activeTab, setActiveTab] = useState<'rules' | 'texts' | 'colors'>('rules')

  // Update currentTexts when props change
  useEffect(() => {
    setCurrentTexts({
      ...defaultTexts,
      ...texts,
      title: gameData.title || texts.title || defaultTexts.title,
      description: gameData.description || texts.description || defaultTexts.description
    })
  }, [texts, gameData.title, gameData.description])
  
  // Update currentColors when colors prop changes
  useEffect(() => {
    setCurrentColors({ ...defaultColors, ...colors })
  }, [colors])
  
  // Update currentGameSettings when gameSettings prop changes
  useEffect(() => {
    setCurrentGameSettings({ ...defaultGameSettings, ...gameSettings })
  }, [gameSettings])

  const updateTexts = useCallback((key: keyof PenaltyTexts, value: string) => {
    console.log('🎨 PenaltyForm - Field changed:', key, '=', value)
    
    const newTexts = { ...currentTexts, [key]: value }
    setCurrentTexts(newTexts)
    
    console.log('💾 PenaltyForm - Calling onChange with:', newTexts)
    onChange(newTexts, currentColors, currentGameSettings)
    
    // Handle game data changes for title and description
    if ((key === 'title' || key === 'description') && onGameDataChange) {
      console.log('📝 PenaltyForm - Calling onGameDataChange')
      onGameDataChange({
        title: key === 'title' ? value : (newTexts.title || ''),
        description: key === 'description' ? value : (newTexts.description || '')
      })
    }
  }, [currentTexts, currentColors, onChange, onGameDataChange])

  const updateColors = useCallback((key: keyof PenaltyColors, value: string) => {
    const newColors = { ...currentColors, [key]: value }
    setCurrentColors(newColors)
    onChange(currentTexts, newColors, currentGameSettings)
  }, [currentTexts, currentColors, currentGameSettings, onChange])

  const updateGameSettings = useCallback((key: keyof PenaltyGameSettings, value: number) => {
    let newSettings = { ...currentGameSettings, [key]: value }
    
    // Auto-calculate missedShots when totalPlayers or successfulShots change
    if (key === 'totalPlayers' || key === 'successfulShots') {
      const totalPlayers = key === 'totalPlayers' ? value : newSettings.totalPlayers
      const successfulShots = key === 'successfulShots' ? value : newSettings.successfulShots
      newSettings.missedShots = Math.max(0, totalPlayers - successfulShots)
    }
    
    setCurrentGameSettings(newSettings)
    onChange(currentTexts, currentColors, newSettings)
  }, [currentTexts, currentColors, currentGameSettings, onChange])

  const resetToDefaults = () => {
    if (activeTab === 'rules') {
      setCurrentGameSettings(defaultGameSettings)
      onChange(currentTexts, currentColors, defaultGameSettings)
    } else if (activeTab === 'texts') {
      setCurrentTexts(defaultTexts)
      onChange(defaultTexts, currentColors, currentGameSettings)
    } else if (activeTab === 'colors') {
      setCurrentColors(defaultColors)
      onChange(currentTexts, defaultColors, currentGameSettings)
    }
  }

  const renderTextField = (config: any, value: string) => {
    // Show the actual saved value or the default value
    const defaultValue = defaultTexts[config.key as keyof PenaltyTexts] || ''
    const displayValue = value || defaultValue
    
    if (config.multiline) {
      return (
        <textarea
          value={displayValue}
          onChange={(e) => updateTexts(config.key as keyof PenaltyTexts, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
          placeholder={config.placeholder}
          rows={3}
        />
      )
    }

    return (
      <input
        type="text"
        value={displayValue}
        onChange={(e) => updateTexts(config.key as keyof PenaltyTexts, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={config.placeholder}
      />
    )
  }

  const renderFieldGroup = (groupKey: string, groupConfig: any[], groupTitle: string, groupDescription: string, bgColor: string) => (
    <div key={groupKey} className={`${bgColor} p-4 rounded-lg`}>
      <h4 className="text-md font-medium text-gray-800 mb-2">{groupTitle}</h4>
      <p className="text-sm text-gray-600 mb-4">{groupDescription}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupConfig.map((fieldConfig) => (
          <div key={fieldConfig.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldConfig.label}
            </label>
            <p className="text-xs text-gray-500 mb-2">{fieldConfig.description}</p>
            {renderTextField(fieldConfig, currentTexts[fieldConfig.key as keyof PenaltyTexts] || '')}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Game Settings
          </button>
          {!hideTextAndColors && (
            <>
              <button
                type="button"
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
                type="button"
                onClick={() => setActiveTab('colors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'colors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
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
          {/* Team Configuration */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span>Team Configuration</span>
            </h4>
            <p className="text-sm text-gray-600 mb-4">Configure the team size and formation for your penalty game</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Players in Formation
                </label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  value={currentGameSettings.totalPlayers}
                  onChange={(e) => updateGameSettings('totalPlayers', parseInt(e.target.value) || 11)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Number of players displayed in team formation (5-15)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penalty Shots to Select
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentGameSettings.totalPlayers}
                  value={currentGameSettings.penaltyShots}
                  onChange={(e) => updateGameSettings('penaltyShots', parseInt(e.target.value) || 5)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">How many players the user must select for penalties</p>
              </div>
            </div>
          </div>

          {/* Scoring Configuration */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span>Scoring Distribution</span>
            </h4>
            <p className="text-sm text-gray-600 mb-4">Set how many players will score goals vs miss penalties</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Successful Penalties (Goals)
                </label>
                <input
                  type="number"
                  min="0"
                  max={currentGameSettings.totalPlayers}
                  value={currentGameSettings.successfulShots}
                  onChange={(e) => updateGameSettings('successfulShots', parseInt(e.target.value) || 7)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Number of players who will score if selected</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failed Penalties (Misses)
                </label>
                <input
                  type="number"
                  value={currentGameSettings.missedShots}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically calculated: Total Players - Successful Penalties</p>
              </div>
            </div>
            
            {/* Success Rate Preview */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h5 className="font-medium text-gray-800 mb-3">Success Rate Preview</h5>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">
                  Goals: {currentGameSettings.successfulShots} ({Math.round((currentGameSettings.successfulShots / currentGameSettings.totalPlayers) * 100)}%)
                </span>
                <span className="text-red-600 font-medium">
                  Misses: {currentGameSettings.missedShots} ({Math.round((currentGameSettings.missedShots / currentGameSettings.totalPlayers) * 100)}%)
                </span>
              </div>
              
              {/* Visual bar representation */}
              <div className="mt-3 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${(currentGameSettings.successfulShots / currentGameSettings.totalPlayers) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {currentGameSettings.successfulShots > currentGameSettings.totalPlayers && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800 font-medium">Configuration Error</span>
              </div>
              <p className="text-red-700 mt-1">Successful penalties cannot exceed total players in formation.</p>
            </div>
          )}
          
          {currentGameSettings.penaltyShots > currentGameSettings.totalPlayers && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800 font-medium">Configuration Error</span>
              </div>
              <p className="text-red-700 mt-1">Penalty shots to select cannot exceed total players in formation.</p>
            </div>
          )}
          
          {/* Game Impact Summary */}
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span>Game Impact Summary</span>
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Players will choose <strong>{currentGameSettings.penaltyShots} players</strong> from a <strong>{currentGameSettings.totalPlayers}-player formation</strong></p>
              <p>• Maximum possible user score: <strong>{Math.min(currentGameSettings.penaltyShots, currentGameSettings.successfulShots)} goals</strong></p>
              <p>• Minimum possible user score: <strong>{Math.max(0, currentGameSettings.penaltyShots - currentGameSettings.missedShots)} goals</strong></p>
              <p>• Success probability per selection: <strong>{Math.round((currentGameSettings.successfulShots / currentGameSettings.totalPlayers) * 100)}%</strong></p>
            </div>
          </div>
        </div>
      )}

      {!hideTextAndColors && activeTab === 'texts' && (
        <div className="space-y-8">
          {renderFieldGroup('basicInfo', fieldConfig.basicInfo, '🎯 Basic Information', 'Core game information that appears across your game', 'bg-slate-50')}
          {renderFieldGroup('registration', fieldConfig.registration, '📝 Registration Page', 'These texts appear on the first screen where players enter their details', 'bg-blue-50')}
          {renderFieldGroup('gameRules', fieldConfig.gameRules, '📋 Game Rules & Description', 'These texts appear on the rules/how-to-play screen', 'bg-purple-50')}
          {renderFieldGroup('resultPage', fieldConfig.resultPage, '🏆 Result Page', 'These texts appear on the results screen after the game ends', 'bg-yellow-50')}
          {renderFieldGroup('resultMessages', fieldConfig.resultMessages, '🏆 Result Messages', 'Emojis and messages shown on the results screen', 'bg-orange-50')}
          {renderFieldGroup('legacyWinLoss', fieldConfig.legacyWinLoss, '📊 Win/Loss Messages', 'Legacy win/loss messages kept for backwards compatibility', 'bg-gray-50')}
          {renderFieldGroup('loadingAndErrors', fieldConfig.loadingAndErrors, '⚠️ Loading & Error Messages', 'These texts appear during loading states and error conditions', 'bg-red-50')}
        </div>
      )}

      {!hideTextAndColors && activeTab === 'colors' && (
        <div className="space-y-8">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">🎨 Background Colors</h4>
            <p className="text-sm text-gray-600 mb-4">Colors for backgrounds and containers</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Background</label>
                <input
                  type="text"
                  value={currentColors.pageBackground || ''}
                  onChange={(e) => updateColors('pageBackground', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block Background</label>
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

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">🔘 Button Colors</h4>
            <p className="text-sm text-gray-600 mb-4">Colors for buttons and interactive elements</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
                <input
                  type="text"
                  value={currentColors.primaryButton || ''}
                  onChange={(e) => updateColors('primaryButton', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-800 mb-2">⚽ Game Field Colors</h4>
            <p className="text-sm text-gray-600 mb-4">Colors for game elements and scoreboards</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Home Score Card</label>
                <input
                  type="color"
                  value={currentColors.homeScoreCard || '#c00000'}
                  onChange={(e) => updateColors('homeScoreCard', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Score Card</label>
                <input
                  type="color"
                  value={currentColors.visitorScoreCard || '#0066cc'}
                  onChange={(e) => updateColors('visitorScoreCard', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Field</label>
                <input
                  type="color"
                  value={currentColors.gameField || '#2ecc71'}
                  onChange={(e) => updateColors('gameField', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Card</label>
                <input
                  type="color"
                  value={currentColors.playerCard || '#c00000'}
                  onChange={(e) => updateColors('playerCard', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Failed Penalty</label>
                <input
                  type="color"
                  value={currentColors.failedPenalty || '#ffffff'}
                  onChange={(e) => updateColors('failedPenalty', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
