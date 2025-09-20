// Module registry for PlayMass game types
// What: Centralized default configs and metadata for each game module
// Why: Reduce coupling, ensure consistent defaults, and enable resolver to hydrate missing values

import { GameType } from '../types'
import { GameModule, GameConfig } from './core/types'

const findRedDefault: GameConfig = {
  id: 'FIND_RED' as GameType,
  name: 'Get Shorty',
  version: '1.0.0',
  configuration: {
    findRed: {
      packSize: 6,
      redsPerPack: 2,
      selectionsPerRound: 1,
      targetReds: 3,
      totalRounds: 5,
      theme: 'default',
      texts: { shortyLabel: 'Shorty' },
      colors: {
        background: '#0B1220',
        winForeground: '#FF1A1A',
        neutralForeground: '#A0AEC0',
        cardBack: '#1F2937',
        cardBorder: '#374151'
      }
    }
  }
}

const wheelDefault: GameConfig = {
  id: 'WHEEL_OF_FORTUNE' as GameType,
  name: 'Wheel of Fortune',
  version: '1.0.0',
  configuration: {
    wheelOfFortune: {
      segments: [],
      spins: 8,
      spinsPerGame: 1,
      durationMs: 4500,
      pointerAt: 'top',
      size: 280,
      theme: 'default',
      allowImmediateReplay: false
    }
  }
}

export const REGISTRY: Record<GameType, GameModule> = {
  STARS_HEXA: {
    id: 'STARS_HEXA',
    name: 'Hexa',
    defaultConfig: { id: 'STARS_HEXA', name: 'Stars Hexa', version: '1.0.0', configuration: {} }
  },
  PENALTY_SHOOTOUT: {
    id: 'PENALTY_SHOOTOUT',
    name: 'Penalty Shootout',
    defaultConfig: { id: 'PENALTY_SHOOTOUT', name: 'Penalty Shootout', version: '1.0.0', configuration: {} }
  },
  FIND_RED: {
    id: 'FIND_RED',
    name: 'Get Shorty',
    defaultConfig: findRedDefault
  },
  WHEEL_OF_FORTUNE: {
    id: 'WHEEL_OF_FORTUNE',
    name: 'Wheel of Fortune',
    defaultConfig: wheelDefault
  },
  QUIZZ: {
    id: 'QUIZZ',
    name: 'Quizz',
    defaultConfig: { id: 'QUIZZ' as any, name: 'Quizz', version: '1.0.0', configuration: { quizz: { mapType: 'hex', rounds: 5, targetCorrect: 3, questions: [], theme: 'default', mapTag: 'water' } } }
  },
  QUIZZZ: {
    id: 'QUIZZZ',
    name: 'Quizzz',
    defaultConfig: { id: 'QUIZZZ' as any, name: 'Quizzz', version: '1.0.0', configuration: { quizzz: { mapType: 'hex', numberOfCards: 6, rounds: 5, winLimit: 3, questions: [], backgroundCss: '', tileStyles: {}, cardCoverImages: [], cardCoverFill: true, cardColors: {}, overlayBg: '#00000044' } } }
  }
}
