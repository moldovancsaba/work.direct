"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { axialToPixel, rotatePoint, hexVertices, polygonPointsString } from '../../lib/hex/geometry'
import { cellToPixel, squareVertices } from '../../lib/square/geometry'
import type { QuizzQuestion, HexCoord, SquareCoord, GridMapType } from '../../types'

interface QuizzHexaProps {
  mapType?: GridMapType
  mapName?: string
  activeCoords?: Array<HexCoord | SquareCoord>
  mapTag?: string
  selectedMaps?: { type: GridMapType; name: string }[]
  randomizeSelectedMaps?: boolean
  rounds: number
  targetCorrect: number
  questions: QuizzQuestion[]
  overlayBg?: string
  cardCoverImages?: string[]
  onResult?: (result: { correct: number; rounds: number; won: boolean }) => void
}

export default function QuizzHexa({ mapType = 'hex', mapName, activeCoords, mapTag, selectedMaps, randomizeSelectedMaps, rounds, targetCorrect, questions, overlayBg = 'rgba(0,0,0,0.6)', cardCoverImages, onResult }: QuizzHexaProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<Array<HexCoord | SquareCoord>>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [cellSize, setCellSize] = useState(80)
  const [currentRound, setCurrentRound] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [questionMap, setQuestionMap] = useState<{ [key: string]: QuizzQuestion }>({})
  const [labelMap, setLabelMap] = useState<{ [key: string]: string }>({})
  const [overlay, setOverlay] = useState<{ key: string; q: QuizzQuestion } | null>(null)
  const [done, setDone] = useState(false)
  // Effective type actually used for rendering (may differ if we found a map in another collection)
  const [effectiveType, setEffectiveType] = useState<GridMapType>(mapType)
  // Optional background image provided by the map document (public API includes it)
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)

  // Default fallback 2-3-2 formation around origin
  const defaultSevenHex: HexCoord[] = useMemo(() => ([
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: -1, r: 0 },
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
  ]), [])

  const defaultNineSquare: SquareCoord[] = useMemo(() => ([
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 },
    { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
  ]), [])

  // Load coords strictly based on configured mapType (no cross-type fallback)
  useEffect(() => {
    let aborted = false
    setLoading(true)
    const load = async () => {
      if (activeCoords && activeCoords.length) {
        setCoords(activeCoords)
        setEffectiveType(mapType)
        return
      }

      const baseFor = (t: GridMapType) => (t === 'hex' ? '/api/hexmaps' : '/api/squaremaps')

      // If admin selected maps, try the first one
      if (selectedMaps && selectedMaps.length) {
        const pickIndex = randomizeSelectedMaps ? Math.floor(Math.random() * selectedMaps.length) : 0
        const first = selectedMaps[pickIndex]
        try {
          const res = await fetch(`${baseFor(first.type)}/${encodeURIComponent(first.name)}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
            const bg = data?.data?.backgroundImageUrl || null
            if (!aborted && c.length > 0) {
              const limit = first.type === 'hex' ? 7 : 9
              const chosen = (c as any[]).slice(0, Math.min(limit, (c as any[]).length))
              setCoords(chosen as any)
              setEffectiveType(first.type)
              setBackgroundUrl(bg || null)
              setLoading(false)
              return
            }
          }
        } catch {}
      }

      const base = baseFor(mapType)

      // Try by explicit name first (strict, single endpoint)
      if (mapName && mapName.trim()) {
        try {
          const name = mapName.trim()
          const res = await fetch(`${base}/${encodeURIComponent(name)}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
            const bg = data?.data?.backgroundImageUrl || null
            if (!aborted && c.length > 0) {
              const limit = mapType === 'hex' ? 7 : 9
              const chosen = (c as any[]).slice(0, Math.min(limit, (c as any[]).length))
              setCoords(chosen as any)
              setEffectiveType(mapType)
              setBackgroundUrl(bg || null)
              setLoading(false)
              return
            }
          }
        } catch {}
      }

      // Otherwise, try random by tag strictly for selected type
      const tag = (mapTag && mapTag.trim()) ? mapTag.trim() : 'water'
      try {
        const res = await fetch(`${base}/random?tag=${encodeURIComponent(tag)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
          const bg = data?.data?.backgroundImageUrl || null
          if (!aborted && c.length > 0) {
            const limit = mapType === 'hex' ? 7 : 9
            const chosen = (c as any[]).slice(0, Math.min(limit, (c as any[]).length))
            setCoords(chosen as any)
            setEffectiveType(mapType)
            setBackgroundUrl(bg || null)
            return
          }
        }
      } catch {}

      // If nothing was loaded, do not fallback to any shape; keep empty to avoid flash
      if (!aborted) {
        setCoords([] as any)
        setEffectiveType(mapType)
        setBackgroundUrl(null)
        setLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [mapType, mapName, activeCoords, mapTag, defaultSevenHex, defaultNineSquare])

  // If explicit activeCoords are provided, infer effective type
  useEffect(() => {
    if (activeCoords && activeCoords.length) {
      const f: any = activeCoords[0]
      if (typeof f?.q === 'number' && typeof f?.r === 'number') {
        setEffectiveType('hex')
      } else if (typeof f?.x === 'number' && typeof f?.y === 'number') {
        setEffectiveType('square')
      }
    }
  }, [activeCoords])

  // Precompute question assignment bag per game start (no repeat until all used)
  const questionBag = useMemo(() => {
    const n = (coords as any[])?.length || 0
    const qs = Array.isArray(questions) ? (questions as QuizzQuestion[]).filter(Boolean) : []
    if (n === 0 || qs.length === 0) return [] as QuizzQuestion[]
    const shuffle = <T,>(arr: T[]): T[] => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    }
    const bag: QuizzQuestion[] = []
    const cycles = Math.ceil(n / qs.length)
    for (let c = 0; c < cycles; c++) {
      bag.push(...shuffle(qs))
    }
    return bag.slice(0, n)
  }, [coords, questions])

  // Assign random questions to keys of coords; use only as many as available
  useEffect(() => {
    if (!coords.length || !questions?.length) return

    // What: Generate short, user-friendly hex titles per assigned question
    // Why: Replace technical coordinates with readable labels; prefer trimmed question prefix (<= 8 chars),
    //      fallback to a stable pseudo-random water-themed short title for consistency across renders.
    const SHORT_TITLES = [
      'Wave','Tide','Aqua','Coral','Reef','Drip','Drop','Foam','Pearl','Lagoon',
      'Spray','Ripple','Jet','Mist','Sail','Gulf','Bay','Surf','Flow','Breeze'
    ]
    const shuffle = <T,>(arr: T[]): T[] => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    }
    const randomTitles = shuffle(SHORT_TITLES)

    const toShortLabel = (text: string | undefined, index: number): string => {
      const base = (text || '').replace(/\s+/g, ' ').trim()
      if (base.length > 0) {
        // Take first 8 visible characters; maintain casing, trim trailing punctuation
        const raw = base.slice(0, 8)
        return raw.replace(/[\s\-_,.:;!]+$/g, '') || raw
      }
      // Randomized fallback: shuffled list mapped by index for this render
      return randomTitles[index % randomTitles.length]
    }

    // Build mapping using precomputed question bag
    const map: { [key: string]: QuizzQuestion } = Object.create(null)
    const labels: { [key: string]: string } = Object.create(null)
    ;(coords as any[]).forEach((c, i) => {
      const q = questionBag[i]
      if (!q) return
      let key: string | null = null
      if (effectiveType === 'hex') {
        const hv = c as HexCoord
        if (typeof hv?.q === 'number' && typeof hv?.r === 'number') key = `${hv.q},${hv.r}`
      } else {
        const sv = c as SquareCoord
        if (typeof sv?.x === 'number' && typeof sv?.y === 'number') key = `${sv.x},${sv.y}`
      }
      if (key) {
        map[key] = q
        labels[key] = toShortLabel(q?.text, i)
      }
    })
    setQuestionMap(map)
    setLabelMap(labels)
  }, [coords, questionBag, effectiveType])

  // Layout - compute cell size to fit all coordinates
  useEffect(() => {
    const computeFitAndResize = () => {
      const el = stageRef.current
      if (!el || coords.length === 0) return
      const r = el.getBoundingClientRect()
      const vw = r.width || 800
      const vh = r.height || 600
      const margin = 0.92
      // Start with a base size and compute rotated bounding box
      const base = Math.max(16, Math.min(vw, vh) / 10)
      const box = (() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const c of coords as any[]) {
          if (effectiveType === 'hex') {
            const hv = c as HexCoord
            if (typeof hv?.q !== 'number' || typeof hv?.r !== 'number') continue
            const center = axialToPixel(hv.q, hv.r, base)
            const verts = hexVertices(center.x, center.y, base).map(p => rotatePoint(p.x, p.y))
            for (const v of verts) {
              if (v.x < minX) minX = v.x
              if (v.x > maxX) maxX = v.x
              if (v.y < minY) minY = v.y
              if (v.y > maxY) maxY = v.y
            }
          } else {
            const sv = c as SquareCoord
            if (typeof sv?.x !== 'number' || typeof sv?.y !== 'number') continue
            const cp = cellToPixel(sv.x, sv.y, base)
            const verts = squareVertices(cp.x, cp.y, base)
            for (const v of verts) {
              if (v.x < minX) minX = v.x
              if (v.x > maxX) maxX = v.x
              if (v.y < minY) minY = v.y
              if (v.y > maxY) maxY = v.y
            }
          }
        }
        return { w: maxX - minX, h: maxY - minY }
      })()
      if (box.w > 0 && box.h > 0) {
        const scale = Math.min((vw * margin) / box.w, (vh * margin) / box.h)
        setCellSize(base * scale)
      }
    }
    computeFitAndResize()
    window.addEventListener('resize', computeFitAndResize)
    return () => window.removeEventListener('resize', computeFitAndResize)
  }, [coords, effectiveType])

  const handleFlip = (key: string) => {
    if (overlay || done) return
    setRevealedKey(key)
    const q = questionMap[key]
    if (q) setOverlay({ key, q })
  }

  const handleAnswer = (answerIndex: number) => {
    if (!overlay || done) return
    const { key, q } = overlay
    const isCorrect = Boolean(q.answers[answerIndex]?.isCorrect)
    const newCorrect = isCorrect ? (correct + 1) : correct

    // Clear overlay and flip cue on the clicked hex
    setOverlay(null)
    setRevealedKey(null)

    // Early finish if reached target
    if (newCorrect >= targetCorrect) {
      setCorrect(newCorrect)
      setDone(true)
      onResult?.({ correct: newCorrect, rounds: currentRound, won: true })
      return
    }

    // Compute next round and finalize if exceeded
    const nextRound = currentRound + 1
    if (nextRound > rounds) {
      const won = newCorrect >= targetCorrect
      setCorrect(newCorrect)
      setDone(true)
      onResult?.({ correct: newCorrect, rounds, won })
      return
    }

    // If this was the last round exactly, also finalize
    if (currentRound >= rounds) {
      const won = newCorrect >= targetCorrect
      setCorrect(newCorrect)
      setDone(true)
      onResult?.({ correct: newCorrect, rounds, won })
      return
    }

    // Otherwise advance to the next round
    setCurrentRound(nextRound)
    setCorrect(newCorrect)
  }

  // Precompute random cover mapping per game start (coords or images change)
  const coverForIndex = useMemo(() => {
    const covers: (string | undefined)[] = []
    const n = (coords as any[])?.length || 0
    const imgs = Array.isArray(cardCoverImages) ? cardCoverImages.filter(Boolean) : []
    if (imgs.length === 0 || n === 0) return covers
    const shuffle = <T,>(arr: T[]): T[] => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    }
    const cycles = Math.ceil(n / imgs.length)
    for (let c = 0; c < cycles; c++) {
      covers.push(...shuffle(imgs))
    }
    return covers.slice(0, n)
  }, [coords, cardCoverImages])

  const svgContent = useMemo(() => {
    if (!stageRef.current) return null
    const rect = stageRef.current.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600
    const s = cellSize
    const offsetX = vw / 2
    const offsetY = vh / 2

    const groups: JSX.Element[] = []
    for (let idx = 0; idx < (coords as any[]).length; idx++) {
      const c0 = (coords as any[])[idx]
      let k: string | null = null
      let points = ''
      let cx = 0, cy = 0
      let bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      if (effectiveType === 'hex') {
        const c = c0 as HexCoord
        if (typeof c?.q !== 'number' || typeof c?.r !== 'number') continue
        k = `${c.q},${c.r}`
        const center = axialToPixel(c.q, c.r, s)
        const verts = hexVertices(center.x, center.y, s).map(p => {
          const rp = rotatePoint(p.x, p.y)
          return { x: rp.x + offsetX, y: rp.y + offsetY }
        })
        points = polygonPointsString(verts)
        cx = verts.reduce((a, p) => a + p.x, 0) / 6
        cy = verts.reduce((a, p) => a + p.y, 0) / 6
        for (const v of verts) { if (v.x < bbox.minX) bbox.minX = v.x; if (v.x > bbox.maxX) bbox.maxX = v.x; if (v.y < bbox.minY) bbox.minY = v.y; if (v.y > bbox.maxY) bbox.maxY = v.y }
      } else {
        const c = c0 as SquareCoord
        if (typeof c?.x !== 'number' || typeof c?.y !== 'number') continue
        k = `${c.x},${c.y}`
        const cp = cellToPixel(c.x, c.y, s)
        const verts = squareVertices(cp.x + offsetX, cp.y + offsetY, s)
        points = polygonPointsString(verts)
        cx = verts.reduce((a, p) => a + p.x, 0) / 4
        cy = verts.reduce((a, p) => a + p.y, 0) / 4
        for (const v of verts) { if (v.x < bbox.minX) bbox.minX = v.x; if (v.x > bbox.maxX) bbox.maxX = v.x; if (v.y < bbox.minY) bbox.minY = v.y; if (v.y > bbox.maxY) bbox.maxY = v.y }
      }

      if (!k) continue
      // Determine cover for this card (if any)
      const coverUrl = coverForIndex[idx]
      const hasCover = !!coverUrl

      groups.push(
        <g
          key={k}
          role="button"
          tabIndex={0}
          onClick={() => handleFlip(k)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(k) } }}
          style={{ cursor: done ? 'not-allowed' : 'pointer' }}
        >
          {/* Base polygon (hit area); hide fill/stroke if cover image provided */}
          <polygon
            points={points}
            fill={hasCover ? 'transparent' : (revealedKey === k ? '#60a5fa' : '#228be6')}
            opacity={1}
            stroke={hasCover ? 'none' : '#ffffff'}
            strokeWidth={hasCover ? 0 : Math.max(1, s * 0.06)}
            style={{ transition: 'fill 120ms', pointerEvents: 'auto' }}
          />
          {/* Optional cover image clipped to polygon */}
          {hasCover && (
            <>
              <defs>
                <clipPath id={`clip-${k}`}>
                  <polygon points={points} />
                </clipPath>
              </defs>
              <image
                href={coverUrl}
                x={bbox.minX}
                y={bbox.minY}
                width={bbox.maxX - bbox.minX}
                height={bbox.maxY - bbox.minY}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#clip-${k})`}
                style={{ pointerEvents: 'none' }}
              />
            </>
          )}
          {/* Label (hidden if a cover image is used for this card) */}
          {!hasCover && (
            <text x={cx} y={cy} fill="#ffffff" fontSize={Math.max(10, s * 0.35)} fontWeight={600} textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>{labelMap[k] || ''}</text>
          )}
        </g>
      )
    }
    return groups
  }, [coords, cellSize, questionMap, effectiveType, coverForIndex])

  const overlayContent = overlay ? (
    // What: Full-main-block overlay for quiz question & answers
    // Why: Improve readability on all screens by occupying the entire game main area, anchored within the GameLayout main block
    <div
      className="absolute inset-0 z-40 overflow-auto"
      style={{ background: overlayBg }}
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 py-6 md:py-10 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ lineHeight: 1.3 }}>{overlay.q.text}</h2>
        <div className="grid gap-3 md:gap-4">
          {overlay.q.answers.map((a, idx) => (
            <button
              key={idx}
              className="px-4 py-3 md:py-4 bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 text-base md:text-lg font-semibold text-left"
              onClick={() => handleAnswer(idx)}
            >
              {a.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null

  if (loading) {
    return (
      <div ref={stageRef} className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 480 }}>
        <div className="text-black text-base">Loading…</div>
      </div>
    )
  }
  return (
    <div
      ref={stageRef}
      className="relative w-full h-full"
      style={{ minHeight: 480 }}
    >
      {backgroundUrl && (
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(800px 500px at 50% 50%, rgba(11,18,32,0.40) 0%, rgba(10,15,31,0.60) 50%, rgba(6,9,20,0.75) 100%)' }}
      />

      <svg className="absolute inset-0 z-10 w-full h-full" style={{ display: 'block' }}>
        {svgContent}
      </svg>
      {overlayContent}
      <div className="absolute z-20 top-4 right-4 bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold">
        {correct}/{targetCorrect} correct — Round {currentRound}/{rounds}
      </div>
    </div>
  )
}
