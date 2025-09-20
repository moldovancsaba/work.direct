"use client"

// app/admin/mapcreator/page.tsx
// WHAT: Unified Map Creator admin page (initial skeleton) for Hex and Square maps.
// WHY: Fixes 404 at /admin/mapcreator and provides a minimal, functional UI to
//      search, list, and create maps. This leverages existing models and admin
//      authentication, following the Reuse Before Creation rule. The geometry
//      editors (interactive grids) can be layered on top of this foundation.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import HexGridEditor, { type HexCoord } from '@/components/admin/HexGridEditor'
import SquareGridEditor, { type SquareCoord } from '@/components/admin/SquareGridEditor'
import HexMapRuntime from '@/components/runtime/HexMapRuntime'
import SquareMapRuntime from '@/components/runtime/SquareMapRuntime'

// NOTE: Admin gating is handled by app/admin/layout.tsx via useAdminAuth.
// We keep this page as a client component to enable fetch-based admin UI.

type GridMapType = 'hex' | 'square'

type BaseMap = {
  id: string
  name: string
  tags?: string[]
  radius: number
  isActive: boolean
  backgroundImageUrl?: string
  updatedAt?: string
  createdAt?: string
}

// Detailed types for editing
type HexMapDoc = BaseMap & { coords: HexCoord[]; hexCount?: number; fieldExtents?: { top?: HexCoord; bottom?: HexCoord; left?: HexCoord; right?: HexCoord }; fieldMask?: HexCoord[] }
type SquareMapDoc = BaseMap & { coords: SquareCoord[]; cellCount?: number; fieldExtents?: { top?: SquareCoord; bottom?: SquareCoord; left?: SquareCoord; right?: SquareCoord }; fieldMask?: SquareCoord[] }

export default function MapCreatorPage() {
  const [tab, setTab] = useState<GridMapType>('hex')
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [items, setItems] = useState<BaseMap[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  // Create form state
  const [name, setName] = useState('')
  const [tags, setTags] = useState('')
  const [radius, setRadius] = useState(4)
  const [bgUrl, setBgUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Creation-time grid selections per tab
  const [createHexCoords, setCreateHexCoords] = useState<HexCoord[]>([])
  const [createSquareCoords, setCreateSquareCoords] = useState<SquareCoord[]>([])
  const [createHexFieldMask, setCreateHexFieldMask] = useState<HexCoord[]>([])
  const [createSquareFieldMask, setCreateSquareFieldMask] = useState<SquareCoord[]>([])

  // Editing state per tab
  const [editingHex, setEditingHex] = useState<HexMapDoc | null>(null)
  const [editingSquare, setEditingSquare] = useState<SquareMapDoc | null>(null)

  const basePath = useMemo(() => (tab === 'hex' ? '/api/admin/hexmaps' : '/api/admin/squaremaps'), [tab])

  // WHAT: Debounced search for maps by name or #tag
  // WHY: Aligns with Quizz predictive search expectations and admin UX
  useEffect(() => {
    let active = true
    const ctl = new AbortController()
    const id = setTimeout(async () => {
      try {
        setIsSearching(true)
        setError(null)
        const isTag = query.trim().startsWith('#')
        const q = query.trim().replace(/^#+/, '')
        const url = new URL(basePath, window.location.origin)
        url.searchParams.set(isTag ? 'tag' : 'search', q)
        url.searchParams.set('page', String(page))
        url.searchParams.set('limit', String(pageSize))
        const res = await fetch(url.toString(), { signal: ctl.signal, cache: 'no-store' })
        if (!res.ok) {
          const msg = `Search failed (${res.status})`
          if (active) setError(msg)
          return
        }
        const data = await res.json()
        if (!active) return
        const list: BaseMap[] = Array.isArray(data?.data?.items) ? data.data.items : []
        setItems(list)
        setTotal(Number(data?.data?.total || 0))
        setPage(Number(data?.data?.page || 1))
        setPageSize(Number(data?.data?.pageSize || 20))
      } catch (e) {
        if (!ctl.signal.aborted) {
          console.error('Map search error:', e)
          if (active) setError('Search errored, please try again')
        }
      } finally {
        if (active) setIsSearching(false)
      }
    }, 250)

    return () => {
      active = false
      ctl.abort()
      clearTimeout(id)
    }
  }, [tab, query, page, pageSize, basePath])

  const resetForm = () => {
    setName('')
    setTags('')
    setRadius(4)
    setBgUrl('')
    setError(null)
    setInfo(null)
    setCreateHexCoords([])
    setCreateSquareCoords([])
    setCreateHexFieldMask([])
    setCreateSquareFieldMask([])
  }

  const onCreate = async () => {
    try {
      setCreating(true)
      setError(null)
      setInfo(null)
        const payload: any = {
          name: name.trim(),
          radius: Number(radius) || 4,
          isActive: true,
          createdBy: 'admin', // server will set/validate, included for clarity
          backgroundImageUrl: bgUrl.trim() || undefined,
          // Coords = cards (interactive); fieldMask = visible grid
          coords: tab === 'hex' ? createHexCoords : createSquareCoords,
          fieldMask: tab === 'hex' ? createHexFieldMask : createSquareFieldMask
        }
      const t = (tags || '').trim()
      if (t) {
        // Normalize tags: split by commas or spaces; lowercase; remove empties and leading #
        payload.tags = t
          .split(/[,\s]+/)
          .map((x: string) => x.replace(/^#+/, '').trim().toLowerCase())
          .filter(Boolean)
      }

      const res = await fetch(basePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Create failed (${res.status}): ${text || res.statusText}`)
      }

      setInfo('Map created successfully. It will appear in search shortly.')
      resetForm()
      // Re-run search and refresh list
      setQuery('')
    } catch (e: any) {
      console.error('Create map error:', e)
      setError(e?.message || 'Failed to create map')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🗺️</span> Map Creator
        </h1>
        <div className="text-xs text-gray-500">
          Admin • Unified Hex/Square
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className={`px-3 py-1.5 rounded ${tab === 'hex' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setTab('hex')}
        >
          Hex
        </button>
        <button
          className={`px-3 py-1.5 rounded ${tab === 'square' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setTab('square')}
        >
          Square
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search & Results */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Find {tab === 'hex' ? 'Hex' : 'Square'} Map by name or #tag
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. city-center or #water"
            className="w-full px-3 py-2 border rounded bg-white text-black"
          />

          <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            {isSearching && <span>Searching…</span>}
            {error && <span className="text-red-600">{error}</span>}
          </div>

          <div className="mt-3 border rounded divide-y bg-white max-h-[420px] overflow-auto">
            {items.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No maps found</div>
            )}
            {items.map((m) => (
              <div key={m.id} className="px-3 py-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">{m.name}</div>
                  <div className="text-[11px] text-gray-500">
                    radius={m.radius} • {m.isActive ? 'active' : 'inactive'}{m.updatedAt ? ` • updated ${m.updatedAt}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setError(null); setInfo(null)
                      const res = await fetch(`${basePath}/${m.id}`, { credentials: 'include', cache: 'no-store' })
                      if (!res.ok) throw new Error(`Failed to load map (${res.status})`)
                      const data = await res.json()
                      const doc = data?.data
                      if (!doc) throw new Error('Malformed response')
                      // Populate form from selected doc
                      setName(doc.name || '')
                      setRadius(Number(doc.radius || 4))
                      setBgUrl(doc.backgroundImageUrl || '')
                      setTags(Array.isArray(doc.tags) ? doc.tags.map((t: string) => `#${t}`).join(' ') : '')
                      if (tab === 'hex') {
                        setEditingSquare(null)
                        setEditingHex({ ...doc, coords: Array.isArray(doc.coords) ? doc.coords : [] })
                      } else {
                        setEditingHex(null)
                        setEditingSquare({ ...doc, coords: Array.isArray(doc.coords) ? doc.coords : [] })
                      }
                    } catch (e: any) {
                      setError(e?.message || 'Failed to load map')
                    }
                  }}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {total > 0 && `Showing ${items.length} of ${total} results`}
          </div>
        </div>

        {/* Right: Create or Edit panel with interactive grid */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded p-4">
            {tab === 'hex' && editingHex && (
              <>
                <h2 className="text-lg font-semibold mb-3">Edit Hex Map</h2>
                {info && <div className="mb-3 text-sm text-green-700">{info}</div>}
                {error && <div className="mb-3 text-sm text-red-700">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={editingHex.name}
                      onChange={(e)=> setEditingHex({ ...editingHex, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={Array.isArray(editingHex.tags) ? editingHex.tags.map(t=>`#${t}`).join(' ') : ''}
                      onChange={(e)=> setEditingHex({ ...editingHex, tags: e.target.value.split(/[,\s]+/).map(s=> s.replace(/^#+/, '').trim().toLowerCase()).filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (1–24)</label>
                    <input type="number" min={1} max={24} className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={editingHex.radius}
                      onChange={(e)=> setEditingHex({ ...editingHex, radius: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                    <input className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={editingHex.backgroundImageUrl || ''}
                      onChange={(e)=> setEditingHex({ ...editingHex, backgroundImageUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Unified Grid (click: grey → green → red → grey)</h3>
                  <HexGridEditor
                    radius={editingHex.radius}
                    coords={editingHex.coords || []}
                    fieldMask={editingHex.fieldMask || []}
                    backgroundImageUrl={editingHex.backgroundImageUrl || ''}
                    onChange={(nextCoords, nextMask)=> setEditingHex({ ...editingHex, coords: nextCoords, fieldMask: nextMask })}
                  />
                </div>

                {/* Runtime Preview */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Runtime Preview</h3>
                  <HexMapRuntime
                    radius={editingHex.radius}
                    fieldMask={editingHex.fieldMask || []}
                    coords={editingHex.coords || []}
                    fieldExtents={editingHex.fieldExtents || null}
                    backgroundImageUrl={editingHex.backgroundImageUrl || ''}
                    height={360}
                  />
                </div>

                {/* Field extents (optional) */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(['top','bottom','left','right'] as const).map((pos) => (
                    <div key={pos}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{pos} (q,r)</label>
                      <input
                        placeholder="q,r"
                        value={editingHex.fieldExtents?.[pos] ? `${editingHex.fieldExtents[pos]!.q},${editingHex.fieldExtents[pos]!.r}` : ''}
                        onChange={(e)=>{
                          const val = e.target.value.trim()
                          const ext = { ...(editingHex.fieldExtents || {}) } as any
                          if (!val) { delete ext[pos]; setEditingHex({ ...editingHex, fieldExtents: ext }) ; return }
                          const [qStr,rStr] = val.split(',')
                          const q = parseInt(qStr,10); const r = parseInt(rStr,10)
                          if (!Number.isNaN(q) && !Number.isNaN(r)) {
                            ext[pos] = { q, r }
                            setEditingHex({ ...editingHex, fieldExtents: ext })
                          }
                        }}
                        className="w-full px-3 py-2 border rounded bg-white text-black"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={async ()=>{
                      try {
                        setError(null); setInfo(null)
                        const payload = {
                          name: editingHex.name.trim(),
                          radius: editingHex.radius,
                          backgroundImageUrl: editingHex.backgroundImageUrl || undefined,
                          tags: Array.isArray(editingHex.tags) ? editingHex.tags : undefined,
                          coords: editingHex.coords || [],
                          fieldExtents: editingHex.fieldExtents || undefined,
                          fieldMask: editingHex.fieldMask || []
                        }
                        const res = await fetch(`${basePath}/${editingHex.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
                        })
                        if (!res.ok) throw new Error(`Save failed (${res.status})`)
                        const data = await res.json()
                        setEditingHex(data.data)
                        setInfo('Saved successfully')
                      } catch (e:any) {
                        setError(e?.message || 'Save failed')
                      }
                    }}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >Save</button>
                  <button
                    onClick={async ()=>{
                      try {
                        setError(null); setInfo(null)
                        const res = await fetch(`${basePath}/${editingHex.id}`, { method: 'DELETE', credentials: 'include' })
                        if (!res.ok) throw new Error(`Delete failed (${res.status})`)
                        setEditingHex(null)
                        setInfo('Map archived (isActive=false)')
                        setQuery('')
                      } catch (e:any) { setError(e?.message || 'Delete failed') }
                    }}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                  >Soft Delete</button>
                  <button
                    onClick={()=>{ setEditingHex(null); resetForm() }}
                    className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >Clear</button>
                </div>
              </>
            )}

            {tab === 'square' && editingSquare && (
              <>
                <h2 className="text-lg font-semibold mb-3">Edit Square Map</h2>
                {info && <div className="mb-3 text-sm text-green-700">{info}</div>}
                {error && <div className="mb-3 text-sm text-red-700">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={editingSquare.name}
                      onChange={(e)=> setEditingSquare({ ...editingSquare, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={Array.isArray(editingSquare.tags) ? editingSquare.tags.map(t=>`#${t}`).join(' ') : ''}
                      onChange={(e)=> setEditingSquare({ ...editingSquare, tags: e.target.value.split(/[,\s]+/).map(s=> s.replace(/^#+/, '').trim().toLowerCase()).filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (1–24)</label>
                    <input type="number" min={1} max={24} className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={editingSquare.radius}
                      onChange={(e)=> setEditingSquare({ ...editingSquare, radius: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                    <input className="w-full px-3 py-2 border rounded bg-white text-black"
                      value={editingSquare.backgroundImageUrl || ''}
                      onChange={(e)=> setEditingSquare({ ...editingSquare, backgroundImageUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Unified Grid (click: grey → green → red → grey)</h3>
                  <SquareGridEditor
                    radius={editingSquare.radius}
                    coords={editingSquare.coords || []}
                    fieldMask={editingSquare.fieldMask || []}
                    backgroundImageUrl={editingSquare.backgroundImageUrl || ''}
                    onChange={(nextCoords, nextMask)=> setEditingSquare({ ...editingSquare, coords: nextCoords, fieldMask: nextMask })}
                  />
                </div>

                {/* Runtime Preview */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Runtime Preview</h3>
                  <SquareMapRuntime
                    radius={editingSquare.radius}
                    fieldMask={editingSquare.fieldMask || []}
                    coords={editingSquare.coords || []}
                    fieldExtents={editingSquare.fieldExtents || null}
                    backgroundImageUrl={editingSquare.backgroundImageUrl || ''}
                    height={360}
                  />
                </div>

                {/* Field extents (optional) */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(['top','bottom','left','right'] as const).map((pos) => (
                    <div key={pos}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{pos} (x,y)</label>
                      <input
                        placeholder="x,y"
                        value={editingSquare.fieldExtents?.[pos] ? `${editingSquare.fieldExtents[pos]!.x},${editingSquare.fieldExtents[pos]!.y}` : ''}
                        onChange={(e)=>{
                          const val = e.target.value.trim()
                          const ext = { ...(editingSquare.fieldExtents || {}) } as any
                          if (!val) { delete ext[pos]; setEditingSquare({ ...editingSquare, fieldExtents: ext }) ; return }
                          const [xStr,yStr] = val.split(',')
                          const x = parseInt(xStr,10); const y = parseInt(yStr,10)
                          if (!Number.isNaN(x) && !Number.isNaN(y)) {
                            ext[pos] = { x, y }
                            setEditingSquare({ ...editingSquare, fieldExtents: ext })
                          }
                        }}
                        className="w-full px-3 py-2 border rounded bg-white text-black"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={async ()=>{
                      try {
                        setError(null); setInfo(null)
                        const payload = {
                          name: editingSquare.name.trim(),
                          radius: editingSquare.radius,
                          backgroundImageUrl: editingSquare.backgroundImageUrl || undefined,
                          tags: Array.isArray(editingSquare.tags) ? editingSquare.tags : undefined,
                          coords: editingSquare.coords || [],
                          fieldExtents: editingSquare.fieldExtents || undefined,
                          fieldMask: editingSquare.fieldMask || []
                        }
                        const res = await fetch(`${basePath}/${editingSquare.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
                        })
                        if (!res.ok) throw new Error(`Save failed (${res.status})`)
                        const data = await res.json()
                        setEditingSquare(data.data)
                        setInfo('Saved successfully')
                      } catch (e:any) { setError(e?.message || 'Save failed') }
                    }}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >Save</button>
                  <button
                    onClick={async ()=>{
                      try {
                        setError(null); setInfo(null)
                        const res = await fetch(`${basePath}/${editingSquare.id}`, { method: 'DELETE', credentials: 'include' })
                        if (!res.ok) throw new Error(`Delete failed (${res.status})`)
                        setEditingSquare(null)
                        setInfo('Map archived (isActive=false)')
                        setQuery('')
                      } catch (e:any) { setError(e?.message || 'Delete failed') }
                    }}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                  >Soft Delete</button>
                  <button
                    onClick={()=>{ setEditingSquare(null); resetForm() }}
                    className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >Clear</button>
                </div>
              </>
            )}

            {/* Create mode (no selection) */}
            {!editingHex && !editingSquare && (
              <>
                <h2 className="text-lg font-semibold mb-3">Create {tab === 'hex' ? 'Hex' : 'Square'} Map</h2>
                {info && <div className="mb-3 text-sm text-green-700">{info}</div>}
                {error && <div className="mb-3 text-sm text-red-700">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="unique-map-name"
                      className="w-full px-3 py-2 border rounded bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="#water #park or comma/space-separated"
                      className="w-full px-3 py-2 border rounded bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (1–24)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL (optional)</label>
                    <input
                      value={bgUrl}
                      onChange={(e) => setBgUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border rounded bg-white text-black"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Unified Grid (click: grey → green → red → grey)</h3>
                  {tab === 'hex' ? (
                    <HexGridEditor
                      radius={radius}
                      coords={createHexCoords}
                      fieldMask={createHexFieldMask}
                      backgroundImageUrl={bgUrl || ''}
                      onChange={(nextCoords, nextMask)=> { setCreateHexCoords(nextCoords); setCreateHexFieldMask(nextMask) }}
                    />
                  ) : (
                    <SquareGridEditor
                      radius={radius}
                      coords={createSquareCoords}
                      fieldMask={createSquareFieldMask}
                      backgroundImageUrl={bgUrl || ''}
                      onChange={(nextCoords, nextMask)=> { setCreateSquareCoords(nextCoords); setCreateSquareFieldMask(nextMask) }}
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={onCreate}
                    disabled={creating || !name.trim()}
                    className={`px-4 py-2 rounded text-white ${creating || !name.trim() ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {creating ? 'Creating…' : 'Create Map'}
                  </button>
                  <button onClick={resetForm} disabled={creating} className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200">Reset</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}