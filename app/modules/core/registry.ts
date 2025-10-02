// Purpose: In-memory module registry for PlayMass game modules.
// What: Allows modules to register
//       default configuration and (optionally) UI renderers.
// Why: Establishes a plug-in architecture so games can be added/refactored
//      without touching the core play flow logic.

import { GameType } from '../../types'
import type { GameModule } from './types'

// Using a simple Map ensures deterministic lookups and prevents duplicates.
const registry = new Map<GameType, GameModule>()

export function registerGameModule(module: GameModule): void {
  if (registry.has(module.id)) {
    throw new Error(`Game module already registered: ${module.id}`)
  }
  registry.set(module.id, module)
}

export function getGameModule(id: GameType): GameModule | undefined {
  return registry.get(id)
}

export function listRegisteredModules(): GameType[] {
  return Array.from(registry.keys())
}
