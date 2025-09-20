'use client'

// app/components/runtime/HexMapRuntime.tsx
// WHAT: Simple runtime renderer for hex maps using fitHexFieldToViewport.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { axialToPixel, hexVertices, rotatePoint, hexDistance } from '@/lib/hex/geometry'
import { fitHexFieldToViewport, type HexCoord, type HexFieldExtents } from '@/lib/grid/fit'

interface HexMapRuntimeProps {
  radius: number
  fieldMask: HexCoord[]
  coords: HexCoord[]
  fieldExtents?: HexFieldExtents | null
  backgroundImageUrl?: string
  height?: number // px; default 420
}

export default function HexMapRuntime({ radius, fieldMask, coords, fieldExtents, backgroundImageUrl, height = 420 }: HexMapRuntimeProps) {
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

  const { s, offsetX, offsetY, box } = useMemo(() => fitHexFieldToViewport({
    fieldExtents: fieldExtents || undefined,
    fieldMask,
    radius,
    viewportWidth: vw,
    viewportHeight: vh,
  }), [fieldExtents, fieldMask, radius, vw, vh])

  // Build cells to render: we show fieldMask set and coords set
  const maskSet = useMemo(() => new Set((fieldMask || []).map(c => `${c.q},${c.r}`)), [fieldMask])
  const cardSet = useMemo(() => new Set((coords || []).map(c => `${c.q},${c.r}`)), [coords])

  // Expand draw area to cover mask and cards only (performance-friendly)
  const drawRefs = useMemo<HexCoord[]>(() => {
    const m = fieldMask || []
    const c = coords || []
    if (m.length || c.length) return Array.from(new Set([...m, ...c].map(v => `${v.q},${v.r}`))).map(k => ({ q: parseInt(k.split(',')[0], 10), r: parseInt(k.split(',')[1], 10) }))
    // fallback to radius disc
    const refs: HexCoord[] = []
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius)
      const r2 = Math.min(radius, -q + radius)
      for (let r = r1; r <= r2; r++) refs.push({ q, r })
    }
    return refs
  }, [fieldMask, coords, radius])

  const COLOR_FIELD = '#2e7d32' // darker green
  const COLOR_CARD = '#c62828'  // darker red
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
          const center = axialToPixel(c.q, c.r, s)
          // Rotate vertices for runtime (30°)
          const verts = hexVertices(center.x, center.y, s).map(p => rotatePoint(p.x, p.y, 30))
          // Apply offset
          const pts = verts.map(v => ({ x: v.x + offsetX, y: v.y + offsetY }))
          const key = `${c.q},${c.r}`
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