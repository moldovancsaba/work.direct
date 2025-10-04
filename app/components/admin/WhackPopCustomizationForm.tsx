'use client'

// WHAT: WhackPop game customization form component for admin editor
// WHY: Provides comprehensive UI for configuring WHACKPOP game settings following QUIZZZ editor standards

import { useState, useEffect, useRef } from 'react'
import type { WhackPopConfiguration, GridMapType } from '../../types'

interface Props {
  config: WhackPopConfiguration
  onChange: (config: WhackPopConfiguration) => void
}

export default function WhackPopCustomizationForm({ config, onChange }: Props) {
  // WHAT: Local helper for updating nested config properties
  // WHY: Simplifies onChange callbacks with immutable updates
  const updateConfig = (updates: Partial<WhackPopConfiguration>) => {
    onChange({ ...config, ...updates })
  }

  const updateColors = (colorUpdates: Partial<NonNullable<WhackPopConfiguration['colors']>>) => {
    updateConfig({
      colors: { ...(config.colors || {}), ...colorUpdates }
    })
  }

  // WHAT: Map search state for predictive map selection
  // WHY: Allows admins to find and select maps easily like in QUIZZZ
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [results, setResults] = useState<Array<{ type: GridMapType; name: string; tags?: string[] }>>([])
  const abortRef = useRef<AbortController | null>(null)

  // WHAT: Debounced search across admin map lists
  // WHY: Searches both hex and square maps with 200ms debounce to avoid excessive API calls
  useEffect(() => {
    if (!searchTerm) { setResults([]); return }
    if (abortRef.current) abortRef.current.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const doSearch = async () => {
      try {
        setIsSearching(true)
        const q = searchTerm.trim()
        const all: Array<{ type: GridMapType; name: string; tags?: string[] }> = []
        const types: GridMapType[] = ['hex', 'square']
        await Promise.all(types.map(async (t) => {
          const base = t === 'hex' ? '/api/admin/hexmaps' : '/api/admin/squaremaps'
          const url = `${base}?search=${encodeURIComponent(q)}&limit=20`
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
      } finally { setIsSearching(false) }
    }

    const id = setTimeout(doSearch, 200)
    return () => { clearTimeout(id); ac.abort() }
  }, [searchTerm])

  // WHAT: Select a map from search results
  // WHY: Updates config with selected map and clears search
  const selectMap = (map: { type: GridMapType; name: string }) => {
    updateConfig({
      mapType: map.type,
      mapName: map.name,
      selectedMaps: [{ type: map.type, name: map.name }]
    })
    setSearchTerm('')
    setResults([])
  }

  return (
    <div className="space-y-6">
      {/* Map Selection */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Grid Map</h3>
        <p className="text-sm text-gray-600">Select a hex or square map for target spawning. Use the Map Creator to create custom maps.</p>
        
        {/* Current Selection Display */}
        {config.mapName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Selected Map</p>
                <p className="text-sm text-blue-800">
                  {config.mapName} ({config.mapType === 'hex' ? 'Hexagonal' : 'Square'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ mapName: '', selectedMaps: [] })}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Map Search Input */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">Search Maps</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search maps..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {isSearching && (
            <div className="absolute right-3 top-9 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
            {results.map((map, idx) => (
              <button
                key={`${map.type}-${map.name}-${idx}`}
                type="button"
                onClick={() => selectMap(map)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{map.name}</p>
                    {map.tags && map.tags.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Tags: {map.tags.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {map.type === 'hex' ? 'HEX' : 'SQUARE'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchTerm && !isSearching && results.length === 0 && (
          <p className="text-sm text-gray-500 italic">No maps found. Try a different search term or create a new map in the Map Creator.</p>
        )}
      </div>

      {/* Core Gameplay Timing */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Core Gameplay</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Game Duration (seconds)</label>
            <input
              type="number"
              min="30"
              max="180"
              value={config.gameDuration || 60}
              onChange={(e) => updateConfig({ gameDuration: parseInt(e.target.value) || 60 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">30-180 seconds</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rounds</label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.rounds || 3}
              onChange={(e) => updateConfig({ rounds: parseInt(e.target.value) || 3 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Difficulty tiers (1-5)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Score</label>
            <input
              type="number"
              min="0"
              value={config.targetScore || 1000}
              onChange={(e) => updateConfig({ targetScore: parseInt(e.target.value) || 1000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Score needed to win</p>
          </div>
        </div>
      </div>

      {/* Spawn Mechanics */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Spawn Mechanics (Progressive Difficulty)</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Initial Spawn Interval (ms)</label>
            <input
              type="number"
              min="200"
              max="5000"
              value={config.initialSpawnInterval || 1200}
              onChange={(e) => updateConfig({ initialSpawnInterval: parseInt(e.target.value) || 1200 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Starting spawn rate</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Min Spawn Interval (ms)</label>
            <input
              type="number"
              min="100"
              max="3000"
              value={config.minSpawnInterval || 400}
              onChange={(e) => updateConfig({ minSpawnInterval: parseInt(e.target.value) || 400 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Max difficulty rate</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Simultaneous Targets</label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.simultaneousTargets || 3}
              onChange={(e) => updateConfig({ simultaneousTargets: parseInt(e.target.value) || 3 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Max at once (1-5)</p>
          </div>
        </div>
      </div>

      {/* Target Visibility */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Target Visibility Timing</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Initial Display Duration (ms)</label>
            <input
              type="number"
              min="200"
              max="5000"
              value={config.initialDisplayDuration || 1000}
              onChange={(e) => updateConfig({ initialDisplayDuration: parseInt(e.target.value) || 1000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Starting visibility time</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Min Display Duration (ms)</label>
            <input
              type="number"
              min="100"
              max="3000"
              value={config.minDisplayDuration || 400}
              onChange={(e) => updateConfig({ minDisplayDuration: parseInt(e.target.value) || 400 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Max difficulty duration</p>
          </div>
        </div>
      </div>

      {/* Scoring System */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Scoring System</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hit Points</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={config.hitPoints || 100}
              onChange={(e) => updateConfig({ hitPoints: parseInt(e.target.value) || 100 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Base points per hit</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Miss Penalty</label>
            <input
              type="number"
              min="0"
              max="500"
              value={config.missPenalty || 0}
              onChange={(e) => updateConfig({ missPenalty: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Points lost on miss</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Combo Multiplier</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={config.comboMultiplier || 1.25}
              onChange={(e) => updateConfig({ comboMultiplier: parseFloat(e.target.value) || 1.25 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Streak multiplier (1.0-5.0)</p>
          </div>
        </div>
      </div>

      {/* Visual Theme */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Visual Theme & Effects</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={config.theme || 'arcade'}
              onChange={(e) => updateConfig({ theme: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="classic">Classic</option>
              <option value="neon">Neon</option>
              <option value="arcade">Arcade</option>
              <option value="pixel">Pixel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hit Effect</label>
            <select
              value={config.hitEffect || 'burst'}
              onChange={(e) => updateConfig({ hitEffect: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="burst">Burst</option>
              <option value="sparkle">Sparkle</option>
              <option value="shockwave">Shockwave</option>
              <option value="confetti">Confetti</option>
            </select>
          </div>
        </div>
      </div>

      {/* Target Assets */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Target Assets</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">Target Emoji (comma-separated)</label>
          <input
            type="text"
            value={(config.targetEmoji || []).join(', ')}
            onChange={(e) => {
              const emojis = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              updateConfig({ targetEmoji: emojis.length > 0 ? emojis : ['🎯', '🟢', '💥'] })
            }}
            placeholder="🎯, 🟢, 💥"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Fallback visual representation</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Images (URLs, comma-separated)</label>
          <input
            type="text"
            value={(config.targetImages || []).join(', ')}
            onChange={(e) => {
              const urls = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              updateConfig({ targetImages: urls })
            }}
            placeholder="https://example.com/target1.png, https://example.com/target2.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Optional: CDN URLs for target images (future feature)</p>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-800">Color Customization</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.colors?.background || '#0B0F19'}
                onChange={(e) => updateColors({ background: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.colors?.background || '#0B0F19'}
                onChange={(e) => updateColors({ background: e.target.value })}
                placeholder="#0B0F19"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Inactive Cell Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.colors?.inactiveCell || '#1F2937'}
                onChange={(e) => updateColors({ inactiveCell: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.colors?.inactiveCell || '#1F2937'}
                onChange={(e) => updateColors({ inactiveCell: e.target.value })}
                placeholder="#1F2937"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Active Target Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.colors?.activeTarget || '#22C55E'}
                onChange={(e) => updateColors({ activeTarget: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.colors?.activeTarget || '#22C55E'}
                onChange={(e) => updateColors({ activeTarget: e.target.value })}
                placeholder="#22C55E"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hit Feedback Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.colors?.hitFeedback || '#F59E0B'}
                onChange={(e) => updateColors({ hitFeedback: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.colors?.hitFeedback || '#F59E0B'}
                onChange={(e) => updateColors({ hitFeedback: e.target.value })}
                placeholder="#F59E0B"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Miss Feedback Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.colors?.missFeedback || '#EF4444'}
                onChange={(e) => updateColors({ missFeedback: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.colors?.missFeedback || '#EF4444'}
                onChange={(e) => updateColors({ missFeedback: e.target.value })}
                placeholder="#EF4444"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Configuration Summary</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Game Duration: {config.gameDuration || 60}s across {config.rounds || 3} rounds</li>
          <li>• Progressive difficulty: Spawn {config.initialSpawnInterval || 1200}ms → {config.minSpawnInterval || 400}ms</li>
          <li>• Target visibility: {config.initialDisplayDuration || 1000}ms → {config.minDisplayDuration || 400}ms</li>
          <li>• Scoring: {config.hitPoints || 100} pts/hit, {config.missPenalty || 0} penalty, {config.comboMultiplier || 1.25}x combo</li>
          <li>• Win condition: Reach {config.targetScore || 1000} points</li>
        </ul>
      </div>
    </div>
  )
}
