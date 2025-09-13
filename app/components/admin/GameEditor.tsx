'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PenaltyCustomizationForm from './PenaltyCustomizationForm 2'
import StarsHexaCustomizationForm from './StarsHexaCustomizationForm 2'
import GeneralCustomizationForm from './GeneralCustomizationForm'
import PlatformSettingsForm from './PlatformSettingsForm'
import { GameType } from '../../types'

interface HexagonCard {
  id: string
  text: string
  hasHiddenStar: boolean
  color?: string
}

interface RewardConfig {
  title: string
  description: string
  type: 'DISCOUNT' | 'FREEBIE' | 'POINTS'
  value: number
  maxQuantity: number
  isActive: boolean
}

interface GameEditorProps {
  mode: 'create' | 'edit'
  gameId?: string
  initialGameType?: GameType
  hideTypeSelect?: boolean
}

// GameEditor — unified layout for creating or editing games
// What: A single layout/component that mirrors the edit page UI and can operate
//       in create or edit mode.
// Why: Ensures consistent admin UX and satisfies the requirement for a single
//       layout (use edit layout) while reusing existing components.
export default function GameEditor({ mode, gameId, initialGameType, hideTypeSelect = false }: GameEditorProps) {
  const router = useRouter()

  // Shared state
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Game meta
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
const [gameType, setGameType] = useState<GameType>(initialGameType || 'STARS_HEXA')

  // Common configuration
  const [maxRounds, setMaxRounds] = useState(3)

// Platform Settings
const [platformTexts, setPlatformTexts] = useState<Record<string, string>>({})
const [platformStyles, setPlatformStyles] = useState<Record<string, any>>({})

  // Stars Hexa configuration (edit layout form parity)
  const [maxFlipsPerRound, setMaxFlipsPerRound] = useState(3)
  const [theme, setTheme] = useState<'default' | 'colorful' | 'minimal'>('default')
  const [winEmoji, setWinEmoji] = useState('⭐️')
  const [loseEmoji, setLoseEmoji] = useState('🍄')
  const [hexagons, setHexagons] = useState<HexagonCard[]>([
    { id: '1', text: 'Card 1', hasHiddenStar: false },
    { id: '2', text: 'Card 2', hasHiddenStar: false },
    { id: '3', text: 'Card 3', hasHiddenStar: true },
    { id: '4', text: 'Card 4', hasHiddenStar: false },
    { id: '5', text: 'Card 5', hasHiddenStar: true },
    { id: '6', text: 'Card 6', hasHiddenStar: false },
    { id: '7', text: 'Card 7', hasHiddenStar: false }
  ])

// Stars Hexa customization state (texts/colors/settings)
  const [starsHexaTexts, setStarsHexaTexts] = useState<any>({})
  const [starsHexaColors, setStarsHexaColors] = useState<any>({ palette: {} })

  // Penalty customization
  const [penaltyTexts, setPenaltyTexts] = useState<any>({})
  const [penaltyColors, setPenaltyColors] = useState<any>({})
  const [penaltyGameSettings, setPenaltyGameSettings] = useState({
    totalPlayers: 11,
    penaltyShots: 5,
    successfulShots: 7,
    missedShots: 4
  })

  const [rewards, setRewards] = useState<RewardConfig[]>([])

  // Load existing game in edit mode
  useEffect(() => {
    if (mode === 'edit' && gameId) {
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const response = await fetch(`/api/admin/games/${gameId}`)
          const data = await response.json()
          if (!response.ok) throw new Error(data.error || 'Failed to load game')
          const game = data.game
          // Populate meta
          setTitle(game.title || '')
          setDescription(game.description || '')
          setIsActive(game.status === 'ACTIVE')
          setGameType(game.type)
// Platform configuration (derive from legacy if missing)
          const plat = game.configuration?.platform || {}
          const stars = game.configuration?.starsHexa || {}
          const penalty = game.configuration?.penaltyShootout || {}
          const derivedTexts: Record<string, any> = {
            TEXT_10: plat.texts?.TEXT_10 || stars.texts?.welcomeTitle || game.title || 'Welcome',
            TEXT_20: plat.texts?.TEXT_20 || (stars.texts?.rulesTitle || penalty.texts?.gameRulesTitle) || 'Game Rules',
            TEXT_30: plat.texts?.TEXT_30 || game.title || 'Game',
            TEXT_40: plat.texts?.TEXT_40 || 'Results',
            TEXT_11: plat.texts?.TEXT_11 || game.description || '',
            TEXT_12: plat.texts?.TEXT_12 || 'Your Name',
            TEXT_13: plat.texts?.TEXT_13 || 'Enter your name',
            TEXT_14: plat.texts?.TEXT_14 || 'Your Email',
            TEXT_15: plat.texts?.TEXT_15 || 'your@email.com',
            TEXT_16: plat.texts?.TEXT_16 || 'Your Phone',
            TEXT_17: plat.texts?.TEXT_17 || '+1 (555) 123-4567',
            TEXT_18: plat.texts?.TEXT_18 || penalty.texts?.startPlayingButton || 'Start',
            TEXT_19: plat.texts?.TEXT_19 || 'Try Without Registration',
            // Registration helpers
            TEXT_26: plat.texts?.TEXT_26 || 'Please provide either email or phone number',
            TEXT_27: plat.texts?.TEXT_27 || 'Want to try without registration?',
            // Rules
            TEXT_21: plat.texts?.TEXT_21 || (stars.texts?.rulesTitle || penalty.texts?.gameRulesTitle) || 'Game Rules',
            TEXT_22: plat.texts?.TEXT_22 || (stars.texts?.rulesBody || penalty.texts?.gameRulesText) || '',
            TEXT_23: plat.texts?.TEXT_23 || (penalty.texts?.winConditionsTitle || 'Win Conditions'),
            TEXT_24: plat.texts?.TEXT_24 || (penalty.texts?.winConditionsText || ''),
            TEXT_25: plat.texts?.TEXT_25 || 'Play',
            // Result
            TEXT_41: plat.texts?.TEXT_41 || 'Thanks for participating!',
            TEXT_42: plat.texts?.TEXT_42 || 'Challenge your friends!',
            TEXT_43: plat.texts?.TEXT_43 || 'Share the game or play again!',
            TEXT_44: plat.texts?.TEXT_44 || 'Open CTA',
            TEXT_44_URL: plat.texts?.TEXT_44_URL || '',
            TEXT_45: plat.texts?.TEXT_45 || 'Invite Friend',
            TEXT_46: plat.texts?.TEXT_46 || 'Play Again',
            // New CTA fields & back-compat mapping
            CTA_TITLE: plat.texts?.CTA_TITLE || plat.texts?.TEXT_42 || 'Share Your Result',
            CTA_DESCRIPTION: plat.texts?.CTA_DESCRIPTION || plat.texts?.TEXT_43 || 'Copy or share your result with friends.',
            CTA1_TEXT: plat.texts?.CTA1_TEXT || plat.texts?.TEXT_44 || '',
            CTA1_URL: plat.texts?.CTA1_URL || plat.texts?.TEXT_44_URL || '',
            CTA1_BG: plat.texts?.CTA1_BG || '',
            // Editor-standardized action CTAs with defaults
            NEXT_LOGIN_TEXT: plat.texts?.NEXT_LOGIN_TEXT || plat.texts?.TEXT_18 || '',
            NEXT_LOGIN_ACTION: plat.texts?.NEXT_LOGIN_ACTION || 'REGISTER_AND_CONTINUE',
            NEXT_LOGIN_BG: plat.texts?.NEXT_LOGIN_BG || plat.texts?.TEXT_18_BG || '',
            NEXT_GUEST_TEXT: plat.texts?.NEXT_GUEST_TEXT || plat.texts?.TEXT_19 || '',
            NEXT_GUEST_ACTION: plat.texts?.NEXT_GUEST_ACTION || 'CONTINUE_AS_GUEST',
            NEXT_GUEST_BG: plat.texts?.NEXT_GUEST_BG || plat.texts?.TEXT_19_BG || '',
            NEXT_PLAY_TEXT: plat.texts?.NEXT_PLAY_TEXT || plat.texts?.TEXT_25 || '',
            NEXT_PLAY_ACTION: plat.texts?.NEXT_PLAY_ACTION || 'START_GAME',
            NEXT_PLAY_BG: plat.texts?.NEXT_PLAY_BG || plat.texts?.TEXT_25_BG || '',
            INVITE_TEXT: plat.texts?.INVITE_TEXT || plat.texts?.TEXT_45 || '',
            INVITE_ACTION: plat.texts?.INVITE_ACTION || 'INVITE_REFERRAL',
            INVITE_BG: plat.texts?.INVITE_BG || plat.texts?.TEXT_45_BG || '',
            PLAYAGAIN_TEXT: plat.texts?.PLAYAGAIN_TEXT || plat.texts?.TEXT_46 || '',
            PLAYAGAIN_ACTION: plat.texts?.PLAYAGAIN_ACTION || 'RESTART_GAME',
            PLAYAGAIN_BG: plat.texts?.PLAYAGAIN_BG || plat.texts?.TEXT_46_BG || '',
            CTA_BUTTONS: Array.isArray(plat.texts?.CTA_BUTTONS) && plat.texts.CTA_BUTTONS.length > 0
              ? plat.texts.CTA_BUTTONS
              : (plat.texts?.TEXT_44 || plat.texts?.TEXT_44_URL ? [{ text: plat.texts.TEXT_44 || '', url: plat.texts.TEXT_44_URL || '' }] : [])
          }
          // Normalize to standardized editor keys with fallbacks while preserving any other existing keys
          setPlatformTexts({ ...(plat.texts || {}), ...derivedTexts })
          setPlatformStyles(plat.styles || {})
// Stars Hexa
          if (game.type === 'STARS_HEXA' && game.configuration?.starsHexa) {
            setMaxFlipsPerRound(game.configuration.starsHexa.maxFlipsPerAttempt || 3)
            setTheme(game.configuration.starsHexa.theme || 'default')
            if (Array.isArray(game.configuration.starsHexa.hexagons)) {
              setHexagons(game.configuration.starsHexa.hexagons.map((hex: any, idx: number) => ({
                id: hex.id || String(idx + 1),
                text: hex.text || `Card ${idx + 1}`,
                hasHiddenStar: !!hex.hasHiddenStar,
                color: hex.color
              })))
            }
            setStarsHexaTexts(game.configuration.starsHexa.texts || {})
            setStarsHexaColors(game.configuration.starsHexa.colors || { palette: {} })
            setWinEmoji(game.configuration.starsHexa.emojis?.win || '⭐️')
            setLoseEmoji(game.configuration.starsHexa.emojis?.lose || '🍄')
          }
          // Penalty
          if (game.type === 'PENALTY_SHOOTOUT' && game.configuration?.penaltyShootout) {
            setPenaltyTexts(game.configuration.penaltyShootout.texts || {})
            setPenaltyColors(game.configuration.penaltyShootout.colors || {})
            const savedSettings = game.configuration.penaltyShootout.gameSettings || {}
            setPenaltyGameSettings({
              totalPlayers: savedSettings.totalPlayers || 11,
              penaltyShots: savedSettings.penaltyShots || 5,
              successfulShots: savedSettings.successfulShots || 7,
              missedShots: (savedSettings.totalPlayers || 11) - (savedSettings.successfulShots || 7)
            })
          }
          // Rewards
          if (Array.isArray(game.rewards)) {
            setRewards(game.rewards.map((r: any) => ({
              title: r.title || '',
              description: r.description || '',
              type: r.type || 'DISCOUNT',
              value: r.value || 0,
              maxQuantity: r.maxQuantity || 1,
              isActive: r.isActive !== false
            })))
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load game')
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [mode, gameId])

  const starsCount = hexagons.filter(h => h.hasHiddenStar).length

  const updateHexagon = (index: number, field: keyof HexagonCard, value: any) => {
    setHexagons(prev => prev.map((hex, i) => i === index ? { ...hex, [field]: value } : hex))
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!title.trim()) throw new Error('Game title is required')

      // Mirror standardized editor keys back to legacy before saving (back-compat)
      const mirrorLegacyBeforeSubmit = (t: any) => {
        const next = { ...(t || {}) }
        // Primary CTA
        if (!next.TEXT_44) next.TEXT_44 = next.CTA1_TEXT || ''
        if (!next.TEXT_44_URL) next.TEXT_44_URL = next.CTA1_URL || ''
        // Welcome — Next With Login
        if (!next.TEXT_18) next.TEXT_18 = next.NEXT_LOGIN_TEXT || ''
        if (!next.TEXT_18_BG) next.TEXT_18_BG = next.NEXT_LOGIN_BG || ''
        // Welcome — Next Without Login
        if (!next.TEXT_19) next.TEXT_19 = next.NEXT_GUEST_TEXT || ''
        if (!next.TEXT_19_BG) next.TEXT_19_BG = next.NEXT_GUEST_BG || ''
        // Rules — Next Play
        if (!next.TEXT_25) next.TEXT_25 = next.NEXT_PLAY_TEXT || ''
        if (!next.TEXT_25_BG) next.TEXT_25_BG = next.NEXT_PLAY_BG || ''
        // Result — Invite Friend
        if (!next.TEXT_45) next.TEXT_45 = next.INVITE_TEXT || ''
        if (!next.TEXT_45_BG) next.TEXT_45_BG = next.INVITE_BG || ''
        // Result — Play Again
        if (!next.TEXT_46) next.TEXT_46 = next.PLAYAGAIN_TEXT || ''
        if (!next.TEXT_46_BG) next.TEXT_46_BG = next.PLAYAGAIN_BG || ''
        return next
      }

      let payload: any = {
        title: title.trim(),
        description: description.trim(),
        type: gameType,
        isActive,
        configuration: {},
        rewards: rewards.filter(r => r.title.trim())
      }

      // Attach platform configuration
      payload.configuration.platform = {
        texts: mirrorLegacyBeforeSubmit(platformTexts),
        styles: platformStyles
      }

      if (gameType === 'STARS_HEXA') {
        const starCount = hexagons.filter(h => h.hasHiddenStar).length
        if (starCount === 0) throw new Error('At least one hexagon must have a hidden star')
        if (hexagons.some(h => !h.text.trim())) throw new Error('All hexagon cards must have text')
        payload.configuration.starsHexa = {
          hexagons: hexagons.map((hex, index) => ({ ...hex, position: index })),
          maxFlipsPerAttempt: maxFlipsPerRound,
          theme,
          totalStars: starCount,
          texts: starsHexaTexts,
          colors: starsHexaColors,
          emojis: { win: winEmoji, lose: loseEmoji }
        }
      } else if (gameType === 'PENALTY_SHOOTOUT') {
        // Generate players for a valid penalty configuration (11 players, 7 goals)
        const playerNumbers = Array.from({ length: 21 }, (_, i) => i + 2) // 2..22
        const shuffledNumbers = playerNumbers.sort(() => Math.random() - 0.5).slice(0, 11)
        const goalPositions = Array.from({ length: 11 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, 7)
        const players = Array.from({ length: 11 }, (_, index) => ({
          id: `player-${index + 1}`,
          playerNumber: shuffledNumbers[index],
          hasGoal: goalPositions.includes(index),
          isRevealed: false,
          position: index,
          color: '#c00000',
          backgroundColor: '#ffffff'
        }))
        payload.configuration.penaltyShootout = {
          players,
          totalGoals: 7,
          playersToSelect: 5,
          theme: 'football',
          texts: penaltyTexts,
          colors: penaltyColors,
          gameSettings: penaltyGameSettings
        }
      }

      if (mode === 'edit' && gameId) {
        const res = await fetch(`/api/admin/games/${gameId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update game')
        router.push('/admin/games')
        return
      }

      // Create new
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create game')
      router.push('/admin/games')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const gameTypeName = gameType === 'STARS_HEXA' ? 'Stars Hexa' : gameType === 'PENALTY_SHOOTOUT' ? 'Penalty Shootout' : 'Game'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mode === 'create' ? 'Create New Game' : `Edit ${gameTypeName} Game`}</h1>
            <p className="text-gray-600 mt-1">{mode === 'create' ? 'Set up your game using the unified editor layout' : `Modify your ${gameTypeName} game configuration`}</p>
          </div>
          <Link href="/admin/games" className="text-gray-600 hover:text-gray-800 transition-colors">← Back to Games</Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2"><span className="text-red-600">❌</span><span className="text-red-800 font-medium">Error</span></div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreateOrUpdate} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Game Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black" style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }} placeholder={`My Awesome ${gameTypeName} Game`} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                  <option value="active" className="bg-white text-black">Active</option>
                  <option value="inactive" className="bg-white text-black">Inactive</option>
                </select>
              </div>

              {/* Game Type (create mode only) */}
{mode === 'create' && !hideTypeSelect && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Game Type</label>
                  <select value={gameType} onChange={(e) => setGameType(e.target.value as GameType)}
                    className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                    <option value="STARS_HEXA" className="bg-white text-black">Stars Hexa</option>
                    <option value="PENALTY_SHOOTOUT" className="bg-white text-black">Penalty Shootout</option>
                  </select>
                </div>
              )}

{/* Removed global Total Rounds */}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black" style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }} placeholder="Describe your game..." />
            </div>
          </div>

          {/* Platform Settings (applies to all pages and games) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Settings</h2>
            <p className="text-sm text-gray-600 mb-4">Central texts and styles for the 4-page flow. Game-specific settings are below.</p>
            <PlatformSettingsForm
              texts={platformTexts}
              styles={platformStyles}
              onTextsChange={setPlatformTexts}
              onStylesChange={setPlatformStyles}
            />
          </div>

{/* Stars Hexa Configuration */}
          {gameType === 'STARS_HEXA' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stars Hexa Customization</h2>
              <StarsHexaCustomizationForm
                texts={starsHexaTexts}
                colors={starsHexaColors}
                settings={{ maxFlipsPerAttempt: maxFlipsPerRound, theme, winEmoji, loseEmoji }}
                hexagons={hexagons}
                onHexagonsChange={(hx) => setHexagons(hx)}
                onChange={(texts, colors, settings) => {
                  setStarsHexaTexts(texts)
                  setStarsHexaColors(colors)
                  setMaxFlipsPerRound(settings.maxFlipsPerAttempt)
                  setTheme(settings.theme as any)
                  setWinEmoji(settings.winEmoji)
                  setLoseEmoji(settings.loseEmoji)
                }}
                hideTextAndColors={true}
              />
          </div>
          )}

          {/* Inline Actions between sections */}
          <div className="flex items-center justify-between pt-6">
            <Link href="/admin/games" className="text-gray-600 hover:text-gray-800 transition-colors">Cancel</Link>
            <button type="submit" disabled={saving || !title.trim() || (gameType === 'STARS_HEXA' && starsCount === 0)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              {mode === 'create' ? 'Create Game' : 'Update Game'}
            </button>
          </div>

          {/* Penalty Shootout Configuration */}
          {gameType === 'PENALTY_SHOOTOUT' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Penalty Game Customization</h2>
              <PenaltyCustomizationForm
                texts={penaltyTexts}
                colors={penaltyColors}
                gameSettings={penaltyGameSettings}
                gameData={{ title, description }}
                onChange={(texts, colors, gameSettings) => {
                  setPenaltyTexts(texts)
                  setPenaltyColors(colors)
                  setPenaltyGameSettings(gameSettings)
                }}
                onGameDataChange={(gameData) => {
                  setTitle(gameData.title)
                  setDescription(gameData.description)
                }}
                hideTextAndColors={true}
              />
            </div>
          )}

          {/* Inline Actions between sections */}
          <div className="flex items-center justify-between pt-6">
            <Link href="/admin/games" className="text-gray-600 hover:text-gray-800 transition-colors">Cancel</Link>
            <button type="submit" disabled={saving || !title.trim() || (gameType === 'STARS_HEXA' && starsCount === 0)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Game' : 'Update Game')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

