"use client"

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { QuizzzConfiguration, QuizzzQuestion, GridMapType } from '../../types'

interface QuizzzCustomizationFormProps {
  config?: Partial<QuizzzConfiguration>
  onChange: (next: QuizzzConfiguration) => void
}

export default function QuizzzCustomizationForm({ config, onChange }: QuizzzCustomizationFormProps) {
  // Core numbers
  // Renamed local state to easy-to-read variables (persisted mapping handled in emit)
  const [numberCards, setNumberCards] = useState<number>(config?.numberOfCards || 6)
  const [gameRounds, setGameRounds] = useState<number>(config?.rounds || 5)
  const [winLimit, setWinLimit] = useState<number>(config?.winLimit || 3)

  // Map selection
  const [mapType, setMapType] = useState<GridMapType>(config?.mapType || 'hex')
  const [mapName, setMapName] = useState<string>(config?.mapName || '')
  const [selectedMaps, setSelectedMaps] = useState<Array<{ type: GridMapType; name: string }>>(config?.selectedMaps || [])

  // UI config
  const [cssBackground, setCssBackground] = useState<string>(config?.backgroundCss || '')
  const [useCssBackground, setUseCssBackground] = useState<boolean>(true)
  const [questionOverlayBG, setQuestionOverlayBG] = useState<string>(config?.overlayBg || '#00000044')
  const [useOverlayBg, setUseOverlayBg] = useState<boolean>(true)

  // Tile style values and toggles
  const [inactiveTileBg, setInactiveTileBg] = useState<string>(config?.tileStyles?.inactiveTileBg ?? '#444444FF')
  const [useInactiveTileBg, setUseInactiveTileBg] = useState<boolean>(true)
  const [inactiveTileEdge, setInactiveTileEdge] = useState<string>(config?.tileStyles?.inactiveTileEdge ?? '#444444FF')
  const [useInactiveTileEdge, setUseInactiveTileEdge] = useState<boolean>(true)
  const [boardTileBg, setBoardTileBg] = useState<string>(config?.tileStyles?.boardTileBg ?? '#444444FF')
  const [useBoardTileBg, setUseBoardTileBg] = useState<boolean>(true)
  const [boardTileEdge, setBoardTileEdge] = useState<string>(config?.tileStyles?.boardEdge ?? '#444444FF')
  const [useBoardTileEdge, setUseBoardTileEdge] = useState<boolean>(true)

  // Card colors and emoji values and toggles
  const [cardBackBG, setCardBackBG] = useState<string>((config?.cardColors as any)?.backBg ?? '#444444FF')
  const [useCardBackBG, setUseCardBackBG] = useState<boolean>(true)
  const [cardFrontBG, setCardFrontBG] = useState<string>((config?.cardColors as any)?.frontFg ?? '#444444FF')
  const [useCardFrontBG, setUseCardFrontBG] = useState<boolean>(true)
  const [cardGoodBG, setCardGoodBG] = useState<string>((config?.cardColors as any)?.goodAnswerBg ?? '#444444FF')
  const [useCardGoodBG, setUseCardGoodBG] = useState<boolean>(true)
  const [cardGoodEmoji, setCardGoodEmoji] = useState<string>((config?.cardColors as any)?.goodAnswerEmoji ?? '✅')
  const [useCardGoodEmoji, setUseCardGoodEmoji] = useState<boolean>(true)
  const [cardGoodImgURL, setCardGoodImgURL] = useState<string>((config?.cardColors as any)?.goodAnswerImgUrl ?? '')
  const [useCardGoodImgURL, setUseCardGoodImgURL] = useState<boolean>(true)
  const [cardWrongBG, setCardWrongBG] = useState<string>((config?.cardColors as any)?.wrongAnswerBg ?? '#444444FF')
  const [useCardWrongBG, setUseCardWrongBG] = useState<boolean>(true)
  const [cardWrongEmoji, setCardWrongEmoji] = useState<string>((config?.cardColors as any)?.wrongAnswerEmoji ?? '❌')
  const [useCardWrongEmoji, setUseCardWrongEmoji] = useState<boolean>(true)
  const [cardWrongImgURL, setCardWrongImgURL] = useState<string>((config?.cardColors as any)?.wrongAnswerImgUrl ?? '')
  const [useCardWrongImgURL, setUseCardWrongImgURL] = useState<boolean>(true)

  // Assets
  const [cardCoverImages, setCardCoverImages] = useState<string[]>(config?.cardCoverImages || [])
  const [enabledImages, setEnabledImages] = useState<boolean[]>(Array((config?.cardCoverImages || []).length).fill(true))
  const [useCardCoverImages, setUseCardCoverImages] = useState<boolean>(true)
  const [cardCoverFill, setCardCoverFill] = useState<boolean>(config?.cardCoverFill !== false)

  // Questions
  const [questions, setQuestions] = useState<QuizzzQuestion[]>(config?.questions || [])

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [results, setResults] = useState<Array<{ type: GridMapType; name: string; tags?: string[] }>>([])
  const abortRef = useRef<AbortController | null>(null)
  const didInitRef = useRef<boolean>(false)

  const emit = (override?: Partial<QuizzzConfiguration>) => {
    // Allow overrides for these computed blocks (tileStyles, cardColors, cardCoverImages, backgroundCss, overlayBg, cardCoverFill)
    const computedTileStyles = {
      ...(useInactiveTileBg ? { inactiveTileBg } : {}),
      ...(useInactiveTileEdge ? { inactiveTileEdge } : {}),
      ...(useBoardTileBg ? { boardTileBg } : {}),
      ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}),
    }
    const tileStyles = (override && 'tileStyles' in override) ? (override.tileStyles as any) : computedTileStyles

    const computedCardColors: any = {
      ...(useCardBackBG ? { backBg: cardBackBG } : {}),
      ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}),
      ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}),
      ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}),
      ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}),
      ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}),
      ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}),
      ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}),
    }
    const cardColors: any = (override && 'cardColors' in override) ? (override.cardColors as any) : computedCardColors

    const filteredImages = (override && 'cardCoverImages' in override)
      ? (override.cardCoverImages as string[])
      : cardCoverImages.filter((_, i) => enabledImages[i] !== false)

    const next: QuizzzConfiguration = {
      mapType: override?.mapType ?? mapType,
      mapName: override?.mapName ?? mapName,
      selectedMaps: override?.selectedMaps ?? selectedMaps,
      numberOfCards: override?.numberOfCards ?? numberCards,
      rounds: override?.rounds ?? gameRounds,
      winLimit: override?.winLimit ?? winLimit,
      questions: override?.questions ?? questions,
      // backgroundCss precedence: explicit override if provided, else based on toggle + current value
      ...(override && 'backgroundCss' in override
        ? (override.backgroundCss && String(override.backgroundCss).trim() ? { backgroundCss: String(override.backgroundCss) } : {})
        : (useCssBackground && cssBackground.trim() ? { backgroundCss: cssBackground } : {})),
      tileStyles,
      // cardCoverImages + fill
      ...(useCardCoverImages && filteredImages.length ? { cardCoverImages: filteredImages } : {}),
      cardCoverFill: (override && 'cardCoverFill' in override) ? Boolean(override.cardCoverFill) : cardCoverFill,
      cardColors,
      // overlayBg precedence: explicit override if provided, else based on toggle + current value
      ...(override && 'overlayBg' in override
        ? (override.overlayBg && String(override.overlayBg).trim() ? { overlayBg: String(override.overlayBg) } : {})
        : (useOverlayBg && questionOverlayBG.trim() ? { overlayBg: questionOverlayBG } : {})),
    } as any
    onChange(next)
  }

  // Sync when external config changes (edit mode initial load)
  useEffect(() => {
    if (didInitRef.current) return
    if (typeof config?.numberOfCards === 'number') setNumberCards(config.numberOfCards)
    if (typeof config?.rounds === 'number') setGameRounds(config.rounds)
    if (typeof config?.winLimit === 'number') setWinLimit(config.winLimit)
    if (config?.selectedMaps) setSelectedMaps(config.selectedMaps)
    if (typeof config?.backgroundCss === 'string') setCssBackground(config.backgroundCss)
    if (typeof config?.overlayBg === 'string') setQuestionOverlayBG(config.overlayBg)
    if (Array.isArray(config?.cardCoverImages)) {
      setCardCoverImages(config.cardCoverImages)
      setEnabledImages(Array(config.cardCoverImages.length).fill(true))
    }
    if (typeof config?.cardCoverFill === 'boolean') setCardCoverFill(config.cardCoverFill)
    if (Array.isArray(config?.questions)) setQuestions(config.questions)
    if (config?.mapType) setMapType(config.mapType)
    if (typeof config?.mapName === 'string') setMapName(config.mapName)

    // Tile styles
    setInactiveTileBg(config?.tileStyles?.inactiveTileBg ?? '#444444FF')
    setInactiveTileEdge(config?.tileStyles?.inactiveTileEdge ?? '#444444FF')
    setBoardTileBg(config?.tileStyles?.boardTileBg ?? '#444444FF')
    setBoardTileEdge(config?.tileStyles?.boardEdge ?? '#444444FF')

    // Card colors
    setCardBackBG((config?.cardColors as any)?.backBg ?? '#444444FF')
    setCardFrontBG((config?.cardColors as any)?.frontFg ?? '#444444FF')
    setCardGoodBG((config?.cardColors as any)?.goodAnswerBg ?? '#444444FF')
    setCardGoodEmoji((config?.cardColors as any)?.goodAnswerEmoji ?? '✅')
    setCardGoodImgURL((config?.cardColors as any)?.goodAnswerImgUrl ?? '')
    setCardWrongBG((config?.cardColors as any)?.wrongAnswerBg ?? '#444444FF')
    setCardWrongEmoji((config?.cardColors as any)?.wrongAnswerEmoji ?? '❌')
    setCardWrongImgURL((config?.cardColors as any)?.wrongAnswerImgUrl ?? '')

    didInitRef.current = true
  }, [config])

  // Debounced search across admin map lists
  useEffect(() => {
    if (!searchTerm) { setResults([]); return }
    if (abortRef.current) abortRef.current.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const doSearch = async () => {
      try {
        setIsSearching(true)
        const q = searchTerm.trim()
        const all: Array<{ type: GridMapType; name: string; tags?: string[] }>= []
        const types: GridMapType[] = ['hex','square']
        await Promise.all(types.map(async (t) => {
          const base = t === 'hex' ? '/api/admin/hexmaps' : '/api/admin/squaremaps'
          const url = `${base}?search=${encodeURIComponent(q)}&limit=20`
          const res = await fetch(url, { signal: ac.signal })
          if (!res.ok) return
          const data = await res.json()
          const items = Array.isArray(data?.data?.items) ? data.data.items : []
          items.forEach((it: any) => {
            if (typeof it?.name === 'string' && it.name.trim()) {
              all.push({ type: t, name: it.name, tags: it.tags })
            }
          })
        }))
        setResults(all)
      } catch (_) {
        if (!ac.signal.aborted) setResults([])
      } finally { setIsSearching(false) }
    }

    const id = setTimeout(doSearch, 200)
    return () => { clearTimeout(id); ac.abort() }
  }, [searchTerm])

  // Question helpers
  const addQuestion = () => {
    const id = `q-${questions.length + 1}`
    const q: QuizzzQuestion = {
      id,
      text: '',
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }
    const next = [...questions, q]
    setQuestions(next)
    emit({ questions: next })
  }

  const updateQuestion = (idx: number, patch: Partial<QuizzzQuestion>) => {
    const next = questions.map((q, i) => i === idx ? { ...q, ...patch } : q)
    setQuestions(next)
    emit({ questions: next })
  }

  const updateAnswer = (qIdx: number, aIdx: number, patch: Partial<{ text: string; isCorrect: boolean }>) => {
    const next = questions.map((q, i) => {
      if (i !== qIdx) return q
      const arr = q.answers.map((a, j) => j === aIdx ? { ...a, ...patch } : a)
      return { ...q, answers: arr }
    }) as QuizzzQuestion[]
    setQuestions(next)
    emit({ questions: next })
  }

  const removeAnswer = (qIdx: number, aIdx: number) => {
    const next = questions.map((q, i) => {
      if (i !== qIdx) return q
      if (q.answers.length <= 2) return q
      const arr = q.answers.filter((_, j) => j !== aIdx)
      return { ...q, answers: arr }
    }) as QuizzzQuestion[]
    setQuestions(next)
    emit({ questions: next })
  }

  const removeQuestion = (idx: number) => {
    const next = questions.filter((_, i) => i !== idx)
    setQuestions(next)
    emit({ questions: next })
  }

  // Card cover images
  const [newImageUrl, setNewImageUrl] = useState('')

  const addImage = () => {
    const url = newImageUrl.trim()
    if (!url) return
    const next = Array.from(new Set([...(cardCoverImages||[]), url]))
    setCardCoverImages(next)
    // Ensure enabledImages mirrors the images array and defaults to true for new items
    setEnabledImages((prev) => {
      const base = Array.isArray(prev) ? [...prev] : []
      while (base.length < next.length) base.push(true)
      return base.slice(0, next.length)
    })
    setNewImageUrl('')
    emit({ cardCoverImages: next })
  }

  return (
    <div className="space-y-6" style={{ color: '#000000FF' }}>
      {/* mapfinder */}
      <div>
        <label className="block text-sm font-medium text-black mb-1">mapfinder</label>
        <input className="w-full px-3 py-2 border rounded bg-white text-black" value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)} placeholder="Type map name..." />
        <div className="mt-2 border rounded max-h-56 overflow-auto bg-white" hidden={!(results && results.length)}>
          {isSearching && <div className="px-3 py-2 text-sm text-black">Searching…</div>}
          {!isSearching && results.map((r, idx)=> (
            <button key={`${r.type}:${r.name}:${idx}`} type="button" className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b last:border-b-0" onClick={()=>{
              if (!selectedMaps.some(m => m.type === r.type && m.name === r.name)) {
                const next = [...selectedMaps, { type: r.type, name: r.name }]
                setSelectedMaps(next)
                emit({ selectedMaps: next })
              }
            }}>
              <span className="text-sm text-black">{r.name}</span>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 text-black">{r.type}</span>
            </button>
          ))}
        </div>
        {selectedMaps.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedMaps.map((m, i) => (
              <span key={`${m.type}:${m.name}:${i}`} className="px-2 py-1 text-xs bg-blue-500 text-black rounded-full flex items-center gap-1">
                #{m.name}
                <span className="text-[10px] uppercase bg-blue-100 text-black px-1 py-0.5 rounded">{m.type}</span>
                <button type="button" title="Remove" className="ml-1 text-black hover:opacity-80" onClick={()=>{
                  const next = selectedMaps.filter((_, idx) => idx !== i)
                  setSelectedMaps(next)
                  emit({ selectedMaps: next })
                }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Basic numbers — each on its own line */}
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black">numberCards</label>
        <input type="number" min={1} className="col-span-8 px-3 py-2 border rounded" value={numberCards} onChange={(e)=> { const n = Math.max(1, Number(e.target.value)||1); setNumberCards(n); emit({ numberOfCards: n }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black">gameRounds</label>
        <input type="number" min={1} className="col-span-8 px-3 py-2 border rounded" value={gameRounds} onChange={(e)=> { const n = Math.max(1, Number(e.target.value)||1); setGameRounds(n); emit({ rounds: n }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black">winLimit</label>
        <input type="number" min={1} className="col-span-8 px-3 py-2 border rounded" value={winLimit} onChange={(e)=> { const n = Math.max(1, Number(e.target.value)||1); setWinLimit(n); emit({ winLimit: n }) }} />
      </div>
      

      {/* cssBackground */}
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          <span className="inline-flex items-center gap-2">
            <input type="checkbox" checked={useCssBackground} onChange={(e)=> { const chk = e.target.checked; setUseCssBackground(chk); emit({ backgroundCss: chk ? cssBackground : '' }) }} />
            cssBackground
          </span>
        </label>
        <textarea className="w-full px-3 py-2 border rounded bg-white text-black" rows={3} value={cssBackground} onChange={(e)=> { const v = e.target.value; setCssBackground(v); emit({ backgroundCss: v }) }} placeholder={'background-color: #EEAECA; /* fallback */\nbackground-image: radial-gradient(circle, #EEAECA 10%, #A1C4FD 20%);'} />
      </div>
      {/* Tile styles — each on its own line */}
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useInactiveTileBg} onChange={(e)=> { const chk = e.target.checked; setUseInactiveTileBg(chk); const ts: any = { ...(chk ? { inactiveTileBg } : {}) , ...(useInactiveTileEdge ? { inactiveTileEdge } : {}), ...(useBoardTileBg ? { boardTileBg } : {}), ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} /> inactiveTileBg</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={inactiveTileBg} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setInactiveTileBg(v); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg: v } : {}), ...(useInactiveTileEdge ? { inactiveTileEdge } : {}), ...(useBoardTileBg ? { boardTileBg } : {}), ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useInactiveTileEdge} onChange={(e)=> { const chk = e.target.checked; setUseInactiveTileEdge(chk); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg } : {}), ...(chk ? { inactiveTileEdge } : {}), ...(useBoardTileBg ? { boardTileBg } : {}), ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} /> inactiveTileEdge</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={inactiveTileEdge} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setInactiveTileEdge(v); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg } : {}), ...(useInactiveTileEdge ? { inactiveTileEdge: v } : {}), ...(useBoardTileBg ? { boardTileBg } : {}), ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useBoardTileBg} onChange={(e)=> { const chk = e.target.checked; setUseBoardTileBg(chk); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg } : {}), ...(useInactiveTileEdge ? { inactiveTileEdge } : {}), ...(chk ? { boardTileBg } : {}), ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} /> boardTileBg</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={boardTileBg} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setBoardTileBg(v); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg } : {}), ...(useInactiveTileEdge ? { inactiveTileEdge } : {}), ...(useBoardTileBg ? { boardTileBg: v } : {}), ...(useBoardTileEdge ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useBoardTileEdge} onChange={(e)=> { const chk = e.target.checked; setUseBoardTileEdge(chk); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg } : {}), ...(useInactiveTileEdge ? { inactiveTileEdge } : {}), ...(useBoardTileBg ? { boardTileBg } : {}), ...(chk ? { boardEdge: boardTileEdge } : {}) }; emit({ tileStyles: ts }) }} /> boardTileEdge</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={boardTileEdge} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setBoardTileEdge(v); const ts: any = { ...(useInactiveTileBg ? { inactiveTileBg } : {}), ...(useInactiveTileEdge ? { inactiveTileEdge } : {}), ...(useBoardTileBg ? { boardTileBg } : {}), ...(useBoardTileEdge ? { boardEdge: v } : {}) }; emit({ tileStyles: ts }) }} />
      </div>

      {/* Card Colors & Emoji — each on its own line */}
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardBackBG} onChange={(e)=> { const chk = e.target.checked; setUseCardBackBG(chk); const cc: any = { ...(chk ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardBackBG</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardBackBG} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setCardBackBG(v); const cc: any = { ...(useCardBackBG ? { backBg: v } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardFrontBG} onChange={(e)=> { const chk = e.target.checked; setUseCardFrontBG(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(chk ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardFrontBG</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardFrontBG} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setCardFrontBG(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: v } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardGoodBG} onChange={(e)=> { const chk = e.target.checked; setUseCardGoodBG(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(chk ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardGoodBG</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardGoodBG} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setCardGoodBG(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: v } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardGoodEmoji} onChange={(e)=> { const chk = e.target.checked; setUseCardGoodEmoji(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(chk ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardGoodEmoji</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardGoodEmoji} placeholder="✅" onChange={(e)=> { const v = e.target.value; setCardGoodEmoji(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: v } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardGoodImgURL} onChange={(e)=> { const chk = e.target.checked; setUseCardGoodImgURL(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(chk ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardGoodImgURL</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardGoodImgURL} placeholder="https://.../good.png" onChange={(e)=> { const v = e.target.value; setCardGoodImgURL(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: v } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardWrongBG} onChange={(e)=> { const chk = e.target.checked; setUseCardWrongBG(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(chk ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardWrongBG</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardWrongBG} placeholder="#444444FF" onChange={(e)=> { const v = e.target.value; setCardWrongBG(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: v } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardWrongEmoji} onChange={(e)=> { const chk = e.target.checked; setUseCardWrongEmoji(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(chk ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardWrongEmoji</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardWrongEmoji} placeholder="❌" onChange={(e)=> { const v = e.target.value; setCardWrongEmoji(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: v } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} />
      </div>
      <div className="grid grid-cols-12 gap-3 items-center">
        <label className="col-span-4 text-sm text-black"><span className="inline-flex items-center gap-2"><input type="checkbox" checked={useCardWrongImgURL} onChange={(e)=> { const chk = e.target.checked; setUseCardWrongImgURL(chk); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(chk ? { wrongAnswerImgUrl: cardWrongImgURL } : {}) }; emit({ cardColors: cc }) }} /> cardWrongImgURL</span></label>
        <input className="col-span-8 px-3 py-2 border rounded" value={cardWrongImgURL} placeholder="https://.../wrong.png" onChange={(e)=> { const v = e.target.value; setCardWrongImgURL(v); const cc: any = { ...(useCardBackBG ? { backBg: cardBackBG } : {}), ...(useCardFrontBG ? { frontFg: cardFrontBG } : {}), ...(useCardGoodBG ? { goodAnswerBg: cardGoodBG } : {}), ...(useCardGoodEmoji ? { goodAnswerEmoji: cardGoodEmoji } : {}), ...(useCardWrongBG ? { wrongAnswerBg: cardWrongBG } : {}), ...(useCardWrongEmoji ? { wrongAnswerEmoji: cardWrongEmoji } : {}), ...(useCardGoodImgURL ? { goodAnswerImgUrl: cardGoodImgURL } : {}), ...(useCardWrongImgURL ? { wrongAnswerImgUrl: v } : {}) }; emit({ cardColors: cc }) }} />
      </div>

      {/* QuestionOverlayBG (multiline) — moved here before Questions */}
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          <span className="inline-flex items-center gap-2">
            <input type="checkbox" checked={useOverlayBg} onChange={(e)=> { const chk = e.target.checked; setUseOverlayBg(chk); emit({ overlayBg: chk ? questionOverlayBG : '' }) }} />
            QuestionOverlayBG
          </span>
        </label>
        <textarea className="w-full px-3 py-2 border rounded bg-white text-black" rows={3} value={questionOverlayBG} onChange={(e)=> { const v = e.target.value; setQuestionOverlayBG(v); emit({ overlayBg: v }) }} placeholder={'background-color: #EEAECA; /* fallback */\nbackground-image: radial-gradient(circle, #EEAECA 10%, #A1C4FD 20%);'} />
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-black">Questions</h3>
          <button type="button" className="px-3 py-2 bg-green-600 text-white rounded" onClick={addQuestion}>(+) add question</button>
        </div>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="border rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-black">question #{idx + 1}</span>
                <button type="button" className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=> removeQuestion(idx)}>Remove</button>
              </div>
              {/* question */}
              <div className="grid grid-cols-12 gap-3 items-center mb-2">
                <label className="col-span-4 text-sm text-black">question</label>
                <input className="col-span-8 px-3 py-2 border rounded" value={q.text} onChange={(e)=> updateQuestion(idx, { text: e.target.value })} placeholder="question" />
              </div>
              {/* answers (at least A,B) */}
              {q.answers.map((a, aIdx) => (
                <div key={aIdx} className="grid grid-cols-12 gap-3 items-center mb-1">
                  <label className="col-span-3 text-sm text-black">{aIdx === 0 ? 'answerA' : aIdx === 1 ? 'answerB' : `answer${String.fromCharCode(65 + aIdx)}`}</label>
                  <button type="button" className="col-span-1 text-red-600 hover:text-red-700 disabled:opacity-40" disabled={aIdx < 2 || q.answers.length <= 2} title={aIdx < 2 ? 'At least two answers required' : 'Remove this answer'} onClick={()=> removeAnswer(idx, aIdx)}>(x)</button>
                  <input className="col-span-6 px-3 py-2 border rounded" value={a.text} onChange={(e)=> updateAnswer(idx, aIdx, { text: e.target.value })} />
                  <label className="col-span-2 flex items-center gap-2 text-sm text-black"><input type="checkbox" checked={a.isCorrect} onChange={(e)=> updateAnswer(idx, aIdx, { isCorrect: e.target.checked })} /> Correct</label>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => {
                  const next = [...questions]
                  next[idx] = { ...next[idx], answers: [...next[idx].answers, { text: '', isCorrect: false }] }
                  setQuestions(next); emit({ questions: next })
                }}>(+) add answer</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* cardCoverImages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-black flex items-center gap-2">
            <input type="checkbox" checked={useCardCoverImages} onChange={(e)=> { const chk = e.target.checked; setUseCardCoverImages(chk); emit() }} />
            cardCoverImages
          </h3>
          <label className="flex items-center gap-2 text-sm text-black"><input type="checkbox" checked={cardCoverFill} onChange={(e)=> { const chk = e.target.checked; setCardCoverFill(chk); emit({ cardCoverFill: chk }) }} /> COVER (unchecked = FILL)</label>
        </div>
        <div className="mb-2">
          <input className="w-full px-3 py-2 border rounded bg-white text-black" placeholder="https://example.com/image.png" value={newImageUrl} onChange={e=> setNewImageUrl(e.target.value)} disabled={!useCardCoverImages} />
        </div>
        <div className="mb-2">
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={!useCardCoverImages || !newImageUrl.trim()} onClick={addImage}>[add image]</button>
        </div>
        {cardCoverImages && cardCoverImages.length > 0 ? (
          <ul className="space-y-2">
            {cardCoverImages.map((u, idx) => (
              <li key={`${u}:${idx}`} className="flex items-center justify-between border rounded p-2 bg-white">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={enabledImages[idx] !== false} onChange={(e)=> {
                    const next = [...enabledImages]
                    next[idx] = e.target.checked
                    setEnabledImages(next)
                    // Do not mutate cardCoverImages here; keep UI list intact
                    // Runtime selection is derived at save time by including only enabled images in emitted config
                    emit()
                  }} />
                  <Image src={u} alt="cover" width={80} height={80} className="object-contain" unoptimized />
                </div>
                <button type="button" className="text-red-600 hover:text-red-700" onClick={()=>{
                  const nextImgs = cardCoverImages.filter((_, i) => i !== idx)
                  const nextEn = enabledImages.filter((_, i) => i !== idx)
                  setCardCoverImages(nextImgs)
                  setEnabledImages(nextEn)
                  // Persist new full list; runtime can still use enabled flags when emitting final config
                  emit({ cardCoverImages: nextImgs })
                }}>(x)</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-black">No images added yet.</p>
        )}
      </div>
    </div>
  )
}