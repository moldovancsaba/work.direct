"use client"

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { QuizzConfiguration, QuizzQuestion, GridMapType } from '../../types'

interface QuizzCustomizationFormProps {
  config?: Partial<QuizzConfiguration>
  onChange: (next: QuizzConfiguration) => void
}

export default function QuizzCustomizationForm({ config, onChange }: QuizzCustomizationFormProps) {
  const [rounds, setRounds] = useState<number>(config?.rounds || 5)
  const [targetCorrect, setTargetCorrect] = useState<number>(config?.targetCorrect || 3)
  // Map fields are now managed via selectedMaps; keep legacy in state for back-compat but do not render inputs
  const [mapType] = useState<'hex' | 'square'>(config?.mapType || 'hex')
  const [mapName] = useState<string>(config?.mapName || '')
  const [mapTag] = useState<string>(config?.mapTag || 'water')
  const [selectedMaps, setSelectedMaps] = useState<Array<{ type: GridMapType; name: string }>>(config?.selectedMaps || [])
  const [randomizeMaps, setRandomizeMaps] = useState<boolean>(!!config?.randomizeSelectedMaps)
  const [questions, setQuestions] = useState<QuizzQuestion[]>(config?.questions || [])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [coverImages, setCoverImages] = useState<string[]>(config?.cardCoverImages || [])
  // Keep local list in sync if config changes (e.g., after load)
  useEffect(() => {
    if (Array.isArray(config?.cardCoverImages)) {
      setCoverImages(config.cardCoverImages)
    }
  }, [config?.cardCoverImages])

  // Predictive search state
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [results, setResults] = useState<Array<{ type: GridMapType; name: string; tags?: string[] }>>([])
  const abortRef = useRef<AbortController | null>(null)

  const addQuestion = () => {
    const id = `q-${questions.length + 1}`
    const q: QuizzQuestion = {
      id,
      text: '',
      answers: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }
    const next = [...questions, q]
    setQuestions(next)
    emit(next)
  }

  const updateQ = (idx: number, patch: Partial<QuizzQuestion>) => {
    const next = questions.map((q, i) => i === idx ? { ...q, ...patch } : q)
    setQuestions(next)
    emit(next)
  }

  const updateAnswer = (qIdx: number, aIdx: number, patch: Partial<{ text: string; isCorrect: boolean }>) => {
    const next = questions.map((q, i) => {
      if (i !== qIdx) return q
      const arr = q.answers.map((a, j) => j === aIdx ? { ...a, ...patch } : a)
      const answers: [typeof arr[number], typeof arr[number], typeof arr[number]] = [arr[0], arr[1], arr[2]]
      return { ...q, answers }
    }) as QuizzQuestion[]
    setQuestions(next)
    emit(next)
  }

  const removeQuestion = (idx: number) => {
    const next = questions.filter((_, i) => i !== idx)
    setQuestions(next)
    emit(next)
  }

  const emit = (qs = questions, override?: Partial<QuizzConfiguration>) => {
    onChange({
      mapType: override?.mapType ?? mapType,
      mapName: override?.mapName ?? mapName,
      selectedMaps: override?.selectedMaps ?? selectedMaps,
      randomizeSelectedMaps: override?.randomizeSelectedMaps ?? randomizeMaps,
      activeCoords: config?.activeCoords || [],
      mapTag: override?.mapTag ?? mapTag,
      rounds: override?.rounds ?? rounds,
      targetCorrect: override?.targetCorrect ?? targetCorrect,
      questions: qs,
      theme: config?.theme || 'default',
      texts: config?.texts || { submitAnswer: 'Submit', correctFeedback: 'Correct!', wrongFeedback: 'Try again' },
      cardCoverImages: override?.cardCoverImages ?? coverImages
    })
  }

  // Debounced search effect
  useEffect(() => {
    if (!searchTerm) { setResults([]); return }
    if (abortRef.current) abortRef.current.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const doSearch = async () => {
      try {
        setIsSearching(true)
        const isTag = searchTerm.trim().startsWith('#')
        const q = searchTerm.trim().replace(/^#+/, '')
        const all: Array<{ type: GridMapType; name: string; tags?: string[] }> = []
        const types: GridMapType[] = ['hex','square']
        await Promise.all(types.map(async (t) => {
          const base = t === 'hex' ? '/api/admin/hexmaps' : '/api/admin/squaremaps'
          const url = `${base}?${isTag ? `tag=${encodeURIComponent(q)}` : `search=${encodeURIComponent(q)}`}&limit=20`
          const res = await fetch(url, { signal: ac.signal })
          if (!res.ok) return
          const data = await res.json()
          const items = Array.isArray(data?.data?.items) ? data.data.items : []
          items.forEach((it: any) => {
            if (typeof it?.name === 'string' && it.name.trim()) {
              all.push({ type: t, name: it.name, tags: it.tags })
            }
          })
        }))
        setResults(all)
      } catch (_) {
        if (!ac.signal.aborted) setResults([])
      } finally {
        setIsSearching(false)
      }
    }
    const id = setTimeout(doSearch, 200)
    return () => { clearTimeout(id); ac.abort() }
  }, [searchTerm])

  return (
    <div className="space-y-6">
      {/* 1) Map selector (Find-a-Map) and Game Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Find Map by Name or #tag</label>
        <input
          className="w-full px-3 py-2 border rounded bg-white text-black"
          value={searchTerm}
          onChange={(e)=> setSearchTerm(e.target.value)}
          placeholder="Type map name or #tag (e.g., #water)"
        />
        {/* Suggestions */}
        <div className="mt-2 border rounded max-h-56 overflow-auto bg-white" hidden={!(results && results.length)}>
          {isSearching && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}
          {!isSearching && results.map((r, idx)=> (
            <button
              key={`${r.type}:${r.name}:${idx}`}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
              onClick={()=>{
                if (!selectedMaps.some(m => m.type === r.type && m.name === r.name)) {
                  const next = [...selectedMaps, { type: r.type, name: r.name }]
                  setSelectedMaps(next)
                  emit(questions, { selectedMaps: next })
                }
              }}
            >
              <span className="text-sm text-gray-800">{r.name}</span>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 text-gray-700">{r.type}</span>
            </button>
          ))}
        </div>
        {/* Randomize option */}
        <div className="mt-3 flex items-center gap-2">
          <input id="shuffleMaps" type="checkbox" checked={randomizeMaps} onChange={(e)=> { setRandomizeMaps(e.target.checked); emit(questions, { randomizeSelectedMaps: e.target.checked }) }} />
          <label htmlFor="shuffleMaps" className="text-sm text-gray-800">Shuffle selected maps at game start</label>
        </div>
        {/* Selected Maps as chips */}
        {selectedMaps.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedMaps.map((m, i) => (
              <span key={`${m.type}:${m.name}:${i}`} className="px-2 py-1 text-xs bg-blue-500 text-black rounded-full flex items-center gap-1">
                #{m.name}
                <span className="text-[10px] uppercase bg-blue-100 text-black px-1 py-0.5 rounded">{m.type}</span>
                {/* Reorder controls */}
                <button
                  type="button"
                  title="Move up"
                  className="ml-1 text-black hover:opacity-80 disabled:opacity-40"
                  disabled={i === 0}
                  onClick={()=>{
                    if (i === 0) return
                    const next = [...selectedMaps]
                    const tmp = next[i-1]
                    next[i-1] = next[i]
                    next[i] = tmp
                    setSelectedMaps(next)
                    emit(questions, { selectedMaps: next })
                  }}
                >↑</button>
                <button
                  type="button"
                  title="Move down"
                  className="text-black hover:opacity-80 disabled:opacity-40"
                  disabled={i === selectedMaps.length - 1}
                  onClick={()=>{
                    if (i === selectedMaps.length - 1) return
                    const next = [...selectedMaps]
                    const tmp = next[i+1]
                    next[i+1] = next[i]
                    next[i] = tmp
                    setSelectedMaps(next)
                    emit(questions, { selectedMaps: next })
                  }}
                >↓</button>
                {/* Remove */}
                <button
                  type="button"
                  title="Remove"
                  className="ml-1 text-black hover:opacity-80"
                  onClick={()=>{
                    const next = selectedMaps.filter((x, idx) => idx !== i)
                    setSelectedMaps(next)
                    emit(questions, { selectedMaps: next })
                  }}
                >×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Game Rules */}
      <div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rounds (Y)</label>
          <input type="number" min={1} className="w-full px-3 py-2 border rounded" value={rounds} onChange={(e)=>{ const n = Number(e.target.value)||1; setRounds(n); emit(questions, { rounds: n }) }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Correct (X)</label>
          <input type="number" min={1} className="w-full px-3 py-2 border rounded" value={targetCorrect} onChange={(e)=>{ const n = Number(e.target.value)||1; setTargetCorrect(n); emit(questions, { targetCorrect: n }) }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Background (CSS color)</label>
          <input className="w-full px-3 py-2 border rounded" defaultValue={config?.overlayBg || 'rgba(0,0,0,0.6)'} onChange={(e)=> emit(questions, { overlayBg: e.target.value })} placeholder="e.g. rgba(0,0,0,0.6) or #00000099" />
        </div>
      </div>

      {/* 2) Questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-gray-800">Questions</h3>
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={addQuestion}>Add Question</button>
        </div>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="border rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Question {idx + 1}</span>
                <button type="button" className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=> removeQuestion(idx)}>Remove</button>
              </div>
              <input className="w-full px-3 py-2 border rounded mb-2" value={q.text} onChange={(e)=> updateQ(idx, { text: e.target.value })} placeholder="Question text" />
              <div className="grid md:grid-cols-3 gap-2">
                {q.answers.map((a, aIdx) => (
                  <div key={aIdx} className="border rounded p-2">
                    <label className="text-xs text-gray-600">Answer {String.fromCharCode(65 + aIdx)}</label>
                    <input className="w-full px-2 py-1 border rounded" value={a.text} onChange={(e)=> updateAnswer(idx, aIdx, { text: e.target.value })} placeholder={`Answer ${aIdx+1}`} />
                    <label className="flex items-center gap-2 mt-1 text-sm">
                      <input type="checkbox" checked={a.isCorrect} onChange={(e)=> updateAnswer(idx, aIdx, { isCorrect: e.target.checked })} /> Correct
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3) Card Cover Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-gray-800">Card Cover Images</h3>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 px-3 py-2 border rounded bg-white text-black"
            placeholder="https://example.com/image.png"
            value={newImageUrl}
            onChange={(e)=> setNewImageUrl(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={!newImageUrl.trim()}
            onClick={()=>{
              const url = newImageUrl.trim()
              if (!url) return
              const next = Array.from(new Set([...(coverImages||[]), url]))
              setCoverImages(next)
              setNewImageUrl('')
              emit(questions, { cardCoverImages: next })
            }}
          >Add Image</button>
        </div>
        {coverImages && coverImages.length > 0 ? (
          <ul className="space-y-2">
            {coverImages.map((u, idx) => (
              <li key={`${u}:${idx}`} className="flex items-center justify-between border rounded p-2 bg-white">
                <div className="flex items-center gap-3">
                  <Image src={u} alt="cover" width={40} height={40} className="object-contain" unoptimized />
                  <span className="text-sm text-black break-all">{u}</span>
                </div>
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700"
                  onClick={()=>{
                    const next = coverImages.filter((x, i) => i !== idx)
                    setCoverImages(next)
                    emit(questions, { cardCoverImages: next })
                  }}
                >Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No images added yet.</p>
        )}
      </div>
    </div>
  )
}
