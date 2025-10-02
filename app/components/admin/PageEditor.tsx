'use client'

import { useState, useEffect, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { PageDef, BoxDef, TextContent, ButtonContent, PredefinedAction } from '../../types'

interface PageEditorProps {
  pages: PageDef[]
  onChange: (pages: PageDef[]) => void
}

// Helper: case-insensitive name compare and predefined checks
const toUpper = (s: string | undefined | null) => (s || '').toUpperCase()
const isPredefinedPageName = (name?: string | null) => {
  const n = toUpper(name)
  return n === 'LANDING' || n === 'GAME'
}

const makeLandingPage = (): PageDef => ({
  id: uuidv4(),
  name: 'Landing',
  isActive: true,
  layout: '',
  boxes: [
    { id: uuidv4(), name: 'HERO', block: 'HERO', columns: 1, items: [] },
    { id: uuidv4(), name: 'MAIN', block: 'MAIN', columns: 1, items: [] }
  ]
})

const makeGamePage = (): PageDef => ({
  id: uuidv4(),
  name: 'Game',
  isActive: true,
  layout: '',
  boxes: [
    { id: uuidv4(), name: 'HERO', block: 'HERO', columns: 1, items: [] },
    { id: uuidv4(), name: 'MAIN', block: 'MAIN', columns: 1, items: [] }
  ]
})

// PageEditor — simple page/box/content editor for game layout
// What: Allow admins to CRUD pages, boxes (with columns), and content items (text/button) within those boxes.
// Why: Provide a flexible but predictable page-structure editor to compose HERO/MAIN blocks with standardized content and actions.
export default function PageEditor({ pages, onChange }: PageEditorProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id || null)

  // Normalize pages: ensure Landing first and Game second; prevent missing predefined pages
  useEffect(() => {
    if (!Array.isArray(pages)) return
    let next = [...pages]
    let changed = false
    const hasLanding = next.some(p => toUpper(p.name) === 'LANDING')
    const hasGame = next.some(p => toUpper(p.name) === 'GAME')
    if (!hasLanding) { next.unshift(makeLandingPage()); changed = true }
    if (!hasGame) { next.splice(1, 0, makeGamePage()); changed = true }
    // Reorder: Landing, Game, then others (stable for others)
    const indexMap = new Map(next.map((p, i) => [p.id, i]))
    const weight = (p: PageDef) => {
      const n = toUpper(p.name)
      if (n === 'LANDING') return 0
      if (n === 'GAME') return 1
      return 2
    }
    const sorted = [...next].sort((a, b) => {
      const wa = weight(a), wb = weight(b)
      if (wa !== wb) return wa - wb
      return (indexMap.get(a.id) || 0) - (indexMap.get(b.id) || 0)
    })
    const namesOrig = pages.map(p => p.name)
    const namesNew = sorted.map(p => p.name)
    if (changed || JSON.stringify(namesOrig) !== JSON.stringify(namesNew)) {
      onChange(sorted)
      if (!selectedPageId && sorted[0]) setSelectedPageId(sorted[0].id)
    }
  }, [pages, onChange, selectedPageId])

  const updatePages = (next: PageDef[] | ((prev: PageDef[]) => PageDef[])) => {
    const result = typeof next === 'function' ? (next as any)(pages) : next
    onChange(result)
  }

  const addPage = () => {
    const id = uuidv4()
    const newPage: PageDef = {
      id,
      name: 'WELCOME',
      isActive: true,
      layout: '',
      boxes: [
        { id: uuidv4(), name: 'WELCOME HERO', block: 'HERO', columns: 1, items: [] },
        { id: uuidv4(), name: 'WELCOME MAIN', block: 'MAIN', columns: 1, items: [] }
      ]
    }
    updatePages([...(pages || []), newPage])
    setSelectedPageId(id)
  }

  const removePage = (pageId: string) => {
    const page = (pages || []).find(p => p.id === pageId)
    if (page && isPredefinedPageName(page.name)) {
      // Do not allow deletion of predefined pages
      return
    }
    const filtered = (pages || []).filter(p => p.id !== pageId)
    updatePages(filtered)
    if (selectedPageId === pageId) setSelectedPageId(filtered[0]?.id || null)
  }

  const updatePageField = (pageId: string, key: keyof PageDef, value: any) => {
    updatePages((pages || []).map(p => (p.id === pageId ? { ...p, [key]: value } : p)))
  }

  const addBox = (pageId: string, block: 'HERO' | 'MAIN') => {
    updatePages((pages || []).map(p => {
      if (p.id !== pageId) return p
      const newBox: BoxDef = { id: uuidv4(), name: `${block} BOX`, block, columns: 1, items: [] }
      return { ...p, boxes: [...p.boxes, newBox] }
    }))
  }

  const removeBox = (pageId: string, boxId: string) => {
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.filter(b => b.id !== boxId) } : p))
  }

  const updateBoxField = (pageId: string, boxId: string, key: keyof BoxDef, value: any) => {
    updatePages((pages || []).map(p => {
      if (p.id !== pageId) return p
      return { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, [key]: value } : b) }
    }))
  }

  const addTextItem = (pageId: string, boxId: string) => {
    const item: TextContent = { id: uuidv4(), kind: 'TEXT', name: 'Text', text: '', style: 'P' }
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, items: [...b.items, item] } : b) } : p))
  }

  const addButtonItem = (pageId: string, boxId: string) => {
    const item: ButtonContent = {
      id: uuidv4(),
      kind: 'BUTTON',
      name: 'Button',
      mode: 'URL',
      text: 'Click',
      url: '',
      backgroundCss: '',
      fontColor: '#FFFFFFFF',
      command: ''
    }
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, items: [...b.items, item] } : b) } : p))
  }

  const addInputItem = (pageId: string, boxId: string) => {
    const item = { id: uuidv4(), kind: 'INPUT' as const, name: 'Input', field: 'CUSTOM' as const, label: '', placeholder: '', required: false }
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, items: [...b.items, item] } : b) } : p))
  }

  const removeItem = (pageId: string, boxId: string, itemId: string) => {
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, items: b.items.filter(i => i.id !== itemId) } : b) } : p))
  }

  const updateTextItem = (pageId: string, boxId: string, itemId: string, key: keyof TextContent, value: any) => {
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, items: b.items.map(i => i.id === itemId ? { ...(i as any), [key]: value } : i) } : b) } : p))
  }

  const updateButtonItem = (pageId: string, boxId: string, itemId: string, key: keyof ButtonContent, value: any) => {
    updatePages((pages || []).map(p => p.id === pageId ? { ...p, boxes: p.boxes.map(b => b.id === boxId ? { ...b, items: b.items.map(i => i.id === itemId ? { ...(i as any), [key]: value } : i) } : b) } : p))
  }

  const selectedPage = (pages || []).find(p => p.id === selectedPageId) || null

  // Sorted pages for display: Landing, Game, then others
  const sortedPages = useMemo(() => {
    const indexMap = new Map((pages || []).map((p, i) => [p.id, i]))
    const weight = (p: PageDef) => {
      const n = toUpper(p.name)
      if (n === 'LANDING') return 0
      if (n === 'GAME') return 1
      return 2
    }
    return [...(pages || [])].sort((a, b) => {
      const wa = weight(a), wb = weight(b)
      if (wa !== wb) return wa - wb
      return (indexMap.get(a.id) || 0) - (indexMap.get(b.id) || 0)
    })
  }, [pages])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Pages</h2>
        <button type="button" onClick={addPage} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Add Page</button>
      </div>

      {/* Page list */}
      <div className="flex gap-2 flex-wrap mb-4">
        {sortedPages.map(p => (
          <button type="button" key={p.id} className={`px-3 py-1 rounded border ${selectedPageId === p.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`} onClick={() => setSelectedPageId(p.id)}>
            {p.name}
          </button>
        ))}
      </div>

      {selectedPage && (
        <div className="space-y-4">
          {/* Page header controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
              <input value={selectedPage.name} onChange={e => updatePageField(selectedPage.id, 'name', e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Layout</label>
              <input value={selectedPage.layout || ''} onChange={e => updatePageField(selectedPage.id, 'layout', e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex items-center gap-3">
              <label className="block text-sm font-medium text-gray-700">Active</label>
              <input type="checkbox" checked={selectedPage.isActive} onChange={e => updatePageField(selectedPage.id, 'isActive', e.target.checked)} />
              <button
                type="button"
                onClick={() => removePage(selectedPage.id)}
                disabled={isPredefinedPageName(selectedPage.name)}
                className={`ml-auto px-3 py-2 rounded ${isPredefinedPageName(selectedPage.name) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                title={isPredefinedPageName(selectedPage.name) ? 'Cannot delete predefined pages (Landing, Game)' : 'Delete'}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Boxes */}
          <div className="space-y-6">
            {selectedPage.boxes.map(box => {
              const isGamePage = toUpper(selectedPage.name) === 'GAME'
              const isReadOnlyMain = isGamePage && box.block === 'MAIN'
              return (
                <div key={box.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input value={box.name} onChange={e => updateBoxField(selectedPage.id, box.id, 'name', e.target.value)} className="px-3 py-2 border rounded w-60" disabled={isReadOnlyMain} />
                    <select value={box.block} onChange={e => updateBoxField(selectedPage.id, box.id, 'block', e.target.value as any)} className="px-3 py-2 border rounded" disabled={isGamePage}>
                      <option value="HERO">HERO</option>
                      <option value="MAIN">MAIN</option>
                    </select>
                    <label className="text-sm">Columns</label>
                    <select value={box.columns} onChange={e => updateBoxField(selectedPage.id, box.id, 'columns', Number(e.target.value))} className="px-3 py-2 border rounded" disabled={isReadOnlyMain}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                    {!isReadOnlyMain && (
                      <>
                        <button type="button" onClick={() => addTextItem(selectedPage.id, box.id)} className="ml-auto px-3 py-1 rounded bg-gray-800 text-white">Add Text</button>
                        <button type="button" onClick={() => addButtonItem(selectedPage.id, box.id)} className="px-3 py-1 rounded bg-blue-600 text-white">Add Button</button>
                        <button type="button" onClick={() => addInputItem(selectedPage.id, box.id)} className="px-3 py-1 rounded bg-indigo-600 text-white">Add Input</button>
                      </>
                    )}
                    <button type="button" onClick={() => removeBox(selectedPage.id, box.id)} className={`px-3 py-1 rounded ${isGamePage ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-red-600 text-white'}`} disabled={isGamePage}>Remove Box</button>
                  </div>

                  {/* Items */}
                  {isReadOnlyMain ? (
                    <div className="text-sm text-gray-700 p-3 border rounded bg-gray-50">
                      MAIN block is auto-built by the game and not editable here. Use the HERO block for page-level content.
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${box.columns === 1 ? 'grid-cols-1' : box.columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {box.items.map(item =>
                        item.kind === 'TEXT' ? (
                          <div key={item.id} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <strong>Text</strong>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => updateTextItem(selectedPage.id, box.id, item.id, 'text', ((item as TextContent).text || '') + ' [RESULT]') } className="text-xs px-2 py-1 border rounded">Insert [RESULT]</button>
                                <button type="button" onClick={() => removeItem(selectedPage.id, box.id, item.id)} className="text-red-600">Delete</button>
                              </div>
                            </div>
                            <label className="block text-sm mb-1">Content Name</label>
                            <input value={(item as TextContent).name} onChange={e => updateTextItem(selectedPage.id, box.id, item.id, 'name', e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
                            <label className="block text-sm mb-1">Content Text</label>
                            <textarea value={(item as TextContent).text} onChange={e => updateTextItem(selectedPage.id, box.id, item.id, 'text', e.target.value)} className="w-full px-3 py-2 border rounded mb-2" rows={3} />
                            <label className="block text-sm mb-1">Content Style</label>
<select value={(item as TextContent).style} onChange={e => updateTextItem(selectedPage.id, box.id, item.id, 'style', e.target.value as any)} className="w-full px-3 py-2 border rounded">
                              <option value="HERO">HERO</option>
                              <option value="H1">H1</option>
                              <option value="H2">H2</option>
                              <option value="P">P</option>
                            </select>
                          </div>
                        ) : item.kind === 'INPUT' ? (
                          <div key={item.id} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <strong>Input</strong>
                              <button type="button" onClick={() => removeItem(selectedPage.id, box.id, item.id)} className="text-red-600">Delete</button>
                            </div>
                            <label className="block text-sm mb-1">Field Type</label>
                            <select value={(item as any).field || 'CUSTOM'} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'field' as any, e.target.value)} className="w-full px-3 py-2 border rounded mb-2">
                              <option value="NAME">NAME</option>
                              <option value="EMAIL">EMAIL</option>
                              <option value="PHONE">PHONE</option>
                              <option value="CUSTOM">CUSTOM</option>
                            </select>
                            <label className="block text-sm mb-1">Name</label>
                            <input value={(item as any).name || ''} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'name' as any, e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
                            <label className="block text-sm mb-1">Label</label>
                            <input value={(item as any).label || ''} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'label' as any, e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
                            <label className="block text-sm mb-1">Placeholder</label>
                            <input value={(item as any).placeholder || ''} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'placeholder' as any, e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={!!(item as any).required} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'required' as any, e.target.checked)} />
                              Required
                            </label>
                          </div>
                        ) : (
                          <div key={item.id} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <strong>Button</strong>
                              <button type="button" onClick={() => removeItem(selectedPage.id, box.id, item.id)} className="text-red-600">Delete</button>
                            </div>
                            <label className="block text-sm mb-1">Button Name</label>
                            <input value={(item as ButtonContent).name} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'name', e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
                            <label className="block text-sm mb-1">Dropdown</label>
                            <select value={(item as ButtonContent).mode} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'mode', e.target.value as any)} className="w-full px-3 py-2 border rounded mb-2">
                              <option value="PREDEFINED">Predefined</option>
                              <option value="URL">URL</option>
                            </select>
                            {(item as ButtonContent).mode === 'PREDEFINED' ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-sm mb-1">Action Type</label>
                                  <select
                                    value={(item as ButtonContent).action || 'GOTO_PAGE'}
                                    onChange={(e) => {
                                      const val = e.target.value as PredefinedAction
                                      // Update action and computed command
                                      const cmdMap: Record<PredefinedAction, string> = {
                                        GOTO_PAGE: '',
                                        INVITE_FRIEND: 'INVITE_REFERRAL',
                                        PLAY_AS_GUEST: 'CONTINUE_AS_GUEST',
                                        START_GAME: 'START_GAME',
                                        REGISTER: 'REGISTER_AND_CONTINUE',
                                        RESTART_GAME: 'RESTART_GAME',
                                        FB_LOGIN: 'OPEN_LOGIN_MODAL'
                                      }
                                      updateButtonItem(selectedPage.id, box.id, item.id, 'action', val)
                                      updateButtonItem(selectedPage.id, box.id, item.id, 'command', cmdMap[val])
                                      if (val !== 'GOTO_PAGE') {
                                        updateButtonItem(selectedPage.id, box.id, item.id, 'targetPageName', '')
                                      }
                                    }}
                                    className="w-full px-3 py-2 border rounded"
                                  >
                                    <option value="GOTO_PAGE">Goto page</option>
                                    <option value="INVITE_FRIEND">Invite friend</option>
                                    <option value="PLAY_AS_GUEST">Play as guest</option>
                                    <option value="START_GAME">Start the game</option>
                                    <option value="REGISTER">Register to play</option>
                                    <option value="RESTART_GAME">Restart game</option>
                                    <option value="FB_LOGIN">FB Login</option>
                                  </select>
                                </div>
                                {((item as ButtonContent).action || 'GOTO_PAGE') === 'GOTO_PAGE' ? (
                                  <div>
                                    <label className="block text-sm mb-1">Action</label>
                                    <select
                                      value={(item as ButtonContent).targetPageName || ''}
                                      onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'targetPageName', e.target.value)}
                                      className="w-full px-3 py-2 border rounded"
                                    >
                                      {/* Always include predefined pages */}
                                      {['Landing','Game'].map(name => (
                                        <option key={`__pre_${name}`} value={name}>{name}</option>
                                      ))}
                                      {(pages || []).map(pg => (
                                        <option key={pg.id} value={pg.name}>{pg.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-sm mb-1">Action</label>
                                    <input
                                      value={(item as ButtonContent).command || ''}
                                      onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'command', e.target.value)}
                                      className="w-full px-3 py-2 border rounded"
                                      placeholder="Command (e.g., OPEN_LOGIN_MODAL)"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <label className="block text-sm mb-1">Button URL</label>
                                <input value={(item as ButtonContent).url || ''} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'url', e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm mb-1">Button Text</label>
                                <input value={(item as ButtonContent).text} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'text', e.target.value)} className="w-full px-3 py-2 border rounded" />
                              </div>
                              <div>
                                <label className="block text-sm mb-1">Font Color</label>
                                <input value={(item as ButtonContent).fontColor || ''} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'fontColor', e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="#FFFFFFFF" />
                              </div>
                            </div>
                            <label className="block text-sm mb-1 mt-2">Button Background (CSS)</label>
                            <textarea value={(item as ButtonContent).backgroundCss || ''} onChange={e => updateButtonItem(selectedPage.id, box.id, item.id, 'backgroundCss', e.target.value)} className="w-full px-3 py-2 border rounded" rows={3} />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {toUpper(selectedPage.name) !== 'GAME' && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => addBox(selectedPage.id, 'HERO')} className="px-3 py-2 rounded bg-gray-800 text-white">Add HERO Box</button>
              <button type="button" onClick={() => addBox(selectedPage.id, 'MAIN')} className="px-3 py-2 rounded bg-blue-600 text-white">Add MAIN Box</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
