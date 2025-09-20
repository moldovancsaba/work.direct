'use client'

// app/components/runtime/SquareMapRuntime.tsx
// WHAT: Simple runtime renderer for square maps using fitSquareFieldToViewport.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cellToPixel, squareVertices } from '@/lib/square/geometry'
import { fitSquareFieldToViewport, type SquareCoord, type SquareFieldExtents } from '@/lib/grid/fit'

interface SquareMapRuntimeProps {
  radius: number
  fieldMask: SquareCoord[]
  coords: SquareCoord[]
  fieldExtents?: SquareFieldExtents | null
  backgroundImageUrl?: string
  height?: number // px; default 420
}

export default function SquareMapRuntime({ radius, fieldMask, coords, fieldExtents, backgroundImageUrl, height = 420 }: SquareMapRuntimeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [vw, setVw] = useState<number>(800)
  const [vh, setVh] = useState<number>(height)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const cr = e.contentRect
        setVw(cr.width)
        setVh(height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  const { s, offsetX, offsetY } = useMemo(() => fitSquareFieldToViewport({
    fieldExtents: fieldExtents || undefined,
    fieldMask,
    radius,
    viewportWidth: vw,
    viewportHeight: vh,
  }), [fieldExtents, fieldMask, radius, vw, vh])

  const maskSet = useMemo(() => new Set((fieldMask || []).map(c => `${c.x},${c.y}`)), [fieldMask])
  const cardSet = useMemo(() => new Set((coords || []).map(c => `${c.x},${c.y}`)), [coords])

  const drawRefs = useMemo<SquareCoord[]>(() => {
    const m = fieldMask || []
    const c = coords || []
    if (m.length || c.length) return Array.from(new Set([...m, ...c].map(v => `${v.x},${v.y}`))).map(k => ({ x: parseInt(k.split(',')[0], 10), y: parseInt(k.split(',')[1], 10) }))
    const refs: SquareCoord[] = []
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) refs.push({ x, y })
    }
    return refs
  }, [fieldMask, coords, radius])

  const COLOR_FIELD = '#2e7d32'
  const COLOR_CARD = '#c62828'
  const COLOR_BG = 'transparent'
  const COLOR_STROKE = '#000'

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}>
        {backgroundImageUrl && (
          <image href={backgroundImageUrl} x={0} y={0} width={vw} height={vh} preserveAspectRatio="xMidYMid slice" />
        )}
        <rect x={0} y={0} width={vw} height={vh} fill={COLOR_BG} />
        {drawRefs.map((c, idx) => {
          const center = cellToPixel(c.x, c.y, s)
          const verts = squareVertices(center.x, center.y, s)
          const pts = verts.map(v => ({ x: v.x + offsetX, y: v.y + offsetY }))
          const key = `${c.x},${c.y}`
          const isMask = maskSet.has(key)
          const isCard = cardSet.has(key)
          if (!isMask && !isCard) return null
          const poly = pts.map(p => `${p.x},${p.y}`).join(' ')
          const fill = isCard ? COLOR_CARD : COLOR_FIELD
          return (
            <polygon key={`${key}:${idx}`} points={poly} fill={fill} stroke={COLOR_STROKE} strokeWidth={1} />
          )
        })}
      </svg>
    </div>
  )
}