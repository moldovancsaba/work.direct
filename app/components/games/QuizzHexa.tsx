"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { axialToPixel, rotatePoint, hexVertices, polygonPointsString, SQRT3 } from '@/lib/hex/geometry'
import type { QuizzQuestion, HexCoord } from '../../types'

interface QuizzHexaProps {
  mapName?: string
  activeCoords?: HexCoord[]
  rounds: number
  targetCorrect: number
  questions: QuizzQuestion[]
  onResult?: (result: { correct: number; rounds: number; won: boolean }) => void
}

export default function QuizzHexa({ mapName, activeCoords, rounds, targetCorrect, questions, onResult }: QuizzHexaProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<HexCoord[]>([])
  const [hexSize, setHexSize] = useState(80)
  const [currentRound, setCurrentRound] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [questionMap, setQuestionMap] = useState<Record<string, QuizzQuestion>>({})
  const [overlay, setOverlay] = useState<{ key: string; q: QuizzQuestion } | null>(null)

  // Load coords from map API if mapName provided
  useEffect(() => {
    let aborted = false
    const load = async () => {
      if (activeCoords && activeCoords.length) {
        setCoords(activeCoords)
        return
      }
      if (mapName) {
        const res = await fetch(`/api/maps/${encodeURIComponent(mapName)}`, { cache: 'no-store' })
        const data = await res.json()
        if (!aborted && res.ok && data?.success) setCoords(data.data.coords || [])
      }
    }
    load()
    return () => { aborted = true }
  }, [mapName, activeCoords])

  // Assign random questions to keys of coords; use only as many as available
  useEffect(() => {
    if (!coords.length || !questions?.length) return
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    const map: Record<string, QuizzQuestion> = {}
    coords.forEach((c, i) => {
      const q = shuffled[i % shuffled.length]
      map[`${c.q},${c.r}`] = q
    })
    setQuestionMap(map)
  }, [coords, questions])

  // Layout
  useEffect(() => {
    const resize = () => {
      const el = stageRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vw = r.width || 800
      const vh = r.height || 600
      const s0 = Math.max(24, Math.min(vw, vh) / 10)
      setHexSize(s0 * 0.96)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const handleFlip = (key: string) => {
    if (overlay) return
    setRevealedKey(key)
    const q = questionMap[key]
    if (q) setOverlay({ key, q })
  }

  const handleAnswer = (answerIndex: number) => {
    if (!overlay) return
    const { key, q } = overlay
    const isCorrect = Boolean(q.answers[answerIndex]?.isCorrect)
    if (isCorrect) setCorrect(prev => prev + 1)

    const nextRound = currentRound + 1
    setCurrentRound(nextRound)
    setOverlay(null)

    if (nextRound > rounds) {
      const won = (isCorrect ? correct + 1 : correct) >= targetCorrect
      onResult?.({ correct: isCorrect ? correct + 1 : correct, rounds, won })
    }
  }

  const svgContent = useMemo(() => {
    if (!stageRef.current) return null
    const rect = stageRef.current.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600
    const s = hexSize
    const offsetX = vw / 2
    const offsetY = vh / 2

    const groups: JSX.Element[] = []
    for (const c of coords) {
      const k = `${c.q},${c.r}`
      const center = axialToPixel(c.q, c.r, s)
      const verts = hexVertices(center.x, center.y, s).map(p => {
        const rp = rotatePoint(p.x, p.y)
        return { x: rp.x + offsetX, y: rp.y + offsetY }
      })
      const points = polygonPointsString(verts)
      const cx = verts.reduce((a, p) => a + p.x, 0) / 6
      const cy = verts.reduce((a, p) => a + p.y, 0) / 6

      groups.push(
        <g key={k}>
          <polygon
            points={points}
            fill={'#228be6'}
            opacity={1}
            stroke="#ffffff"
            strokeWidth={Math.max(1, s * 0.06)}
            style={{ cursor: 'pointer', transition: 'fill 120ms' }}
            onClick={() => handleFlip(k)}
          />
          <text x={cx} y={cy} fill="#ffffff" fontSize={Math.max(10, s * 0.35)} fontWeight={600} textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>{k}</text>
        </g>
      )
    }
    return groups
  }, [coords, hexSize, questionMap])

  const overlayContent = overlay ? (
    <div className="absolute inset-0 grid place-items-center bg-black/60">
      <div className="relative" style={{ width: 0, height: 0 }}>
        <div style={{ transform: 'rotate(30deg)' }}>
          <div
            className="relative"
            style={{
              width: `${hexSize * 3}px`,
              height: `${hexSize * 3 * 0.8660254037844386}px`,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              background: '#111827',
              border: '3px solid #60a5fa'
            }}
          >
            <div style={{ transform: 'rotate(-30deg)' }} className="absolute inset-0 p-4 text-white flex flex-col gap-3">
              <div className="font-bold">{overlay.q.text}</div>
              <div className="grid gap-2">
                {overlay.q.answers.map((a, idx) => (
                  <button key={idx} className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700" onClick={() => handleAnswer(idx)}>
                    {a.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div ref={stageRef} className="relative w-full h-full" style={{ minHeight: 480, background: 'radial-gradient(800px 500px at 50% 50%, #0b1220 0%, #0a0f1f 50%, #060914 100%)' }}>
      <svg className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>
        {svgContent}
      </svg>
      {overlayContent}
      <div className="absolute top-4 right-4 bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold">
        {correct}/{targetCorrect} correct — Round {currentRound}/{rounds}
      </div>
    </div>
  )
}
