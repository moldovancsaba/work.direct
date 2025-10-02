'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GeneralCustomizationForm from './GeneralCustomizationForm'
import PlatformSettingsForm from './PlatformSettingsForm'
import QuizzzCustomizationForm from './QuizzzCustomizationForm'
import PageEditor from './PageEditor'
import { GameType, QuizzzConfiguration, PageDef } from '../../types'
import { v4 as uuidv4 } from 'uuid'

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

// Create default Pages for new games: Landing and Game
// What: Ensure required base pages exist so the editor shows tabs immediately.
// Why: Product requirement — every game has Landing and Game pages by default.
const makeDefaultPages = (): PageDef[] => [
  {
    id: uuidv4(),
    name: 'Landing',
    isActive: true,
    layout: '',
    boxes: [
      { id: uuidv4(), name: 'HERO', block: 'HERO', columns: 1, items: [] },
      { id: uuidv4(), name: 'MAIN', block: 'MAIN', columns: 1, items: [] }
    ]
  },
  {
    id: uuidv4(),
    name: 'Game',
    isActive: true,
    layout: '',
    boxes: [
      { id: uuidv4(), name: 'HERO', block: 'HERO', columns: 1, items: [] },
      { id: uuidv4(), name: 'MAIN', block: 'MAIN', columns: 1, items: [] }
    ]
  }
]

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
// Pages Editor State — initialize with default pages in create mode
const [pages, setPages] = useState<PageDef[]>(mode === 'create' ? makeDefaultPages() : [])

// Scrub legacy pages on first mount in create mode
useEffect(() => {
  if (mode !== 'create') return
  let did = false
  setPages(prev => {
    if (!Array.isArray(prev)) return prev
    const legacy = new Set(['WELCOME','RULES','RESULT'])
    const keep = new Set(['LANDING','GAME'])
    const filtered = prev.filter(p => keep.has(String(p.name || '').toUpperCase()) || !legacy.has(String(p.name || '').toUpperCase()))
    // Deduplicate by normalized name (prefer first occurrence)
    const byName = new Map<string, PageDef>()
    for (const p of filtered) {
      const key = String(p.name || '').toUpperCase()
      if (!byName.has(key)) byName.set(key, p)
    }
    const landing = byName.get('LANDING') || makeDefaultPages()[0]
    const game = byName.get('GAME') || makeDefaultPages()[1]
    const rest = Array.from(byName.values()).filter(p => {
      const n = String(p.name || '').toUpperCase()
      return n !== 'LANDING' && n !== 'GAME'
    })
    const next = [landing, game, ...rest]
    did = true
    return next
  })
  // run once - empty deps array is intentional for one-time initialization
}, [])

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
          const derivedTexts: Record<string, any> = {
            TEXT_10: plat.texts?.TEXT_10 || game.title || 'Welcome',
            TEXT_20: plat.texts?.TEXT_20 || 'Game Rules',
            TEXT_30: plat.texts?.TEXT_30 || game.title || 'Game',
            TEXT_40: plat.texts?.TEXT_40 || 'Results',
            TEXT_11: plat.texts?.TEXT_11 || game.description || '',
            TEXT_12: plat.texts?.TEXT_12 || 'Your Name',
            TEXT_13: plat.texts?.TEXT_13 || 'Enter your name',
            TEXT_14: plat.texts?.TEXT_14 || 'Your Email',
            TEXT_15: plat.texts?.TEXT_15 || 'your@email.com',
            TEXT_16: plat.texts?.TEXT_16 || 'Your Phone',
            TEXT_17: plat.texts?.TEXT_17 || '+1 (555) 123-4567',
            TEXT_18: plat.texts?.TEXT_18 || 'Start',
            TEXT_19: plat.texts?.TEXT_19 || 'Try Without Registration',
            // Registration helpers
            TEXT_26: plat.texts?.TEXT_26 || 'Please provide either email or phone number',
            TEXT_27: plat.texts?.TEXT_27 || 'Want to try without registration?',
            // Rules
            TEXT_21: plat.texts?.TEXT_21 || 'Game Rules',
            TEXT_22: plat.texts?.TEXT_22 || '',
            TEXT_23: plat.texts?.TEXT_23 || 'Win Conditions',
            TEXT_24: plat.texts?.TEXT_24 || '',
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
          // Load pages editor data
          setPages(Array.isArray(game.configuration?.pages) ? game.configuration.pages : [])

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

// Legacy hex editor branch removed
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

      // Attach pages editor configuration
      if (Array.isArray(pages)) {
        (payload.configuration as any).pages = pages
      }

      if (gameType === 'QUIZZZ') {
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

  const gameTypeName = 'Game'

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
      <button type="submit" disabled={saving || !title.trim()}
        className="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Game' : 'Update Game')}
      </button>
    </div>
  );

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

                {/* Page Editor */}
                <PageEditor pages={pages} onChange={setPages} />

                {/* STYLE — merged HERO and MAIN styling */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">STYLE</h3>
                    <p className="text-sm text-gray-600">Global visual settings merged from Hero and Main.</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* HERO styles */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-800">Hero</h4>
                      <div>
                        <label className="block text-sm mb-1">HERO_LOGO_URL</label>
                        <input value={platformTexts.HERO_LOGO_URL || ''} onChange={e => setPlatformTexts({ ...platformTexts, HERO_LOGO_URL: e.target.value })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1">HERO_LOGO_WIDTH</label>
                          <input value={platformTexts.HERO_LOGO_WIDTH || ''} onChange={e => setPlatformTexts({ ...platformTexts, HERO_LOGO_WIDTH: e.target.value })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">HERO_LOGO_HEIGHT</label>
                          <input value={platformTexts.HERO_LOGO_HEIGHT || ''} onChange={e => setPlatformTexts({ ...platformTexts, HERO_LOGO_HEIGHT: e.target.value })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">HERO_BACKGROUND (CSS)</label>
                        <input value={platformStyles?.hero?.background || ''} onChange={e => setPlatformStyles({ ...platformStyles, hero: { ...(platformStyles.hero || {}), background: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1">Hero Font URL</label>
                          <input value={platformStyles?.hero?.fontUrl || ''} onChange={e => setPlatformStyles({ ...platformStyles, hero: { ...(platformStyles.hero || {}), fontUrl: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Hero Font Style</label>
                          <input value={platformStyles?.hero?.fontStyle || ''} onChange={e => setPlatformStyles({ ...platformStyles, hero: { ...(platformStyles.hero || {}), fontStyle: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1">Hero Title Class</label>
                          <input value={platformStyles?.hero?.titleClass || ''} onChange={e => setPlatformStyles({ ...platformStyles, hero: { ...(platformStyles.hero || {}), titleClass: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Hero Title Color</label>
                          <input value={platformStyles?.hero?.fontColor || ''} onChange={e => setPlatformStyles({ ...platformStyles, hero: { ...(platformStyles.hero || {}), fontColor: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                    </div>

                    {/* MAIN styles */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-800">Main</h4>
                      <div>
                        <label className="block text-sm mb-1">MAIN_BACKGROUND (CSS)</label>
                        <input value={platformStyles?.main?.background || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), background: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm mb-1">H1 Class</label>
                          <input value={platformStyles?.main?.h1Class || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), h1Class: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">H2 Class</label>
                          <input value={platformStyles?.main?.h2Class || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), h2Class: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">P Class</label>
                          <input value={platformStyles?.main?.pClass || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), pClass: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Input Class</label>
                        <input value={platformStyles?.main?.inputClass || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), inputClass: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1">Primary Button Class</label>
                          <input value={platformStyles?.main?.buttonPrimaryClass || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), buttonPrimaryClass: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Secondary Button Class</label>
                          <input value={platformStyles?.main?.buttonSecondaryClass || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), buttonSecondaryClass: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm mb-1">H1 Font URL</label>
                          <input value={platformStyles?.main?.h1FontUrl || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), h1FontUrl: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">H2 Font URL</label>
                          <input value={platformStyles?.main?.h2FontUrl || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), h2FontUrl: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">P Font URL</label>
                          <input value={platformStyles?.main?.pFontUrl || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), pFontUrl: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm mb-1">H1 Font Style</label>
                          <input value={platformStyles?.main?.h1FontStyle || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), h1FontStyle: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">H2 Font Style</label>
                          <input value={platformStyles?.main?.h2FontStyle || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), h2FontStyle: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">P Font Style</label>
                          <input value={platformStyles?.main?.pFontStyle || ''} onChange={e => setPlatformStyles({ ...platformStyles, main: { ...(platformStyles.main || {}), pFontStyle: e.target.value } })} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LEGAL */}
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
              {/* Game General — moved to right column above Edit Game; each field on new lines */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Game General</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Game Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" placeholder="New Game" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
                    <label className="inline-flex items-center gap-2 text-black">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                      <span>active</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg" placeholder="Describe your game..." />
                  </div>
                  {mode === 'create' && !hideTypeSelect && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Game Type</label>
                      {loadingTypes ? (
                        <div className="text-sm text-gray-600">Loading types…</div>
                      ) : availableTypes.length > 0 ? (
                        <select value={gameType} onChange={(e) => setGameType(e.target.value as GameType)} className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg">
                          {availableTypes.filter(t => t.enabled !== false).map((t) => (
                            <option key={t.code} value={t.code} className="bg-white text-black">{t.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">No game types configured in DB. Please add types via API: POST /api/admin/game-types</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

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

