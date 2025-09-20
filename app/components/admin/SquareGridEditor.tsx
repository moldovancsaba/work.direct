'use client'

// app/components/admin/SquareGridEditor.tsx
// WHAT: Interactive SVG-based square grid editor for unified selection: click cycles none → mask → mask+card → none.

import React, { useMemo, useCallback } from 'react'
import { cellToPixel, squareVertices, polygonPointsString, chebyshevDistance } from '@/lib/square/geometry'

export type SquareCoord = { x: number; y: number }

interface SquareGridEditorProps {
  radius: number
  coords: SquareCoord[]
  fieldMask: SquareCoord[]
  onChange: (nextCoords: SquareCoord[], nextFieldMask: SquareCoord[]) => void
  size?: number
  backgroundImageUrl?: string
}

function keyOf(c: SquareCoord) {
  return `${c.x},${c.y}`
}

export default function SquareGridEditor({ radius, coords, fieldMask, onChange, size = 20, backgroundImageUrl }: SquareGridEditorProps) {
  const cardSet = useMemo(() => new Set((coords || []).map(keyOf)), [coords])
  const maskSet = useMemo(() => new Set((fieldMask || []).map(keyOf)), [fieldMask])

  const extended = radius + 3
  const cells = useMemo(() => {
    const list: Array<{ x: number; y: number; cx: number; cy: number; verts: { x: number; y: number }[]; inside: boolean }> = []
    for (let x = -extended; x <= extended; x++) {
      for (let y = -extended; y <= extended; y++) {
        const { x: cx, y: cy } = cellToPixel(x, y, size)
        const verts = squareVertices(cx, cy, size)
        const inside = chebyshevDistance({ x, y }, { x: 0, y: 0 }) <= radius
        list.push({ x, y, cx, cy, verts, inside })
      }
    }
    return list
  }, [radius, size, extended])

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

  const toggle = useCallback((x: number, y: number, inside: boolean) => {
    if (!inside) return
    const k = `${x},${y}`
    const nextCards = new Set(cardSet)
    const nextMask = new Set(maskSet)
    const isMask = nextMask.has(k)
    const isCard = nextCards.has(k)

    if (!isMask && !isCard) {
      nextMask.add(k)
    } else if (isMask && !isCard) {
      nextCards.add(k)
    } else {
      nextCards.delete(k)
      nextMask.delete(k)
    }

    const toArr = (s: Set<string>): SquareCoord[] => Array.from(s).map(s => {
      const [xx, yy] = s.split(',').map(n => parseInt(n, 10))
      return { x: xx, y: yy }
    })
    onChange(toArr(nextCards), toArr(nextMask))
  }, [cardSet, maskSet, onChange])

  const COLOR_LIGHT_GREY = '#D3D3D3'
  const COLOR_WHITE = '#FFFFFF'
  const COLOR_GREEN = '#44AA44'
  const COLOR_RED = '#C00000'

  return (
    <div className="w-full border rounded bg-white overflow-hidden">
      <svg
        className="w-full h-[420px] block"
        viewBox={`${view.minX} ${view.minY} ${view.width} ${view.height}`}
        role="img"
        aria-label="Square grid editor"
      >
        {backgroundImageUrl && (
          <image href={backgroundImageUrl} x={view.minX} y={view.minY} width={view.width} height={view.height} preserveAspectRatio="xMidYMid slice" />
        )}
        <rect x={view.minX} y={view.minY} width={view.width} height={view.height} fill="transparent" />
        {cells.map((c, idx) => {
          const k = keyOf({ x: c.x, y: c.y })
          const isMask = maskSet.has(k)
          const isCard = cardSet.has(k)
          const fill = c.inside ? (isCard ? COLOR_RED : (isMask ? COLOR_GREEN : COLOR_LIGHT_GREY)) : COLOR_WHITE
          const pts = polygonPointsString(c.verts)
          return (
            <g key={`${c.x},${c.y}:${idx}`} onClick={() => toggle(c.x, c.y, c.inside)} className={c.inside ? 'cursor-pointer' : 'cursor-not-allowed'}>
              <polygon points={pts} fill={fill} stroke="#000" strokeWidth={1} />
              <text x={c.cx} y={c.cy} fontSize={10} fill="#000" textAnchor="middle" dominantBaseline="middle">{c.x},{c.y}</text>
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
