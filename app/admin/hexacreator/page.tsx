"use client"

// app/admin/hexacreator/page.tsx
// WHAT: Admin Hexa Creator UI with infinite honeycomb grid (Penalty-style) for building named hex maps.
// WHY: Create and manage reusable axial coordinate maps (radius 4) for use in all hex-based games.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SQRT3, axialToPixel, rotatePoint, hexVertices, polygonPointsString, hexDistance } from '@/lib/hex/geometry'

// Lightweight types to avoid importing server types into client bundle
type HexCoord = { q: number; r: number }

interface HexMapDoc {
  _id?: string
  name: string
  coords: HexCoord[]
  radius: number
  hexCount?: number
  tags?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

const DEFAULT_RADIUS = 4
const BASE_COLOR = '#44AA44'
const SELECTED_COLOR = '#44AAAA'

export default function HexaCreatorPage() {
  // View refs and sizing
  const containerRef = useRef<HTMLDivElement>(null)
  const [hexSize, setHexSize] = useState(80)

  // Map form state
  const [mapId, setMapId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS)

  // Selection model keyed by "q,r"
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Search/list state
  const [search, setSearch] = useState('')
  const [list, setList] = useState<HexMapDoc[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Compute visible axial bounds similar to Penalty logic
  const computeVisibleRange = useCallback(() => {
    const el = containerRef.current
    if (!el) return { qMin: -8, qMax: 8, rMin: -8, rMax: 8 }
    const rect = el.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600

    const s = hexSize
    const xStep = 1.5 * s
    const yStep = SQRT3 * s
    const cols = Math.ceil(vw / xStep) + 8
    const rows = Math.ceil(vh / (yStep / 2)) + 8
    const qMin = -Math.ceil(cols / 2), qMax = Math.ceil(cols / 2)
    const rMin = -Math.ceil(rows / 4), rMax = Math.ceil(rows / 4)
    return { qMin, qMax, rMin, rMax }
  }, [hexSize])

  // Resize handling (fit algorithm based on Penalty computeFitBox approach, simplified for editor)
  useEffect(() => {
    const handleResize = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vw = rect.width || 800
      const vh = rect.height || 600
      const margin = 0.96
      const s0 = Math.max(24, Math.min(vw, vh) / 10)
      setHexSize(s0 * margin)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Helpers
  const keyOf = (q: number, r: number) => `${q},${r}`
  const parseKey = (k: string): HexCoord => ({ q: parseInt(k.split(',')[0], 10), r: parseInt(k.split(',')[1], 10) })

  const withinRadius = useCallback((q: number, r: number) => {
    return hexDistance({ q, r }, { q: 0, r: 0 }) <= radius
  }, [radius])

  const toggleSelect = useCallback((q: number, r: number) => {
    if (!withinRadius(q, r)) return
    const k = keyOf(q, r)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }, [withinRadius])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // Load list with search
  const loadList = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const url = new URL('/api/admin/hexmaps', window.location.origin)
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
  }, [search])

  useEffect(() => { loadList() }, [loadList])

  const startNew = useCallback(() => {
    setMapId(null)
    setName('')
    setTags([])
    setRadius(DEFAULT_RADIUS)
    setSelected(new Set())
    setError(null)
  }, [])

  const loadMap = useCallback(async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/hexmaps/${id}`, { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data?.success) {
        const doc: HexMapDoc = data.data
        setMapId(doc._id || null)
        setName(doc.name || '')
        setTags(doc.tags || [])
        setRadius(doc.radius || DEFAULT_RADIUS)
        setSelected(new Set((doc.coords || []).map(c => keyOf(c.q, c.r))))
      } else {
        setError(data?.error?.message || 'Failed to load map')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load map')
    }
  }, [])

  const saveMap = useCallback(async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    const coords: HexCoord[] = Array.from(selected).map(parseKey)
    const payload = { name: name.trim(), coords, radius, tags }
    try {
      if (mapId) {
        const res = await fetch(`/api/admin/hexmaps/${mapId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Failed to update')
      } else {
        const res = await fetch('/api/admin/hexmaps', {
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
  }, [mapId, name, selected, radius, tags, loadList])

  const deleteMap = useCallback(async () => {
    if (!mapId) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/hexmaps/${mapId}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Delete failed')
      startNew()
      await loadList()
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }, [mapId, loadList, startNew])

  // Render SVG grid
  const gridContent = useMemo(() => {
    const el = containerRef.current
    if (!el) return null

    const rect = el.getBoundingClientRect()
    const vw = rect.width || 800
    const vh = rect.height || 600

    const s = hexSize

    // Center the axial origin (0,0) at the exact middle of the viewport
    const offsetX = vw / 2
    const offsetY = vh / 2

    // Determine range
    const { qMin, qMax, rMin, rMax } = computeVisibleRange()

    const polygons: JSX.Element[] = []

    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        const center = axialToPixel(q, r, s)
        // Rotate, then translate so that (0,0) sits at screen center
        const verts = hexVertices(center.x, center.y, s).map(p => {
          const rp = rotatePoint(p.x, p.y)
          return { x: rp.x + offsetX, y: rp.y + offsetY }
        })
        const points = polygonPointsString(verts)
        const k = keyOf(q, r)
        const isSelected = selected.has(k)
        const inRadius = withinRadius(q, r)
        const fill = isSelected ? SELECTED_COLOR : BASE_COLOR
        const opacity = inRadius ? 1 : 0.35

        // Compute center for label (average of vertices)
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
              onClick={inRadius ? () => toggleSelect(q, r) : undefined}
            />
            <text
              x={cx}
              y={cy}
              fill="#ffffff"
              fontSize={Math.max(10, s * 0.35)}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {q},{r}
            </text>
          </g>
        )
      }
    }

    return polygons
  }, [computeVisibleRange, hexSize, selected, withinRadius])

  // Tag input helpers
  const [tagInput, setTagInput] = useState('')
  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    setTags(prev => Array.from(new Set([...prev, t])))
    setTagInput('')
  }, [tagInput])

  const removeTag = useCallback((t: string) => setTags(prev => prev.filter(x => x !== t)), [])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_360px]">
      {/* Grid area */}
      <div ref={containerRef} className="relative bg-[#2a562a]">
        <svg className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>
          {gridContent}
        </svg>
      </div>

      {/* Controls */}
      <aside className="border-l border-gray-200 bg-white p-4 flex flex-col gap-4">
        <h1 className="text-lg font-bold">Hexa Creator</h1>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Map Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 7cloud"
                 className="w-full border rounded px-3 py-2" />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Tags</label>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="#life-game"
                   className="flex-1 border rounded px-3 py-2" />
            <button onClick={addTag} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                #{t}
                <button onClick={() => removeTag(t)} className="ml-2 text-gray-500">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">Radius: <strong>{radius}</strong></div>
          <div className="text-sm text-gray-700">Selected: <strong>{selected.size}</strong></div>
        </div>

        <div className="flex gap-2">
          <button onClick={saveMap} disabled={saving} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">{mapId ? 'Update' : 'Save'}</button>
          <button onClick={clearSelection} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
        </div>

        {mapId && (
          <button onClick={deleteMap} disabled={deleting} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">Delete</button>
        )}
        <button onClick={startNew} className="px-3 py-2 bg-gray-100 rounded">New Map</button>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search maps by name or tag"
                   className="flex-1 border rounded px-3 py-2" />
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
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.hexCount ?? m.coords?.length ?? 0} hex • radius {m.radius}</div>
                    </div>
                    <button onClick={() => loadMap(m._id!)} className="px-2 py-1 text-sm bg-blue-600 text-white rounded">Load</button>
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
