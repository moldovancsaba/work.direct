'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GeneralCustomizationForm from './GeneralCustomizationForm'
import PlatformSettingsForm from './PlatformSettingsForm'
import QuizzzCustomizationForm from './QuizzzCustomizationForm'
import { GameType, QuizzConfiguration, QuizzzConfiguration } from '../../types'

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
  // Saved-state indicators for staying on page after update
  // What: Show a non-intrusive success banner with ISO 8601 timestamp after saving.
  // Why: Allow progressive edits without being redirected back to list.
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  // Game meta
  const [title, setTitle] = useState(mode === 'create' ? 'New Game' : '')
  const [description, setDescription] = useState(mode === 'create' ? 'Describe your game...' : '')
  const [isActive, setIsActive] = useState(false)
const [gameType, setGameType] = useState<GameType>(initialGameType || 'QUIZZZ')
  // DB-driven game types list
  const [availableTypes, setAvailableTypes] = useState<Array<{ code: GameType; name: string; enabled: boolean; order: number }>>([])
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false)

  // Common configuration
  const [maxRounds, setMaxRounds] = useState(3)

  // QUIZZ configuration (legacy; QUIZZZ will supersede)
  const [quizzConfig, setQuizzConfig] = useState<Partial<QuizzConfiguration>>({
    mapType: 'hex',
    mapName: '',
    selectedMaps: [],
    activeCoords: [],
    mapTag: 'water',
    rounds: 5,
    targetCorrect: 3,
    questions: [],
    theme: 'default',
    overlayBg: 'rgba(0,0,0,0.6)',
    texts: { submitAnswer: 'Submit', correctFeedback: 'Correct!', wrongFeedback: 'Try again' }
  })

// QUIZZZ configuration (new board-quiz)
  const [quizzzConfig, setQuizzzConfig] = useState<Partial<QuizzzConfiguration>>({
    mapType: 'hex',
    mapName: '',
    selectedMaps: [],
    numberOfCards: 6,
    rounds: 5,
    winLimit: 3,
    questions: [],
    backgroundCss: '',
    tileStyles: {},
    cardCoverImages: [],
    cardCoverFill: true,
    cardColors: {},
    overlayBg: '#00000044'
  })

// Platform Settings (DB-driven defaults; no baked-in strings)
const [platformTexts, setPlatformTexts] = useState<Record<string, string>>({})
const [platformStyles, setPlatformStyles] = useState<Record<string, any>>({})

// Load PlayMass defaults from DB for create mode (and whenever gameType changes)
useEffect(() => {
  if (mode !== 'create') return
  const controller = new AbortController()
  const load = async () => {
    try {
      const res = await fetch(`/api/config/defaults?module=${encodeURIComponent(gameType)}`, { signal: controller.signal, cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const defs = data?.data?.defaults || {}
      const ptxt = defs?.platform?.texts || {}
      const psty = defs?.platform?.styles || {}
      setPlatformTexts(ptxt)
      setPlatformStyles(psty)
    } catch {}
  }
  load()
  return () => controller.abort()
}, [mode, gameType])

  // Stars Hexa configuration (edit layout form parity)
  const [maxFlipsPerRound, setMaxFlipsPerRound] = useState(3)
  const [theme, setTheme] = useState<'default' | 'colorful' | 'minimal'>('default')
  const [winEmoji, setWinEmoji] = useState('⭐️')
  const [loseEmoji, setLoseEmoji] = useState('🍄')

  // Find Red (Get Shorty) configuration
  const [findRedConfig, setFindRedConfig] = useState<any>({
    packSize: 6,
    redsPerPack: 2,
    selectionsPerRound: 1,
    targetReds: 3,
    totalRounds: 5,
    theme: 'default',
    texts: { shortyLabel: 'Shorty' },
    colors: {
      background: '#0B1220',
      winForeground: '#FF1A1A',
      neutralForeground: '#A0AEC0',
      cardBack: '#1F2937',
      cardBorder: '#374151'
    },
    defaultRewardId: ''
  })

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

  // Load game types from DB for create mode selector
  useEffect(() => {
    if (hideTypeSelect) return
    ;(async () => {
      try {
        setLoadingTypes(true)
        const res = await fetch('/api/admin/game-types', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          const itemsRaw = (data?.data?.items || []).filter((it: any) => it && typeof it.code === 'string')
          // Deduplicate by code (prefer enabled=true; then smaller order)
          const byCode = new Map<string, any>()
          for (const t of itemsRaw) {
            const k = String(t.code || '').toUpperCase()
            const cur = byCode.get(k)
            if (!cur) { byCode.set(k, t); continue }
            if ((t.enabled && !cur.enabled) || (t.enabled === cur.enabled && Number(t.order || 0) < Number(cur.order || 0))) {
              byCode.set(k, t)
            }
          }
          // Load all enabled types from DB — today only QUIZZZ is enabled by default
          const items = Array.from(byCode.values())
          setAvailableTypes(items)
          // If current gameType not present or disabled, default to first enabled type (QUIZZZ by default)
          const codes = new Set(items.filter((x: any) => x.enabled !== false).map((x: any) => x.code))
          if (!codes.has(gameType) && items.length > 0) {
            const first = items.find((x: any) => x.enabled !== false) || items[0]
            if (first?.code) setGameType(first.code as GameType)
          }
        } else {
          // leave availableTypes empty; UI will show message
        }
      } catch (_) {
        // ignore
      } finally {
        setLoadingTypes(false)
      }
    })()
  }, [hideTypeSelect])

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
          if (game.type === 'FIND_RED' && game.configuration?.findRed) {
            const cfg = game.configuration.findRed
            setFindRedConfig({
              packSize: cfg.packSize || 6,
              redsPerPack: cfg.redsPerPack || 2,
              selectionsPerRound: cfg.selectionsPerRound || 1,
              targetReds: cfg.targetReds || 3,
              totalRounds: cfg.totalRounds || 5,
              theme: cfg.theme || 'default',
              texts: { shortyLabel: cfg.texts?.shortyLabel || 'Shorty' },
              colors: {
                background: cfg.colors?.background || '#0B1220',
                winForeground: cfg.colors?.winForeground || '#FF1A1A',
                neutralForeground: cfg.colors?.neutralForeground || '#A0AEC0',
                cardBack: cfg.colors?.cardBack || '#1F2937',
                cardBorder: cfg.colors?.cardBorder || '#374151'
              },
              defaultRewardId: cfg.defaultRewardId || ''
            })
          }

          if (game.type === 'QUIZZ' && game.configuration?.quizz) {
            const q = game.configuration.quizz
            setQuizzConfig({
              mapType: q.mapType || 'hex',
              mapName: q.mapName || '',
              selectedMaps: Array.isArray(q.selectedMaps) && q.selectedMaps.length > 0
                ? q.selectedMaps
                : (q.mapName ? [{ type: (q.mapType || 'hex'), name: q.mapName }] : []),
              randomizeSelectedMaps: !!q.randomizeSelectedMaps,
              activeCoords: Array.isArray(q.activeCoords) ? q.activeCoords : [],
              mapTag: q.mapTag || 'water',
              rounds: Number(q.rounds || 5),
              targetCorrect: Number(q.targetCorrect || 3),
              questions: Array.isArray(q.questions) ? q.questions : [],
              theme: q.theme || 'default',
              overlayBg: q.overlayBg || 'rgba(0,0,0,0.6)',
              texts: q.texts || { submitAnswer: 'Submit', correctFeedback: 'Correct!', wrongFeedback: 'Try again' },
              cardCoverImages: Array.isArray(q.cardCoverImages) ? q.cardCoverImages : []
            })
          }

          if (game.type === 'QUIZZZ' && game.configuration?.quizzz) {
            const qz = game.configuration.quizzz
            setQuizzzConfig({
              mapType: qz.mapType || 'hex',
              mapName: qz.mapName || '',
              selectedMaps: Array.isArray(qz.selectedMaps) ? qz.selectedMaps : [],
              numberOfCards: Number(qz.numberOfCards || 6),
              rounds: Number(qz.rounds || 5),
              winLimit: Number(qz.winLimit || 3),
              questions: Array.isArray(qz.questions) ? qz.questions : [],
              backgroundCss: qz.backgroundCss || '',
              tileStyles: qz.tileStyles || {},
              cardCoverImages: Array.isArray(qz.cardCoverImages) ? qz.cardCoverImages : [],
              cardCoverFill: qz.cardCoverFill !== false,
              cardColors: qz.cardColors || {},
              overlayBg: qz.overlayBg || '#00000044'
            })
            // Keep payloadRef in sync for submit
            ;(payloadRef.current as any).quizzz = {
              mapType: qz.mapType || 'hex',
              mapName: qz.mapName || '',
              selectedMaps: Array.isArray(qz.selectedMaps) ? qz.selectedMaps : [],
              numberOfCards: Number(qz.numberOfCards || 6),
              rounds: Number(qz.rounds || 5),
              winLimit: Number(qz.winLimit || 3),
              questions: Array.isArray(qz.questions) ? qz.questions : [],
              backgroundCss: qz.backgroundCss || '',
              tileStyles: qz.tileStyles || {},
              cardCoverImages: Array.isArray(qz.cardCoverImages) ? qz.cardCoverImages : [],
              cardCoverFill: qz.cardCoverFill !== false,
              cardColors: qz.cardColors || {},
              overlayBg: qz.overlayBg || '#00000044'
            } as any
          }

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

  const payloadRef = { current: {} as any }

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
      } else if (gameType === 'QUIZZZ') {
        // Validate logical constraints for QUIZZZ
        const qc = (quizzzConfig || {}) as any
        const numberOfCards = Number(qc.numberOfCards || 1)
        const rounds = Number(qc.rounds || 1)
        const winLimit = Number(qc.winLimit || 1)
        const questions = Array.isArray(qc.questions) ? qc.questions : []
        if (questions.length < 1) throw new Error('At least one question is required')
        if (winLimit > rounds) throw new Error('Win limit cannot exceed rounds')
        payload.configuration.quizzz = {
          mapType: qc.mapType || 'hex',
          mapName: qc.mapName || '',
          selectedMaps: Array.isArray(qc.selectedMaps) ? qc.selectedMaps : [],
          numberOfCards,
          rounds,
          winLimit,
          questions,
          backgroundCss: qc.backgroundCss || '',
          tileStyles: qc.tileStyles || {},
          cardCoverImages: Array.isArray(qc.cardCoverImages) ? qc.cardCoverImages : [],
          cardCoverFill: qc.cardCoverFill !== false,
          cardColors: qc.cardColors || {},
          overlayBg: qc.overlayBg || '#00000044'
        } as any
      } else if (gameType === 'FIND_RED') {
        // Validate relationships
        const p = { ...findRedConfig }
        p.packSize = Number(p.packSize || 6)
        p.redsPerPack = Number(p.redsPerPack || 2)
        p.selectionsPerRound = Number(p.selectionsPerRound || 1)
        p.targetReds = Number(p.targetReds || 3)
        p.totalRounds = Number(p.totalRounds || 5)
        if (p.redsPerPack > p.packSize) throw new Error('Reds per pack cannot exceed Cards per Round')
        if (p.selectionsPerRound < 1 || p.selectionsPerRound > p.packSize) throw new Error('Selections per round must be between 1 and Cards per Round')
        if (p.targetReds < 1) throw new Error('Target Reds must be at least 1')
        if (p.totalRounds < 1) throw new Error('Total Rounds must be at least 1')
        if (p.targetReds > p.totalRounds) throw new Error('Target Reds cannot exceed Total Rounds')

        payload.configuration.findRed = {
          packSize: p.packSize,
          redsPerPack: p.redsPerPack,
          selectionsPerRound: p.selectionsPerRound,
          targetReds: p.targetReds,
          totalRounds: p.totalRounds,
          theme: p.theme || 'default',
          texts: { shortyLabel: p.texts?.shortyLabel || 'Shorty' },
          colors: {
            background: p.colors?.background,
            winForeground: p.colors?.winForeground,
            neutralForeground: p.colors?.neutralForeground,
            cardBack: p.colors?.cardBack,
            cardBorder: p.colors?.cardBorder
          },
          defaultRewardId: p.defaultRewardId || ''
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
      } else if (gameType === 'QUIZZ') {
        const q = quizzConfig || {}
        const qs = Array.isArray(q.questions) ? q.questions : []
        {
          const out: any = {
            mapType: (q as any).mapType || 'hex',
            selectedMaps: Array.isArray((q as any).selectedMaps) ? (q as any).selectedMaps : [],
            randomizeSelectedMaps: !!(q as any).randomizeSelectedMaps,
            activeCoords: Array.isArray(q.activeCoords || []) ? (q.activeCoords as any) : [],
            rounds: Number(q.rounds || 5),
            targetCorrect: Number(q.targetCorrect || 3),
            questions: qs,
            theme: (q as any).theme || 'default',
            overlayBg: (q as any).overlayBg || 'rgba(0,0,0,0.6)',
            texts: q.texts || { submitAnswer: 'Submit', correctFeedback: 'Correct!', wrongFeedback: 'Try again' },
            cardCoverImages: Array.isArray((q as any).cardCoverImages) ? (q as any).cardCoverImages : []
          }
          // Legacy fallback: if no selected maps provided, keep existing mapName/mapTag (for backward compatibility)
          if (!Array.isArray((q as any).selectedMaps) || (q as any).selectedMaps.length === 0) {
            if (q.mapName) out.mapName = q.mapName
            if ((q as any).mapTag) out.mapTag = (q as any).mapTag
          }
          payload.configuration.quizz = out
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
        // Stay on the edit page and show a success indicator.
        // What: Do not navigate away after saving.
        // Why: Allow incremental saving without losing context.
        setSaveSuccess(true)
        setLastSavedAt(new Date().toISOString())
        // Auto-hide the success message after a short delay
        setTimeout(() => setSaveSuccess(false), 3000)
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

  const gameTypeName = gameType === 'STARS_HEXA' ? 'Hexa' : gameType === 'PENALTY_SHOOTOUT' ? 'Penalty Shootout' : 'Game' // UI label only; keep internal id 'STARS_HEXA'

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

  const ActionBar = () => (
    <div className="w-full flex items-center justify-center gap-4 py-3">
      <Link href="/admin/games" className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50">Cancel</Link>
      <button type="submit" disabled={saving || !title.trim() || (gameType === 'STARS_HEXA' && starsCount === 0)}
        className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Game' : 'Update Game')}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 enforce-text-black">
      {/* Enforce absolutely black text across the entire editor */}
      <style jsx global>{`
        .enforce-text-black, .enforce-text-black * {
          color: #000000 !important;
          --tw-text-opacity: 1 !important;
        }
        .enforce-text-black input::placeholder,
        .enforce-text-black textarea::placeholder {
          color: #000000 !important;
          opacity: 1 !important;
        }
        .enforce-text-black a { color: #000000 !important; }
        .enforce-text-black svg { color: #000000 !important; }
      `}</style>
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{mode === 'create' ? 'Create New Game' : `Edit ${gameTypeName} Game`}</h1>
            <p className="mt-1">{mode === 'create' ? 'Set up your game using the unified editor layout' : `Modify your ${gameTypeName} game configuration`}</p>
          </div>
          <Link href="/admin/games" className="transition-colors">← Back to Games</Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2"><span className="text-red-600">❌</span><span className="text-red-800 font-medium">Error</span></div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2"><span className="text-green-600">✅</span><span className="text-green-800 font-medium">Saved</span></div>
            {lastSavedAt && <p className="text-green-700 mt-1">Saved at {lastSavedAt}</p>}
          </div>
        )}

        <form onSubmit={handleCreateOrUpdate}>
          {/* Top actions */}
          <ActionBar />

          {/* Three columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* LEFT column: 2/3 width with segments (each segment has 2 columns) */}
            <div className="lg:col-span-2">
              <div className="space-y-8">

                {/* Segment 1 — Basic Info (no header) */}
                <div className="relative">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Left: Basic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {/* Row 1: Status checkbox (left) + Game Title (right) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
                          <label className="inline-flex items-center gap-2 text-black">
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                            <span>active</span>
                          </label>
                        </div>
                        <div>
<label className="block text-sm font-medium text-gray-700 mb-2">Game Title *</label>
                          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black" style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }} placeholder={`My Awesome ${gameTypeName} Game`} required />
                        </div>
                        {/* Row 2: Description spanning full width */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                            className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 caret-black" style={{ backgroundColor: '#ffffff', color: '#000000', caretColor: '#000000' }} placeholder="Describe your game..." />
                        </div>
                        {/* Row 3: Game Type selector (create mode only) */}
{mode === 'create' && !hideTypeSelect && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Game Type</label>
                            {loadingTypes ? (
                              <div className="text-sm text-gray-600">Loading types…</div>
                            ) : availableTypes.length > 0 ? (
                              <select value={gameType} onChange={(e) => setGameType(e.target.value as GameType)}
                                className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                                {availableTypes.filter(t => t.enabled !== false).map((t) => (
                                  <option key={t.code} value={t.code} className="bg-white text-black">{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                                No game types configured in DB. Please add types via API: POST /api/admin/game-types
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segment 2 — HERO BLOCK */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">HERO BLOCK</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Left: Hero Block Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="hero"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Segment 3 — MAIN BLOCK */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">MAIN BLOCK</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Left: Main Block Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="main"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Segment 4 — LANDING */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">LANDING</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Landing Page settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="landing"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                    {/* Right: Landing Page Buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="buttons"
                        section="landing"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Segment 5 — WELCOME */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">WELCOME</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Welcome Page settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="welcome"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                    {/* Right: Welcome Page Buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="buttons"
                        section="welcome"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Segment 6 — RULES */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">RULES</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Rules Page settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="rules"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                    {/* Right: Rules Page Buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="buttons"
                        section="rules"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Segment 7 — RESULT */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">RESULT</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Result Page settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="result"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                    {/* Right: Result Page Buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="buttons"
                        section="result"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Segment 8 — LEGAL */}
                <div className="relative">
                  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 py-2 rounded-t-lg">
                    <h3 className="text-xs font-semibold tracking-wide text-gray-700">LEGAL</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Left: Legal Documents settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 h-full">
                      <PlatformSettingsForm
                        texts={platformTexts}
                        styles={platformStyles}
                        onTextsChange={setPlatformTexts}
                        onStylesChange={setPlatformStyles}
                        mode={mode}
                        saving={saving}
                        modeSections="text"
                        section="legal"
                        hideInlineActions={true}
                        hideSectionTitles={true}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              

              {/* Edit Game — QUIZZZ simplified editor in the right column */}
              {gameType === 'QUIZZZ' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Game</h2>
                  <QuizzzCustomizationForm
                    config={quizzzConfig as QuizzzConfiguration}
                    onChange={(cfg) => {
                      setQuizzzConfig(cfg)
                      ;(payloadRef.current as any).quizzz = cfg
                    }}
                  />
                </div>
              )}

              {/* Segment3 - Only QUIZZZ specific Settings visible */}
              {/* Other game-type specific UIs removed by design */}

              {/* Middle center actions (full width below columns) */}
              <ActionBar />
            </div>
          </div>

          {/* Bottom actions */}
          <div className="mt-6">
            <ActionBar />
          </div>






        </form>
      </div>
    </div>
  )
}

