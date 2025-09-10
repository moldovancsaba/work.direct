// Purpose: Core TypeScript contracts for the modular game system.
// What: Defines minimal, forward-compatible interfaces used by the registry and
//        config resolver. The shapes are intentionally generic to avoid tight
//        coupling before full module rollout.
// Why: We adopt a small, extensible contract now so Stars Hexa can be refactored
//      incrementally without blocking on full module parity.

import { GameType } from '../../types'

// Generic per-page style configuration used by module UIs
export interface PageStyle {
  background?: string
  titleStyle?: string
  textStyle?: string
  // Freeform per-page custom content (kept generic to avoid premature constraints)
  customContent?: Record<string, any>
}

export interface PageConfig {
  hero?: PageStyle
  main?: PageStyle
}

// Minimal text set; modules can extend this as needed
export interface GameTexts {
  welcomeTitle?: string
  welcomeSubtitle?: string
  ctaStart?: string
  ctaGuest?: string
  rulesTitle?: string
  rulesBody?: string
  resultTitle?: string
  resultInviteCTA?: string
  resultPlayAgainCTA?: string
  resultPartnerCTA?: string
  // Arbitrary HUD or inline labels
  gameHUD?: Record<string, string>
}

// Generic rule container with module extension point
export interface GameRules {
  attempts?: number
  winCondition?: string
  scoring?: Record<string, number>
  timeLimitSec?: number
  module?: Record<string, any>
}

// Color configuration with optional page-level overrides
export interface GameColors {
  palette?: Record<string, string>
  pageOverrides?: {
    welcome?: Partial<PageStyle>
    rules?: Partial<PageStyle>
    game?: Partial<PageStyle>
    result?: Partial<PageStyle>
  }
}

// Unified configuration envelope consumed by the resolver
export interface GameConfig {
  id?: GameType
  name?: string
  version?: string
  texts?: GameTexts
  rules?: GameRules
  colors?: GameColors
  pages?: {
    welcome?: PageConfig
    rules?: PageConfig
    game?: PageConfig
    result?: PageConfig
  }
  resources?: {
    images?: string[]
    sounds?: string[]
    fonts?: string[]
  }
  // The final resolved game-specific configuration (maps to existing Game.configuration)
  // This is provided to preserve compatibility until modules fully own renderers.
  // Example: starsHexa, penaltyShootout blocks the app already uses.
  configuration?: Record<string, any>
}

// Registry module contract. We keep renderers optional until full migration.
export interface GameModule {
  id: GameType
  name: string
  defaultConfig: GameConfig
  renderers?: {
    WelcomePage?: (cfg: GameConfig) => any
    RulesPage?: (cfg: GameConfig) => any
    GamePage?: (cfg: GameConfig, session?: Record<string, any>) => any
    ResultPage?: (cfg: GameConfig, session?: Record<string, any>) => any
  }
}
