// Module registry for PlayMass game types
// What: Centralized default configs and metadata for each game module
// Why: Reduce coupling, ensure consistent defaults, and enable resolver to hydrate missing values

import { GameType } from '../types'
import { GameModule, GameConfig } from './core/types'



export const REGISTRY: Partial<Record<GameType, GameModule>> = {
  QUIZZZ: {
    id: 'QUIZZZ',
    name: 'Quizzz',
    defaultConfig: { id: 'QUIZZZ' as any, name: 'Quizzz', version: '1.0.0', configuration: { quizzz: { mapType: 'hex', numberOfCards: 6, rounds: 5, winLimit: 3, questions: [], backgroundCss: '', tileStyles: {}, cardCoverImages: [], cardCoverFill: true, cardColors: {}, overlayBg: '#00000044' } } }
  }
}
