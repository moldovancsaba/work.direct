"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { axialToPixel, rotatePoint, hexVertices, polygonPointsString } from '../../lib/hex/geometry'
import { cellToPixel, squareVertices } from '../../lib/square/geometry'
import type { QuizzzConfiguration, QuizzzQuestion, GridMapType, HexCoord, SquareCoord } from '../../types'

interface Props {
  config: QuizzzConfiguration
  platformMainBackgroundCss?: string
  onResult?: (r: { correct: number; rounds: number; won: boolean }) => void
}

export default function QuizzzGame({ config, platformMainBackgroundCss, onResult }: Props) {
  // Visual container ref
  const stageRef = useRef<HTMLDivElement>(null)

  // Loading control to avoid showing transient validation or fallbacks
  const [loading, setLoading] = useState<boolean>(true)

  // Derived state
  const [effectiveType, setEffectiveType] = useState<GridMapType>(config?.mapType || 'hex')
  const [coords, setCoords] = useState<Array<HexCoord | SquareCoord>>([])
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)

  // Gameplay state
  const [cellSize, setCellSize] = useState(80)
  const [currentRound, setCurrentRound] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [questionMap, setQuestionMap] = useState<{ [key: string]: QuizzzQuestion }>({})
  const [labelMap, setLabelMap] = useState<{ [key: string]: string }>({})
  const [overlay, setOverlay] = useState<{ key: string; q: QuizzzQuestion } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [answered, setAnswered] = useState<Record<string, 'GOOD'|'BAD'>>({})

  // Validate simple logical rules early
  useEffect(() => {
    if (loading) return
    const rounds = Number(config?.rounds || 1)
    const winLimit = Number(config?.winLimit || 1)
    if (winLimit > rounds) setErrorMsg('add more rounds or reduce the win limit')
    else setErrorMsg(null)
  }, [config?.rounds, config?.winLimit, loading])

  // Load coordinates strictly from setup: selectedMaps (first) or mapName; no shape fallbacks
  useEffect(() => {
    let aborted = false
    setLoading(true)
    const load = async () => {
      const pickFirstSelected = async () => {
        if (Array.isArray(config?.selectedMaps) && config.selectedMaps.length > 0) {
          const first = config.selectedMaps[0]
          const base = first.type === 'hex' ? '/api/hexmaps' : '/api/squaremaps'
          try {
            const res = await fetch(`${base}/${encodeURIComponent(first.name)}`, { cache: 'no-store' })
            if (res.ok) {
              const data = await res.json()
              const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
              const bg = data?.data?.backgroundImageUrl || null
              if (!aborted && c.length > 0) {
                setCoords(c as any)
                setBackgroundUrl(bg || null)
                setEffectiveType(first.type)
                setLoading(false)
                return true
              }
            }
          } catch { /* ignore */ }
        }
        return false
      }

      if (await pickFirstSelected()) return

      if (config?.mapName && config.mapName.trim()) {
        const base = (config.mapType === 'square') ? '/api/squaremaps' : '/api/hexmaps'
        try {
          const res = await fetch(`${base}/${encodeURIComponent(config.mapName.trim())}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
            const bg = data?.data?.backgroundImageUrl || null
            if (!aborted && c.length > 0) {
              setCoords(c as any)
              setBackgroundUrl(bg || null)
              setEffectiveType(config.mapType || 'hex')
              setLoading(false)
              return
            }
          }
        } catch { /* ignore */ }
      }

      // No fallback: keep empty coords to avoid flash; rely on strict setup only
      if (!aborted) {
        setCoords([])
        setBackgroundUrl(null)
        setEffectiveType(config.mapType || 'hex')
        setLoading(false)
      }
    }

    load()
    return () => { aborted = true }
  }, [config?.selectedMaps, config?.mapType, config?.mapName])

  // Derive the active cards set based on numberOfCards and available coords (+generate extras within radius if needed)
  const cards = useMemo(() => {
    const n = Math.max(1, Number(config?.numberOfCards || 1))
    const source = (coords as any[]) || []
    // No auto-expansion: use only configured/loaded coordinates
    return source.slice(0, n)
  }, [coords, config?.numberOfCards])

  // Validate rounds versus cards and questions
  useEffect(() => {
    if (loading) return
    const rounds = Math.max(1, Number(config?.rounds || 1))
    const qs = Array.isArray(config?.questions) ? config.questions : []
    if (rounds > cards.length) setErrorMsg('add more cards or reduce the number of rounds')
    else if (qs.length < 1 || rounds > qs.length) setErrorMsg('add more questions or reduce the number of rounds')
    else if (Number(config?.winLimit || 1) > rounds) setErrorMsg('add more rounds or reduce the win limit')
    else setErrorMsg(null)
  }, [config?.rounds, config?.questions, config?.winLimit, cards.length, loading])

  // Precompute questions assigned to cards (no repeats until all used)
  const questionBag = useMemo(() => {
    const n = cards.length
    const qs = Array.isArray(config?.questions) ? config.questions.filter(Boolean) : []
    if (n === 0 || qs.length === 0) return [] as QuizzzQuestion[]
    const out: QuizzzQuestion[] = []
    const order = [...Array(qs.length).keys()].sort(() => Math.random() - 0.5)
    let idx = 0
    for (let i = 0; i < n; i++) {
      out.push(qs[order[idx]])
      idx = (idx + 1) % qs.length
      if (idx === 0) order.sort(() => Math.random() - 0.5)
    }
    return out
  }, [cards, config?.questions])

  // Map questions to keys and labels
  useEffect(() => {
    if (!cards.length || !questionBag.length) return
    const map: { [key: string]: QuizzzQuestion } = {}
    const labels: { [key: string]: string } = {}
    cards.forEach((c: any, i: number) => {
      const key = effectiveType === 'hex' ? `${c.q},${c.r}` : `${c.x},${c.y}`
      map[key] = questionBag[i]
      labels[key] = String(i + 1)
    })
    setQuestionMap(map)
    setLabelMap(labels)
  }, [cards, questionBag, effectiveType])

  // Fit size to viewport
  useEffect(() => {
    const computeFit = () => {
      const el = stageRef.current
      if (!el || cards.length === 0) return
      const r = el.getBoundingClientRect()
      const vw = r.width || 800
      const vh = r.height || 600
      const margin = 0.9
      const base = Math.max(16, Math.min(vw, vh) / (effectiveType === 'hex' ? 10 : 8))
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const c of cards as any[]) {
        if (effectiveType === 'hex') {
          const center = axialToPixel(c.q, c.r, base)
          const verts = hexVertices(center.x, center.y, base).map(p => rotatePoint(p.x, p.y))
          for (const v of verts) { if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x; if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y }
        } else {
          const cp = cellToPixel(c.x, c.y, base)
          const verts = squareVertices(cp.x, cp.y, base)
          for (const v of verts) { if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x; if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y }
        }
      }
      const boxW = maxX - minX
      const boxH = maxY - minY
      if (boxW > 0 && boxH > 0) {
        const scale = Math.min((vw * margin) / boxW, (vh * margin) / boxH)
        setCellSize(base * scale)
      }
    }
    computeFit()
    window.addEventListener('resize', computeFit)
    return () => window.removeEventListener('resize', computeFit)
  }, [cards, effectiveType])

  // Cover images assignment per card
  const coverForIndex = useMemo(() => {
    const imgs = Array.isArray(config?.cardCoverImages) ? config.cardCoverImages.filter(Boolean) : []
    const n = cards.length
    const covers: (string | undefined)[] = []
    if (n === 0) return covers
    if (imgs.length === 0) return covers
    if (imgs.length >= n) {
      // Use a random subset unique
      const shuffled = [...imgs].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, n)
    }
    if (imgs.length === n) return imgs
    // imgs.length < n => choose one image randomly and use for all
    const one = imgs[Math.floor(Math.random() * imgs.length)]
    for (let i = 0; i < n; i++) covers.push(one)
    return covers
  }, [config?.cardCoverImages, cards.length])

  const handleFlip = (key: string) => {
    if (overlay || done || errorMsg) return
    setRevealedKey(key)
    const q = questionMap[key]
    if (q) setOverlay({ key, q })
  }

  const handleAnswer = (answerIndex: number) => {
    if (!overlay || done) return
    const { key, q } = overlay
    const isCorrect = Boolean(q.answers[answerIndex]?.isCorrect)
    const newCorrect = isCorrect ? (correct + 1) : correct

    setOverlay(null)
    setRevealedKey(null)
    setAnswered(prev => ({ ...prev, [key]: isCorrect ? 'GOOD' : 'BAD' }))

    // Win early if reached winLimit
    if (newCorrect >= Math.max(1, Number(config?.winLimit || 1))) {
      setCorrect(newCorrect)
      setDone(true)
      onResult?.({ correct: newCorrect, rounds: currentRound, won: true })
      return
    }

    const nextRound = currentRound + 1
    if (nextRound > Math.max(1, Number(config?.rounds || 1))) {
      const won = newCorrect >= Math.max(1, Number(config?.winLimit || 1))
      setCorrect(newCorrect)
      setDone(true)
      onResult?.({ correct: newCorrect, rounds: currentRound, won })
      return
    }

    setCurrentRound(nextRound)
    setCorrect(newCorrect)
  }

  // Background precedence: config.backgroundCss > map background image > platform main
  const extractBackgroundValue = (css?: string): string | undefined => {
    if (!css) return undefined
    let last: string | undefined
    const re = /background\s*:\s*([^;]+);?/ig
    let m: RegExpExecArray | null
    while ((m = re.exec(css)) !== null) {
      last = (m[1] || '').trim()
    }
    if (last) return last
    const low = css.toLowerCase()
    const idx = low.lastIndexOf('linear-gradient(')
    if (idx >= 0) {
      let depth = 0
      for (let i = idx; i < css.length; i++) {
        const ch = css[i]
        if (ch === '(') depth++
        else if (ch === ')') { depth--; if (depth === 0) return css.slice(idx, i + 1) }
      }
    }
    return undefined
  }

  const backgroundLayer = useMemo(() => {
    const cfgBg = extractBackgroundValue(config?.backgroundCss)
    if (cfgBg) {
      return <div className="absolute inset-0 z-0" style={{ background: cfgBg }} />
    }
    if (backgroundUrl) {
      return <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
    }
    const platBg = extractBackgroundValue(platformMainBackgroundCss)
    if (platBg) {
      return <div className="absolute inset-0 z-0" style={{ background: platBg }} />
    }
    return null
  }, [config?.backgroundCss, backgroundUrl, platformMainBackgroundCss])

  const svgContent = useMemo(() => {
    if (!stageRef.current) return null
    const rect = stageRef.current.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600
    const s = cellSize
    const offsetX = vw / 2
    const offsetY = vh / 2

    const groups: JSX.Element[] = []
    for (let idx = 0; idx < cards.length; idx++) {
      const c0 = cards[idx] as any
      let k: string | null = null
      let points = ''
      let bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      let cx = 0, cy = 0
      if (effectiveType === 'hex') {
        const c = c0 as HexCoord
        k = `${c.q},${c.r}`
        const center = axialToPixel(c.q, c.r, s)
        const verts = hexVertices(center.x, center.y, s).map(p => {
          const rp = rotatePoint(p.x, p.y)
          return { x: rp.x + offsetX, y: rp.y + offsetY }
        })
        points = polygonPointsString(verts)
        cx = verts.reduce((a, p) => a + p.x, 0) / verts.length
        cy = verts.reduce((a, p) => a + p.y, 0) / verts.length
        for (const v of verts) { if (v.x < bbox.minX) bbox.minX = v.x; if (v.x > bbox.maxX) bbox.maxX = v.x; if (v.y < bbox.minY) bbox.minY = v.y; if (v.y > bbox.maxY) bbox.maxY = v.y }
      } else {
        const c = c0 as SquareCoord
        k = `${c.x},${c.y}`
        const cp = cellToPixel(c.x, c.y, s)
        const verts = squareVertices(cp.x + offsetX, cp.y + offsetY, s)
        points = polygonPointsString(verts)
        cx = verts.reduce((a, p) => a + p.x, 0) / verts.length
        cy = verts.reduce((a, p) => a + p.y, 0) / verts.length
        for (const v of verts) { if (v.x < bbox.minX) bbox.minX = v.x; if (v.x > bbox.maxX) bbox.maxX = v.x; if (v.y < bbox.minY) bbox.minY = v.y; if (v.y > bbox.maxY) bbox.maxY = v.y }
      }
      if (!k) continue

      const coverUrl = coverForIndex[idx]
      const hasCover = !!coverUrl

      const state = answered[k]
      const unrevealedFill = (config?.tileStyles as any)?.inactiveTileBg || '#228be6'
      const unrevealedEdge = (config?.tileStyles as any)?.inactiveTileEdge || '#ffffff'
      const goodBg = (config?.cardColors as any)?.goodAnswerBg || '#22c55e'
      const badBg = (config?.cardColors as any)?.wrongAnswerBg || '#ef4444'
      const backBg = (config?.cardColors as any)?.backBg || unrevealedFill
      const frontFg = (config?.cardColors as any)?.frontFg || '#ffffff'
      const goodEmoji = (config?.cardColors as any)?.goodAnswerEmoji || '✅'
      const badEmoji = (config?.cardColors as any)?.wrongAnswerEmoji || '❌'

      const fillColor = state === 'GOOD' ? goodBg : (state === 'BAD' ? badBg : backBg)

      groups.push(
        <g key={k} role="button" tabIndex={0} onClick={() => { if (!state) handleFlip(k) }} onKeyDown={(e) => { if (!state && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleFlip(k) } }} style={{ cursor: (done || state) ? 'not-allowed' : 'pointer' }}>
          <polygon points={points} fill={hasCover ? 'transparent' : fillColor} opacity={1} stroke={hasCover ? 'none' : unrevealedEdge} strokeWidth={hasCover ? 0 : Math.max(1, s * 0.06)} style={{ transition: 'fill 120ms', pointerEvents: 'auto' }} />
          {hasCover && (
            <>
              <defs>
                <clipPath id={`clip-${k}`}>
                  <polygon points={points} />
                </clipPath>
              </defs>
              <image href={coverUrl} x={bbox.minX} y={bbox.minY} width={bbox.maxX - bbox.minX} height={bbox.maxY - bbox.minY} preserveAspectRatio={config?.cardCoverFill === false ? 'xMidYMid meet' : 'xMidYMid slice'} clipPath={`url(#clip-${k})`} style={{ pointerEvents: 'none' }} />
            </>
          )}
          {state ? (
            <text x={cx} y={cy} fill={frontFg} fontSize={Math.max(10, s * 0.38)} fontWeight={700} textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>{state === 'GOOD' ? goodEmoji : badEmoji}</text>
          ) : (!hasCover && (
            <text x={cx} y={cy} fill={frontFg} fontSize={Math.max(10, s * 0.32)} fontWeight={600} textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>{labelMap[k] || ''}</text>
          ))}
        </g>
      )
    }
    return groups
  }, [cards, cellSize, effectiveType, coverForIndex, revealedKey, config?.cardCoverFill, labelMap])

  const overlayContent = overlay ? (
    <div className="absolute inset-0 z-40 overflow-auto" style={{ background: config?.overlayBg || '#00000044' }} role="dialog" aria-modal="true">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 py-6 md:py-10 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ lineHeight: 1.3 }}>{overlay.q.text}</h2>
        <div className="grid gap-3 md:gap-4">
          {overlay.q.answers.map((a, idx) => (
            <button key={idx} className="px-4 py-3 md:py-4 bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 text-base md:text-lg font-semibold text-left" onClick={() => handleAnswer(idx)}>
              {a.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null

  const errorOverlay = errorMsg ? (
    <div className="absolute inset-0 z-40 overflow-auto" style={{ background: 'rgba(0,0,0,0.6)' }} role="alertdialog" aria-modal="true">
      <div className="mx-auto w-full max-w-xl px-4 md:px-8 py-6 md:py-10 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ lineHeight: 1.3 }}>Configuration error</h2>
        <p className="text-lg">{errorMsg}</p>
      </div>
    </div>
  ) : null

  if (loading) {
    return (
      <div ref={stageRef} className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 480 }}>
        {backgroundLayer}
        <div className="text-black text-base">Loading…</div>
      </div>
    )
  }

  return (
    <div ref={stageRef} className="relative w-full h-full" style={{ minHeight: 480 }}>
      {backgroundLayer}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(800px 500px at 50% 50%, rgba(11,18,32,0.40) 0%, rgba(10,15,31,0.60) 50%, rgba(6,9,20,0.75) 100%)' }} />
      <svg className="absolute inset-0 z-10 w-full h-full" style={{ display: 'block' }}>
        {svgContent}
      </svg>
      {overlayContent}
      {!loading && errorOverlay}
      <div className="absolute z-20 top-4 right-4 bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold">
        {correct}/{Math.max(1, Number(config?.winLimit || 1))} correct — Round {currentRound}/{Math.max(1, Number(config?.rounds || 1))}
      </div>
    </div>
  )
}
