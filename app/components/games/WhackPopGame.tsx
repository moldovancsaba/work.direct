"use client"

// WHAT: WhackPop (Whack-a-Mole style) game component using grid maps
// WHY: Provides fast-paced target-clicking gameplay with progressive difficulty and scoring

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { axialToPixel, rotatePoint, hexVertices, polygonPointsString } from '../../lib/hex/geometry'
import { cellToPixel, squareVertices } from '../../lib/square/geometry'
import type { WhackPopConfiguration, GridMapType, HexCoord, SquareCoord } from '../../types'
import { logger } from '../../lib/logger'

// WHAT: Props interface for WhackPopGame component
// WHY: Type-safe configuration and callback handling
interface Props {
  config: WhackPopConfiguration
  platformMainBackgroundCss?: string // Platform background fallback
  onResult?: (r: { score: number; hits: number; misses: number; won: boolean }) => void
  gameId?: string
  isTrialMode?: boolean
}

// WHAT: Target entity structure for active spawned targets
// WHY: Track target state and metadata for hit detection and animations
interface ActiveTarget {
  id: string // Unique target instance ID
  cellKey: string // Grid cell identifier (e.g., "1,2" for hex or "3,4" for square)
  spawnedAt: number // Timestamp when target spawned
  expiresAt: number // Timestamp when target should disappear
  emoji: string // Visual representation (emoji or future: image URL)
}

export default function WhackPopGame({ config, platformMainBackgroundCss, onResult, gameId, isTrialMode }: Props) {
  // WHAT: Visual container reference for responsive sizing calculations
  // WHY: Need to compute cell sizes dynamically based on viewport dimensions
  const stageRef = useRef<HTMLDivElement>(null)
  
  // WHAT: Loading state to prevent premature rendering
  // WHY: Avoid flash of incorrect layout while asynchronous map data loads
  const [loading, setLoading] = useState<boolean>(true)
  
  // WHAT: Grid coordinate system and background image
  // WHY: Loaded from DB maps following QUIZZZ pattern (reuse before creation)
  const [effectiveType, setEffectiveType] = useState<GridMapType>(config?.mapType || 'hex')
  const [coords, setCoords] = useState<Array<HexCoord | SquareCoord>>([])
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  
  // WHAT: Game state tracking variables
  // WHY: Core gameplay mechanics require real-time state management
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(config.gameDuration || 60)
  
  // WHAT: Active targets currently visible on grid
  // WHY: Track which cells have clickable targets for hit detection
  const [activeTargets, setActiveTargets] = useState<ActiveTarget[]>([])
  
  // WHAT: Hit/miss animation state map
  // WHY: Visual feedback requires temporary animation markers per cell
  const [hitAnimations, setHitAnimations] = useState<Map<string, 'hit' | 'miss'>>(new Map())
  
  // WHAT: Timer references for cleanup on unmount
  // WHY: Prevent memory leaks and zombie timers
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // WHAT: Calculate current round based on elapsed time
  // WHY: Progressive difficulty requires round-based interval/duration adjustments
  const currentRound = useMemo(() => {
    const totalDuration = config.gameDuration || 60
    const rounds = Math.max(1, config.rounds || 3)
    const elapsed = totalDuration - timeRemaining
    const roundDuration = totalDuration / rounds
    return Math.min(rounds, Math.floor(elapsed / roundDuration) + 1)
  }, [timeRemaining, config.gameDuration, config.rounds])
  
  // WHAT: Linear interpolation helper for progressive difficulty
  // WHY: Smoothly transition spawn/display intervals from initial to minimum values
  const lerp = useCallback((start: number, end: number, progress: number): number => {
    return Math.round(start + (end - start) * Math.max(0, Math.min(1, progress)))
  }, [])
  
  // WHAT: Dynamic spawn interval based on current round (progressive difficulty)
  // WHY: Game gets faster as player progresses through rounds
  const currentSpawnInterval = useMemo(() => {
    const initial = config.initialSpawnInterval || 1200
    const min = config.minSpawnInterval || 400
    const rounds = Math.max(1, config.rounds || 3)
    const progress = rounds > 1 ? (currentRound - 1) / (rounds - 1) : 0
    return lerp(initial, min, progress)
  }, [currentRound, config, lerp])
  
  // WHAT: Dynamic display duration based on current round (progressive difficulty)
  // WHY: Targets stay visible shorter time as difficulty increases
  const currentDisplayDuration = useMemo(() => {
    const initial = config.initialDisplayDuration || 1000
    const min = config.minDisplayDuration || 400
    const rounds = Math.max(1, config.rounds || 3)
    const progress = rounds > 1 ? (currentRound - 1) / (rounds - 1) : 0
    return lerp(initial, min, progress)
  }, [currentRound, config, lerp])
  
  // WHAT: Load grid coordinates from maps (identical to QUIZZZ pattern)
  // WHY: Reuse existing map system for consistency and avoid code duplication
  useEffect(() => {
    let aborted = false
    setLoading(true)
    
    const load = async () => {
      // Try selectedMaps first (preferred)
      if (Array.isArray(config?.selectedMaps) && config.selectedMaps.length > 0) {
        const first = config.selectedMaps[0]
        const base = first.type === 'hex' ? '/api/hexmaps' : '/api/squaremaps'
        try {
          const res = await fetch(`${base}/${encodeURIComponent(first.name)}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
            const bg = data?.data?.backgroundImageUrl || null
            if (!aborted && c.length > 0) {
              setCoords(c as any)
              setBackgroundUrl(bg || null)
              setEffectiveType(first.type)
              setLoading(false)
              logger.info('WhackPop map loaded', { mapName: first.name, coordsCount: c.length, mapType: first.type })
              return
            }
          }
        } catch (e) {
          logger.warn('WhackPop map load failed', { error: e, mapName: first.name })
        }
      }
      
      // Fallback to mapName (legacy)
      if (config?.mapName && config.mapName.trim()) {
        const base = (config.mapType === 'square') ? '/api/squaremaps' : '/api/hexmaps'
        try {
          const res = await fetch(`${base}/${encodeURIComponent(config.mapName.trim())}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const c = Array.isArray(data?.data?.coords) ? data.data.coords : []
            const bg = data?.data?.backgroundImageUrl || null
            if (!aborted && c.length > 0) {
              setCoords(c as any)
              setBackgroundUrl(bg || null)
              setEffectiveType(config.mapType || 'hex')
              setLoading(false)
              logger.info('WhackPop map loaded (legacy)', { mapName: config.mapName, coordsCount: c.length })
              return
            }
          }
        } catch (e) {
          logger.warn('WhackPop map load failed (legacy)', { error: e, mapName: config.mapName })
        }
      }
      
      // No fallback: empty coords (strict config requirement)
      if (!aborted) {
        setCoords([])
        setBackgroundUrl(null)
        setEffectiveType(config.mapType || 'hex')
        setLoading(false)
        logger.warn('WhackPop no map configured', { config })
      }
    }
    
    load()
    return () => { aborted = true }
  }, [config?.selectedMaps, config?.mapType, config?.mapName, config])
  
  // WHAT: Main game timer countdown (1-second interval)
  // WHY: Enforces time limit and triggers game end at zero
  useEffect(() => {
    if (!gameStarted || timeRemaining <= 0) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
      return
    }
    
    countdownTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1
        if (next <= 0) {
          endGame(false) // Time's up
          return 0
        }
        return next
      })
    }, 1000)
    
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }
  }, [gameStarted, timeRemaining])
  
  // WHAT: Target spawn loop with dynamic intervals
  // WHY: Continuously spawns new targets at progressive difficulty rates
  useEffect(() => {
    if (!gameStarted || coords.length === 0 || timeRemaining <= 0) {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current)
        spawnTimerRef.current = null
      }
      return
    }
    
    const spawnTarget = () => {
      // WHAT: Check if we can spawn more targets
      // WHY: Limit simultaneous targets as per configuration
      const maxSimultaneous = config.simultaneousTargets || 3
      if (activeTargets.length >= maxSimultaneous) {
        // Retry after short delay if at limit
        spawnTimerRef.current = setTimeout(spawnTarget, 200)
        return
      }
      
      // WHAT: Pick random unoccupied cell
      // WHY: Avoid spawning on already-active targets
      const occupiedKeys = new Set(activeTargets.map(t => t.cellKey))
      const availableCells = coords.filter((c: any) => {
        const key = effectiveType === 'hex' ? `${c.q},${c.r}` : `${c.x},${c.y}`
        return !occupiedKeys.has(key)
      })
      
      if (availableCells.length === 0) {
        // No cells available; retry shortly
        spawnTimerRef.current = setTimeout(spawnTarget, 200)
        return
      }
      
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)]
      const cellKey = effectiveType === 'hex' 
        ? `${(randomCell as HexCoord).q},${(randomCell as HexCoord).r}` 
        : `${(randomCell as SquareCoord).x},${(randomCell as SquareCoord).y}`
      
      const now = Date.now()
      const newTarget: ActiveTarget = {
        id: `${now}-${Math.random()}`,
        cellKey,
        spawnedAt: now,
        expiresAt: now + currentDisplayDuration,
        emoji: getRandomEmoji()
      }
      
      // WHAT: Add target to active set
      // WHY: Marks cell as occupied for rendering and hit detection
      setActiveTargets(prev => [...prev, newTarget])
      
      // WHAT: Schedule auto-hide after display duration
      // WHY: Target disappears if not clicked in time (counts as miss)
      setTimeout(() => {
        setActiveTargets(prev => {
          const stillActive = prev.find(t => t.id === newTarget.id)
          if (stillActive) {
            // Target expired without being clicked
            setMisses(m => m + 1)
            setCombo(0) // Break combo on timeout
            setScore(s => Math.max(0, s - (config.missPenalty || 0)))
            
            // Show miss animation
            setHitAnimations(prev => {
              const next = new Map(prev)
              next.set(cellKey, 'miss')
              setTimeout(() => {
                setHitAnimations(p => {
                  const n = new Map(p)
                  n.delete(cellKey)
                  return n
                })
              }, 300)
              return next
            })
            
            logger.debug('WhackPop target expired', { cellKey, targetId: newTarget.id })
            return prev.filter(t => t.id !== newTarget.id)
          }
          return prev
        })
      }, currentDisplayDuration)
      
      // WHAT: Schedule next spawn with dynamic interval
      // WHY: Uses setTimeout chaining instead of setInterval for progressive adjustments
      spawnTimerRef.current = setTimeout(spawnTarget, currentSpawnInterval)
    }
    
    // Initial spawn
    spawnTarget()
    
    return () => {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current)
        spawnTimerRef.current = null
      }
    }
  }, [gameStarted, coords, effectiveType, currentSpawnInterval, currentDisplayDuration, activeTargets, config, timeRemaining])
  
  // WHAT: Get random emoji from configuration
  // WHY: Visual variety for targets (future: support images)
  const getRandomEmoji = useCallback((): string => {
    const emojis = config.targetEmoji && config.targetEmoji.length > 0 
      ? config.targetEmoji 
      : ['🎯', '🟢', '💥']
    return emojis[Math.floor(Math.random() * emojis.length)]
  }, [config.targetEmoji])
  
  // WHAT: Handle cell click/tap (uses pointerdown for immediate response)
  // WHY: Core game interaction - hit detection and scoring
  const handleCellClick = useCallback((cellKey: string) => {
    if (!gameStarted || timeRemaining <= 0) return
    
    // WHAT: Find target at clicked cell
    // WHY: Only score hits on active targets
    const targetIndex = activeTargets.findIndex(t => t.cellKey === cellKey)
    
    if (targetIndex !== -1) {
      // HIT!
      const target = activeTargets[targetIndex]
      const basePoints = config.hitPoints || 100
      const comboBonus = combo * (config.comboMultiplier - 1)
      const points = Math.round(basePoints * (1 + comboBonus))
      
      setScore(s => s + points)
      setHits(h => h + 1)
      setCombo(c => c + 1)
      
      logger.debug('WhackPop hit', { cellKey, points, combo: combo + 1, targetId: target.id })
      
      // WHAT: Remove target immediately
      // WHY: Visual feedback - target disappears on hit
      setActiveTargets(prev => prev.filter((_, i) => i !== targetIndex))
      
      // WHAT: Show hit animation
      // WHY: Player feedback for successful hit
      setHitAnimations(prev => {
        const next = new Map(prev)
        next.set(cellKey, 'hit')
        setTimeout(() => {
          setHitAnimations(p => {
            const n = new Map(p)
            n.delete(cellKey)
            return n
          })
        }, 300)
        return next
      })
      
      // WHAT: Check win condition
      // WHY: End game early if target score reached
      const newScore = score + points
      if (newScore >= (config.targetScore || 1000)) {
        endGame(true)
      }
    } else {
      // MISS - clicked inactive cell
      const penalty = config.missPenalty || 0
      if (penalty > 0) {
        setScore(s => Math.max(0, s - penalty))
      }
      setCombo(0) // Break combo
      setMisses(m => m + 1)
      
      logger.debug('WhackPop miss', { cellKey, penalty })
      
      // Show miss animation
      setHitAnimations(prev => {
        const next = new Map(prev)
        next.set(cellKey, 'miss')
        setTimeout(() => {
          setHitAnimations(p => {
            const n = new Map(p)
            n.delete(cellKey)
            return n
          })
        }, 300)
        return next
      })
    }
  }, [gameStarted, activeTargets, score, combo, config, timeRemaining])
  
  // WHAT: End game and trigger result callback
  // WHY: Navigate to result page with final stats
  const endGame = useCallback((wonByScore: boolean = false) => {
    setGameStarted(false)
    
    // Clear all timers
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current)
      spawnTimerRef.current = null
    }
    
    // WHAT: Calculate final win status
    // WHY: Win if score threshold reached OR time ran out with positive score
    const finalWon = wonByScore || score >= (config.targetScore || 1000)
    
    logger.info('WhackPop game ended', { score, hits, misses, won: finalWon, wonByScore, timeRemaining })
    
    onResult?.({
      score,
      hits,
      misses,
      won: finalWon
    })
  }, [score, hits, misses, config.targetScore, onResult, timeRemaining])
  
  // WHAT: Responsive cell size calculation
  // WHY: Grid must fit viewport while maintaining aspect ratio
  const [cellSize, setCellSize] = useState(60)
  
  useEffect(() => {
    const computeFit = () => {
      const el = stageRef.current
      if (!el || coords.length === 0) return
      
      const r = el.getBoundingClientRect()
      const vw = r.width || 800
      const vh = r.height || 600
      const margin = 0.85
      
      // Base size depends on grid type
      const base = Math.max(32, Math.min(vw, vh) / (effectiveType === 'hex' ? 12 : 10))
      
      // Calculate bounding box of all cells
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      for (const c of coords as any[]) {
        if (effectiveType === 'hex') {
          const center = axialToPixel(c.q, c.r, base)
          const verts = hexVertices(center.x, center.y, base).map(p => rotatePoint(p.x, p.y))
          for (const v of verts) {
            if (v.x < minX) minX = v.x
            if (v.x > maxX) maxX = v.x
            if (v.y < minY) minY = v.y
            if (v.y > maxY) maxY = v.y
          }
        } else {
          const cp = cellToPixel(c.x, c.y, base)
          const verts = squareVertices(cp.x, cp.y, base)
          for (const v of verts) {
            if (v.x < minX) minX = v.x
            if (v.x > maxX) maxX = v.x
            if (v.y < minY) minY = v.y
            if (v.y > maxY) maxY = v.y
          }
        }
      }
      
      const boxW = maxX - minX
      const boxH = maxY - minY
      
      if (boxW > 0 && boxH > 0) {
        const scale = Math.min((vw * margin) / boxW, (vh * margin) / boxH)
        setCellSize(base * scale)
      }
    }
    
    computeFit()
    window.addEventListener('resize', computeFit)
    return () => window.removeEventListener('resize', computeFit)
  }, [coords, effectiveType])
  
  // WHAT: Render grid cells with SVG
  // WHY: Reuses QUIZZZ geometry patterns for consistency
  const renderGrid = useMemo(() => {
    if (coords.length === 0) return null
    
    // Calculate grid bounds for SVG viewBox
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    const cells = coords.map((c: any) => {
      let center, vertices, cellKey
      
      if (effectiveType === 'hex') {
        center = axialToPixel(c.q, c.r, cellSize)
        vertices = hexVertices(center.x, center.y, cellSize).map(p => rotatePoint(p.x, p.y))
        cellKey = `${c.q},${c.r}`
      } else {
        center = cellToPixel(c.x, c.y, cellSize)
        vertices = squareVertices(center.x, center.y, cellSize)
        cellKey = `${c.x},${c.y}`
      }
      
      // Update bounds
      for (const v of vertices) {
        if (v.x < minX) minX = v.x
        if (v.x > maxX) maxX = v.x
        if (v.y < minY) minY = v.y
        if (v.y > maxY) maxY = v.y
      }
      
      return { center, vertices, cellKey }
    })
    
    const width = maxX - minX + 40
    const height = maxY - minY + 40
    const offsetX = -minX + 20
    const offsetY = -minY + 20
    
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        {cells.map(({ center, vertices, cellKey }) => {
          const isActive = activeTargets.some(t => t.cellKey === cellKey)
          const activeTarget = activeTargets.find(t => t.cellKey === cellKey)
          const animation = hitAnimations.get(cellKey)
          
          const inactiveCellColor = config.colors?.inactiveCell || '#1F2937'
          const activeTargetColor = config.colors?.activeTarget || '#22C55E'
          const hitColor = config.colors?.hitFeedback || '#F59E0B'
          const missColor = config.colors?.missFeedback || '#EF4444'
          
          let fillColor = inactiveCellColor
          if (animation === 'hit') fillColor = hitColor
          else if (animation === 'miss') fillColor = missColor
          else if (isActive) fillColor = activeTargetColor
          
          return (
            <g key={cellKey}>
              <polygon
                points={polygonPointsString(vertices.map(v => ({ x: v.x + offsetX, y: v.y + offsetY })))}
                fill={fillColor}
                stroke="#374151"
                strokeWidth="2"
                style={{
                  cursor: gameStarted ? 'pointer' : 'default',
                  transition: 'fill 0.15s ease-out',
                  transform: animation ? 'scale(1.1)' : 'scale(1)',
                  transformOrigin: `${center.x + offsetX}px ${center.y + offsetY}px`
                }}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCellClick(cellKey)
                }}
              />
              {isActive && activeTarget && (
                <text
                  x={center.x + offsetX}
                  y={center.y + offsetY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={cellSize * 0.6}
                  style={{ 
                    userSelect: 'none', 
                    pointerEvents: 'none', 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textRendering: 'optimizeLegibility'
                  }}
                >
                  {activeTarget.emoji}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    )
  }, [coords, cellSize, effectiveType, activeTargets, hitAnimations, config.colors, gameStarted, handleCellClick])
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white bg-gray-900">
        <div className="text-center">
          <div className="text-lg mb-2">Loading game...</div>
          <div className="text-sm opacity-70">Preparing grid...</div>
        </div>
      </div>
    )
  }
  
  // No map configured
  if (coords.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white bg-gray-900">
        <div className="text-center">
          <div className="text-xl mb-2">⚠️ No Map Configured</div>
          <div className="text-sm opacity-70">Please configure a map in the admin editor</div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      ref={stageRef} 
      className="relative w-full h-full overflow-hidden"
      style={{ 
        background: config.colors?.background || platformMainBackgroundCss || '#0B0F19' 
      }}
    >
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 text-white pointer-events-none">
        <div className="bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
          <div className="text-3xl font-bold">{score}</div>
          <div className="text-xs opacity-80">Score</div>
        </div>
        
        <div className="bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
          <div className="text-3xl font-bold">{timeRemaining}s</div>
          <div className="text-xs opacity-80">Time</div>
        </div>
        
        <div className="bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm text-right">
          <div className="text-sm font-semibold">Round {currentRound}/{config.rounds || 3}</div>
          {combo > 1 && (
            <div className="text-xs text-yellow-400 font-bold animate-pulse">
              Combo x{combo}
            </div>
          )}
          <div className="text-xs opacity-70 mt-1">
            Hits: {hits} | Misses: {misses}
          </div>
        </div>
      </div>
      
      {/* Game Grid */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {renderGrid}
      </div>
      
      {/* Start Button Overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-white text-4xl mb-6 font-bold">
              🎯 WhackPop
            </div>
            <div className="text-white text-lg mb-8 opacity-90">
              Click targets before they disappear!
            </div>
            <button
              onClick={() => {
                setGameStarted(true)
                logger.info('WhackPop game started', { gameId, config })
              }}
              className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-2xl"
            >
              START GAME
            </button>
            <div className="text-white text-sm mt-6 opacity-70">
              Target Score: {config.targetScore || 1000} | Time: {config.gameDuration || 60}s
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
