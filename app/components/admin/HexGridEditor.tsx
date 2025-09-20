'use client'

// app/components/admin/HexGridEditor.tsx
// WHAT: Interactive SVG-based hex grid editor for unified selection:
//       click cycles none → fieldMask (grass-green) → fieldMask+card (blood-red) → none.
// WHY: Single grid to define both visible field (fieldMask) and interactive cards (coords).

import React, { useMemo, useCallback } from 'react'
import { axialToPixel, hexVertices, polygonPointsString, hexDistance } from '@/lib/hex/geometry'

export type HexCoord = { q: number; r: number }

interface HexGridEditorProps {
  radius: number
  coords: HexCoord[]
  fieldMask: HexCoord[]
  onChange: (nextCoords: HexCoord[], nextFieldMask: HexCoord[]) => void
  size?: number // hex size (half width); default ~28px for comfortable editing
  backgroundImageUrl?: string
}

function keyOf(c: HexCoord) {
  return `${c.q},${c.r}`
}

export default function HexGridEditor({ radius, coords, fieldMask, onChange, size = 28, backgroundImageUrl }: HexGridEditorProps) {
  // Selection sets
  const cardSet = useMemo(() => new Set((coords || []).map(keyOf)), [coords])
  const maskSet = useMemo(() => new Set((fieldMask || []).map(keyOf)), [fieldMask])

  // Generate cells for radius + 3 rings to show "perspective" beyond selection radius
  const extended = radius + 3
  const cells = useMemo(() => {
    const list: Array<{ q: number; r: number; cx: number; cy: number; verts: { x: number; y: number }[]; inside: boolean }> = []
    for (let q = -extended; q <= extended; q++) {
      const r1 = Math.max(-extended, -q - extended)
      const r2 = Math.min(extended, -q + extended)
      for (let r = r1; r <= r2; r++) {
        const { x: cx, y: cy } = axialToPixel(q, r, size)
        const verts = hexVertices(cx, cy, size)
        const inside = hexDistance({ q, r }, { q: 0, r: 0 }) <= radius
        list.push({ q, r, cx, cy, verts, inside })
      }
    }
    return list
  }, [radius, size, extended])

  // Compute viewBox from extended cells
  const view = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const c of cells) {
      for (const p of c.verts) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }
    }
    if (!isFinite(minX)) { minX = -100; minY = -100; maxX = 100; maxY = 100 }
    const pad = 20
    return {
      minX: Math.floor(minX - pad),
      minY: Math.floor(minY - pad),
      width: Math.ceil((maxX - minX) + 2 * pad),
      height: Math.ceil((maxY - minY) + 2 * pad)
    }
  }, [cells])

  const toggle = useCallback((q: number, r: number, inside: boolean) => {
    if (!inside) return // outside radius is not selectable
    const k = `${q},${r}`
    const nextCards = new Set(cardSet)
    const nextMask = new Set(maskSet)
    const isMask = nextMask.has(k)
    const isCard = nextCards.has(k)

    if (!isMask && !isCard) {
      // none → mask
      nextMask.add(k)
    } else if (isMask && !isCard) {
      // mask → mask+card
      nextCards.add(k)
    } else {
      // mask+card → none (reset)
      nextCards.delete(k)
      nextMask.delete(k)
    }

    const toArr = (s: Set<string>): HexCoord[] => Array.from(s).map(s => {
      const [qq, rr] = s.split(',').map(n => parseInt(n, 10))
      return { q: qq, r: rr }
    })
    onChange(toArr(nextCards), toArr(nextMask))
  }, [cardSet, maskSet, onChange])

  // Colors
  const COLOR_LIGHT_GREY = '#D3D3D3'
  const COLOR_WHITE = '#FFFFFF'
  const COLOR_GREEN = '#44AA44' // grass-green
  const COLOR_RED = '#C00000'   // blood-red

  return (
    <div className="w-full border rounded bg-white overflow-hidden">
      <svg
        className="w-full h-[420px] block"
        viewBox={`${view.minX} ${view.minY} ${view.width} ${view.height}`}
        role="img"
        aria-label="Hex grid editor"
      >
        {/* Background image (optional) */}
        {backgroundImageUrl && (
          <image href={backgroundImageUrl} x={view.minX} y={view.minY} width={view.width} height={view.height} preserveAspectRatio="xMidYMid slice" />
        )}
        {/* Background fill */}
        <rect x={view.minX} y={view.minY} width={view.width} height={view.height} fill="transparent" />
        {cells.map((c, idx) => {
          const k = keyOf(c)
          const isMask = maskSet.has(k)
          const isCard = cardSet.has(k)
          const fill = c.inside
            ? (isCard ? COLOR_RED : (isMask ? COLOR_GREEN : COLOR_LIGHT_GREY))
            : COLOR_WHITE
          const pts = polygonPointsString(c.verts)
          return (
            <g key={`${c.q},${c.r}:${idx}`} onClick={() => toggle(c.q, c.r, c.inside)} className={c.inside ? 'cursor-pointer' : 'cursor-not-allowed'}>
              <polygon points={pts} fill={fill} stroke="#000" strokeWidth={1} />
              <text x={c.cx} y={c.cy} fontSize={10} fill="#000" textAnchor="middle" dominantBaseline="middle">{c.q},{c.r}</text>
            </g>
          )
        })}
      </svg>
      <div className="px-3 py-2 text-xs text-gray-600 border-t bg-gray-50">
        Click to cycle: light-grey → grass-green → blood-red → light-grey. Radius: {radius}. Cards: {coords?.length || 0}; Field tiles: {fieldMask?.length || 0}.
      </div>
    </div>
  )
}
