"use client"

// app/admin/mapcreator/page.tsx
// WHAT: Unified Map Creator UI with dropdown for HEX/SQUARE types and improved styling
// WHY: Single source of map creation to prevent unnecessary API calls and streamline administration

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SQRT3, axialToPixel, rotatePoint, hexVertices, polygonPointsString, hexDistance } from '@/lib/hex/geometry'
import { cellToPixel, squareVertices, chebyshevWithin, polygonPointsString as squarePolygonPointsString } from '@/lib/square/geometry'

// Lightweight types
type HexCoord = { q: number; r: number }
type SquareCoord = { x: number; y: number }
type GridMapType = 'hex' | 'square'
type MapCoord = HexCoord | SquareCoord

interface MapDoc {
  _id?: string
  name: string
  coords: MapCoord[]
  radius: number
  hexCount?: number
  cellCount?: number
  tags?: string[]
  backgroundImageUrl?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

const DEFAULT_RADIUS = 4
const HEX_BASE_COLOR = '#44AA44'
const SQUARE_BASE_COLOR = '#44AA44'
const SELECTED_COLOR = '#FF1A1A' // blood-red for high-contrast selected cells

// Clamp helper for square/radius bounds
const clampRadius = (v: number) => Math.max(1, Math.min(24, Math.floor(v)))

export default function MapCreatorPage() {
  // Map type selection
  const [mapType, setMapType] = useState<GridMapType>('hex')
  
  // View refs and sizing
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(80)

  // Map form state
  const [mapId, setMapId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')

  // Selection model keyed by coordinate string
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Search/list state
  const [search, setSearch] = useState('')
  const [list, setList] = useState<MapDoc[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API endpoints based on type
  const getApiBase = useCallback((type: GridMapType) => {
    return type === 'hex' ? '/api/admin/hexmaps' : '/api/admin/squaremaps'
  }, [])

  // Coordinate helpers
  const keyOf = useCallback((coord: MapCoord, type: GridMapType) => {
    if (type === 'hex') {
      const { q, r } = coord as HexCoord
      return `${q},${r}`
    } else {
      const { x, y } = coord as SquareCoord
      return `${x},${y}`
    }
  }, [])

  const parseKey = useCallback((k: string, type: GridMapType): MapCoord => {
    const [a, b] = k.split(',').map(n => parseInt(n, 10))
    if (type === 'hex') {
      return { q: a, r: b } as HexCoord
    } else {
      return { x: a, y: b } as SquareCoord
    }
  }, [])

  // Within radius check based on type
  const withinRadius = useCallback((coord: MapCoord, type: GridMapType) => {
    if (type === 'hex') {
      const { q, r } = coord as HexCoord
      return hexDistance({ q, r }, { q: 0, r: 0 }) <= radius
    } else {
      const { x, y } = coord as SquareCoord
      return chebyshevWithin(x, y, radius)
    }
  }, [radius])

  // Visible range computation
  const computeVisibleRange = useCallback(() => {
    const el = containerRef.current
    if (!el) return mapType === 'hex' 
      ? { qMin: -8, qMax: 8, rMin: -8, rMax: 8 }
      : { xMin: -8, xMax: 8, yMin: -8, yMax: 8 }

    const rect = el.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600
    const s = cellSize

    if (mapType === 'hex') {
      const xStep = 1.5 * s
      const yStep = SQRT3 * s
      const cols = Math.ceil(vw / xStep) + 8
      const rows = Math.ceil(vh / (yStep / 2)) + 8
      const qMin = -Math.ceil(cols / 2), qMax = Math.ceil(cols / 2)
      const rMin = -Math.ceil(rows / 4), rMax = Math.ceil(rows / 4)
      return { qMin, qMax, rMin, rMax }
    } else {
      const pad = 2
      const halfCols = Math.ceil(vw / (2 * s)) + pad
      const halfRows = Math.ceil(vh / (2 * s)) + pad
      const xMin = -halfCols, xMax = halfCols
      const yMin = -halfRows, yMax = halfRows
      return { xMin, xMax, yMin, yMax }
    }
  }, [cellSize, mapType])

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vw = rect.width || 800
      const vh = rect.height || 600
      const margin = 0.96
      const s0 = Math.max(24, Math.min(vw, vh) / 10)
      setCellSize(s0 * margin)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Selection handlers
  const toggleSelect = useCallback((coord: MapCoord) => {
    if (!withinRadius(coord, mapType)) return
    const k = keyOf(coord, mapType)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }, [withinRadius, keyOf, mapType])

  // Clear selection when type changes or ensure selection respects radius
  useEffect(() => {
    setSelected(new Set())
  }, [mapType])

  useEffect(() => {
    if (mapType === 'square') {
      setSelected(prev => new Set(Array.from(prev).filter(k => {
        const coord = parseKey(k, 'square') as SquareCoord
        return chebyshevWithin(coord.x, coord.y, radius)
      })))
    }
  }, [radius, mapType, parseKey])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // Load list with search
  const loadList = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const url = new URL(getApiBase(mapType), window.location.origin)
      if (search.trim()) url.searchParams.set('search', search.trim())
      const res = await fetch(url.toString(), { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data?.success) {
        setList(data.data.items || [])
      } else {
        setError(data?.error?.message || 'Failed to fetch maps')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch maps')
    } finally {
      setLoadingList(false)
    }
  }, [search, mapType, getApiBase])

  useEffect(() => { loadList() }, [loadList])

  const startNew = useCallback(() => {
    setMapId(null)
    setName('')
    setTags([])
    setRadius(DEFAULT_RADIUS)
    setSelected(new Set())
    setBackgroundImageUrl('')
    setError(null)
  }, [])

  const loadMap = useCallback(async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`${getApiBase(mapType)}/${id}`, { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data?.success) {
        const doc: MapDoc = data.data
        setMapId(doc._id || null)
        setName(doc.name || '')
        setTags(doc.tags || [])
        setRadius(mapType === 'square' ? clampRadius(doc.radius || DEFAULT_RADIUS) : (doc.radius || DEFAULT_RADIUS))
        setSelected(new Set((doc.coords || []).map(c => keyOf(c, mapType))))
        setBackgroundImageUrl(doc.backgroundImageUrl || '')
      } else {
        setError(data?.error?.message || 'Failed to load map')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load map')
    }
  }, [mapType, getApiBase, keyOf])

  const saveMap = useCallback(async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    const coords: MapCoord[] = Array.from(selected).map(k => parseKey(k, mapType))
    const payload = { 
      name: name.trim(), 
      coords, 
      radius: mapType === 'square' ? clampRadius(radius) : radius, 
      tags, 
      backgroundImageUrl 
    }
    try {
      if (mapId) {
        const res = await fetch(`${getApiBase(mapType)}/${mapId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Failed to update')
      } else {
        const res = await fetch(getApiBase(mapType), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Failed to create')
        setMapId(data.data?._id || null)
      }
      await loadList()
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [mapId, name, selected, radius, tags, backgroundImageUrl, loadList, mapType, getApiBase, parseKey])

  const deleteMap = useCallback(async () => {
    if (!mapId) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`${getApiBase(mapType)}/${mapId}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Delete failed')
      startNew()
      await loadList()
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }, [mapId, loadList, startNew, mapType, getApiBase])

  // Render SVG grid
  const gridContent = useMemo(() => {
    const el = containerRef.current
    if (!el) return null

    const rect = el.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600
    const s = cellSize
    const offsetX = vw / 2
    const offsetY = vh / 2
    const range = computeVisibleRange()

    const polygons: JSX.Element[] = []
    const baseColor = mapType === 'hex' ? HEX_BASE_COLOR : SQUARE_BASE_COLOR

    if (mapType === 'hex') {
      const { qMin, qMax, rMin, rMax } = range as { qMin: number; qMax: number; rMin: number; rMax: number }
      for (let r = rMin; r <= rMax; r++) {
        for (let q = qMin; q <= qMax; q++) {
          const coord: HexCoord = { q, r }
          const center = axialToPixel(q, r, s)
          const verts = hexVertices(center.x, center.y, s).map(p => {
            const rp = rotatePoint(p.x, p.y)
            return { x: rp.x + offsetX, y: rp.y + offsetY }
          })
          const points = polygonPointsString(verts)
          const k = keyOf(coord, 'hex')
          const isSelected = selected.has(k)
          const inRadius = withinRadius(coord, 'hex')
          const fill = isSelected ? SELECTED_COLOR : baseColor
          const opacity = inRadius ? 1 : 0.35

          const cx = verts.reduce((acc, p) => acc + p.x, 0) / 6
          const cy = verts.reduce((acc, p) => acc + p.y, 0) / 6

          polygons.push(
            <g key={k}>
              <polygon
                points={points}
                fill={fill}
                opacity={opacity}
                stroke="#ffffff"
                strokeWidth={Math.max(1, s * 0.06)}
                style={{ cursor: inRadius ? 'pointer' : 'not-allowed', transition: 'fill 120ms ease-out' }}
                onClick={inRadius ? () => toggleSelect(coord) : undefined}
              />
              <text
                x={cx} y={cy} fill="#ffffff" fontSize={Math.max(10, s * 0.35)} fontWeight={600}
                textAnchor="middle" dominantBaseline="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {q},{r}
              </text>
            </g>
          )
        }
      }
    } else {
      const { xMin, xMax, yMin, yMax } = range as { xMin: number; xMax: number; yMin: number; yMax: number }
      for (let y = yMin; y <= yMax; y++) {
        for (let x = xMin; x <= xMax; x++) {
          const coord: SquareCoord = { x, y }
          const p = cellToPixel(x, y, s)
          const cx = p.x + offsetX
          const cy = p.y + offsetY
          const verts = squareVertices(cx, cy, s * 0.92)
          const points = squarePolygonPointsString(verts)
          const k = keyOf(coord, 'square')
          const isSelected = selected.has(k)
          const inRadius = withinRadius(coord, 'square')
          const fill = isSelected ? SELECTED_COLOR : baseColor
          const opacity = inRadius ? 1 : 0.35

          polygons.push(
            <g key={k}>
              <polygon
                points={points}
                fill={fill}
                opacity={opacity}
                stroke="#ffffff"
                strokeWidth={Math.max(1, s * 0.06)}
                style={{ cursor: inRadius ? 'pointer' : 'not-allowed', transition: 'fill 120ms ease-out' }}
                onClick={inRadius ? () => toggleSelect(coord) : undefined}
              />
              <text
                x={cx} y={cy} fill="#ffffff" fontSize={Math.max(10, s * 0.35)} fontWeight={600}
                textAnchor="middle" dominantBaseline="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {x},{y}
              </text>
            </g>
          )
        }
      }
    }

    return polygons
  }, [computeVisibleRange, cellSize, selected, withinRadius, mapType, keyOf, toggleSelect])

  // Tag input helpers
  const [tagInput, setTagInput] = useState('')
  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    setTags(prev => Array.from(new Set([...prev, t])))
    setTagInput('')
  }, [tagInput])

  const removeTag = useCallback((t: string) => setTags(prev => prev.filter(x => x !== t)), [])

  // Radius steppers for square
  const decRadius = useCallback(() => setRadius(r => clampRadius(r - 1)), [])
  const incRadius = useCallback(() => setRadius(r => clampRadius(r + 1)), [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_360px]">
      {/* Grid area */}
      <div 
        ref={containerRef} 
        className="relative bg-[#2a562a]" 
        style={{ 
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat' 
        }}
      >
        <svg className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>
          {gridContent}
        </svg>
      </div>

      {/* Controls */}
      <aside className="border-l border-gray-200 bg-white p-4 flex flex-col gap-4">
        <h1 className="text-lg font-bold">Map Creator</h1>

        {/* Map Type Selector */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Map Type</label>
          <select 
            value={mapType} 
            onChange={e => setMapType(e.target.value as GridMapType)}
            className="w-full border rounded px-3 py-2 bg-white text-black"
          >
            <option value="hex">HEXA</option>
            <option value="square">SQUARE</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Map Name</label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder={mapType === 'hex' ? "e.g. 7cloud" : "e.g. plaza"}
            className="w-full border rounded px-3 py-2 bg-white text-black"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Tags</label>
          <div className="flex gap-2">
            <input 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)} 
              placeholder="#hashtag"
              className="flex-1 border rounded px-3 py-2 bg-white text-black"
            />
            <button onClick={addTag} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="px-2 py-1 text-xs bg-blue-500 text-black rounded-full">
                #{t}
                <button onClick={() => removeTag(t)} className="ml-2 text-black">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">Radius: <strong>{radius}</strong></div>
          {mapType === 'square' && (
            <div className="flex items-center gap-2">
              <button onClick={decRadius} className="px-2 py-1 bg-gray-200 rounded">−</button>
              <button onClick={incRadius} className="px-2 py-1 bg-gray-200 rounded">+</button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-700">Selected: <strong>{selected.size}</strong></div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Background Image URL</label>
          <input 
            value={backgroundImageUrl} 
            onChange={e => setBackgroundImageUrl(e.target.value)} 
            placeholder="https://example.com/image.png"
            className="w-full border rounded px-3 py-2 bg-white text-black"
          />
          <div className="text-xs text-gray-500">Stored with the map and returned by the public API.</div>
        </div>

        <div className="flex gap-2">
          <button onClick={saveMap} disabled={saving} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">
            {mapId ? 'Update' : 'Save'}
          </button>
          <button onClick={clearSelection} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
        </div>

        {mapId && (
          <button onClick={deleteMap} disabled={deleting} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">
            Delete
          </button>
        )}
        <button onClick={startNew} className="px-3 py-2 bg-gray-100 rounded">New Map</button>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search maps by name or tag"
              className="flex-1 border rounded px-3 py-2 bg-white text-black"
            />
            <button onClick={loadList} className="px-3 py-2 bg-gray-200 rounded">Search</button>
          </div>
          <div className="max-h-80 overflow-auto border rounded">
            {loadingList ? (
              <div className="p-3 text-sm text-gray-500">Loading…</div>
            ) : list.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No maps found</div>
            ) : (
              <ul>
                {list.map(m => (
                  <li key={m._id} className="p-3 border-b flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-black">{m.name}</div>
                      <div className="text-xs text-black">
                        {(m.hexCount ?? m.cellCount ?? m.coords?.length ?? 0)} {mapType === 'hex' ? 'hex' : 'cells'} • radius {m.radius}
                      </div>
                      {m.tags && m.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.tags.map(tag => (
                            <span key={tag} className="px-1 py-0.5 text-xs bg-blue-100 text-black rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => loadMap(m._id!)} className="px-2 py-1 text-sm bg-blue-600 text-white rounded">
                      Load
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}