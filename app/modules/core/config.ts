// Purpose: Resolve effective game configuration via deterministic merge.
// What: Combines module defaults, PlayMass defaults, and per-game overrides.
// Why: Centralizes configuration so all games follow the same precedence rules.

import { connectDB } from '../../lib/mongodb'
import GameModel from '../../lib/models/Game'
import PlaymassDefaultsModel from '../../lib/models/PlaymassDefaults'
import { GameType } from '../../types'
import { getGameModule } from './registry'
import type { GameConfig } from './types'
import mongoose from 'mongoose'

// Deep merge that:
// - Recursively merges plain objects
// - Replaces arrays and primitives by override values
// - Does not mutate inputs (returns a new object)
export function deepMerge<T>(base: T, override: Partial<T>): T {
  if (base === null || base === undefined) return override as T
  if (override === null || override === undefined) return base

  if (Array.isArray(base) || Array.isArray(override)) {
    return (Array.isArray(override) ? override : (override as any)) as T
  }

  if (typeof base !== 'object' || typeof override !== 'object') {
    return (override as unknown) as T
  }

  const result: any = { ...(base as any) }
  for (const key of Object.keys(override as any)) {
    const b = (base as any)[key]
    const o = (override as any)[key]
    if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object' && !Array.isArray(b)) {
      result[key] = deepMerge(b, o)
    } else {
      result[key] = o
    }
  }
  return result
}

export async function resolveConfig(gameId: string): Promise<{ merged: GameConfig, layers: { moduleDefaults: any, playmassDefaults: any, gameOverrides: any } }> {
  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    throw new Error('Invalid gameId')
  }

  await connectDB()
  const game = await GameModel.findById(gameId).lean()
  if (!game) throw new Error('Game not found')

  const gameType = game.type as GameType

  // Layer 1: Module defaults (may be undefined until module registers)
  const gameModule = getGameModule(gameType)
  const moduleDefaults: GameConfig = gameModule?.defaultConfig || { id: gameType, configuration: {} }

  // Layer 2: PlayMass defaults (persisted globally per module)
  const pmDoc = await (PlaymassDefaultsModel as any).getByModule(gameType)
  const playmassDefaults: Partial<GameConfig> = (pmDoc?.defaults || {}) as any

  // Layer 3: Per-game overrides (existing Game.configuration lives here)
  const gameOverrides: Partial<GameConfig> = {
    // Preserve existing shape for backward compatibility
    configuration: game.configuration || {}
  }

  const merged1 = deepMerge(moduleDefaults, playmassDefaults)
  const merged = deepMerge(merged1, gameOverrides)

  return {
    merged,
    layers: {
      moduleDefaults,
      playmassDefaults,
      gameOverrides
    }
  }
}
