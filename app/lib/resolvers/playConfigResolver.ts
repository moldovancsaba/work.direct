// Resolver for standardized 4-page play flow configuration
// What: Normalize per-game config and PlayMass defaults into a single consumable shape.
// Why: Decouple UI from raw DB schema; ensure consistent texts/colors across modules.

import { Game } from '../../types'
import { deepMerge } from '../utils/deepMerge 2'
import { PlaymassDefaults } from '../config/playmassDefaults 2'

export interface ColorsPalette {
  primary?: string
  accent?: string
  background?: string
  text?: string
  buttonPrimary?: string
  buttonText?: string
}

export interface PlayFlowResolvedConfig {
  module: 'starsHexa' | 'penaltyShootout'
  welcome: { title: string; subtitle?: string; ctaLabel?: string; colors?: ColorsPalette }
  rules: { title?: string; items?: string[]; customTexts?: Record<string, string>; colors?: ColorsPalette }
  game: { component: 'StarsHexa' | 'PenaltyShootout'; config?: Record<string, unknown>; colors?: ColorsPalette; texts?: Record<string, string> }
  result: { title?: string; subtitle?: string; ctaLabel?: string; colors?: ColorsPalette }
  platform?: { texts: any; styles: any }
  meta: { gameId: string; ref?: string }
}

function derivePlatform(game: any) {
  const platTexts = game.configuration?.platform?.texts || {}
  const platStyles = game.configuration?.platform?.styles || {}
  const stars = game.configuration?.starsHexa || {}
  const penalty = game.configuration?.penaltyShootout || {}
  // Merge platform texts and provide back-compat fallbacks
  const mergedTexts = {
    TEXT_10: platTexts.TEXT_10 || stars.texts?.welcomeTitle || game.title || 'Welcome',
    TEXT_20: platTexts.TEXT_20 || (stars.texts?.rulesTitle || penalty.texts?.gameRulesTitle) || 'Game Rules',
    TEXT_30: platTexts.TEXT_30 || game.title || 'Game',
    TEXT_40: platTexts.TEXT_40 || 'Results',
    TEXT_11: platTexts.TEXT_11 || game.description || '',
    TEXT_12: platTexts.TEXT_12 || 'Your Name',
    TEXT_13: platTexts.TEXT_13 || 'Enter your name',
    TEXT_14: platTexts.TEXT_14 || 'Your Email',
    TEXT_15: platTexts.TEXT_15 || 'your@email.com',
    TEXT_16: platTexts.TEXT_16 || 'Your Phone',
    TEXT_17: platTexts.TEXT_17 || '+1 (555) 123-4567',
    TEXT_18: platTexts.TEXT_18 || penalty.texts?.startPlayingButton || 'Start',
    TEXT_19: platTexts.TEXT_19 || 'Try Without Registration',
    // Registration helper texts (per-game configurable)
    TEXT_26: platTexts.TEXT_26 || 'Please provide either email or phone number',
    TEXT_27: platTexts.TEXT_27 || 'Want to try without registration?',
    // Rules
    TEXT_21: platTexts.TEXT_21 || (stars.texts?.rulesTitle || penalty.texts?.gameRulesTitle) || 'Game Rules',
    TEXT_22: platTexts.TEXT_22 || (stars.texts?.rulesBody || penalty.texts?.gameRulesText) || '',
    TEXT_23: platTexts.TEXT_23 || (penalty.texts?.winConditionsTitle || 'Win Conditions'),
    TEXT_24: platTexts.TEXT_24 || (penalty.texts?.winConditionsText || ''),
    TEXT_25: platTexts.TEXT_25 || 'Play',
    // Result
    TEXT_41: platTexts.TEXT_41 || 'Thanks for participating!',
    TEXT_42: platTexts.TEXT_42 || 'Challenge your friends!',
    TEXT_43: platTexts.TEXT_43 || 'Share the game or play again!',
    TEXT_44: platTexts.TEXT_44 || 'Open CTA',
    TEXT_44_URL: platTexts.TEXT_44_URL || '',
    TEXT_45: platTexts.TEXT_45 || 'Invite Friend',
    TEXT_46: platTexts.TEXT_46 || 'Play Again',
    // New result fields
    WON_TEXT: platTexts.WON_TEXT || 'Congratulations! You won!',
    LOST_TEXT: platTexts.LOST_TEXT || 'Good try! Better luck next time.',
    CTA1_BG: platTexts.CTA1_BG || '',
    // New CTA fields
    CTA_TITLE: platTexts.CTA_TITLE || platTexts.TEXT_42 || 'Share Your Result',
    CTA_DESCRIPTION: platTexts.CTA_DESCRIPTION || platTexts.TEXT_43 || 'Copy or share your result with friends.',
    CTA_BUTTONS: Array.isArray(platTexts.CTA_BUTTONS) && platTexts.CTA_BUTTONS.length > 0
      ? platTexts.CTA_BUTTONS.map((b: any) => ({ text: b?.text || '', url: b?.url || '', bg: b?.bg || '' }))
      : (platTexts.TEXT_44 || platTexts.TEXT_44_URL
          ? [{ text: platTexts.TEXT_44 || 'Open CTA', url: platTexts.TEXT_44_URL || '', bg: platTexts.CTA1_BG || '' }]
          : []),

    // Per-button background CSS (multiline strings)
    TEXT_18_BG: platTexts.TEXT_18_BG || '',
    TEXT_19_BG: platTexts.TEXT_19_BG || '',
    TEXT_25_BG: platTexts.TEXT_25_BG || '',
    TEXT_45_BG: platTexts.TEXT_45_BG || '',
    TEXT_46_BG: platTexts.TEXT_46_BG || '',

    // Legal documents with defaults
    TERMS_TITLE: platTexts.TERMS_TITLE || 'General Terms & Conditions',
    TERMS_BODY: platTexts.TERMS_BODY || `Welcome to PlayMass. By participating in our games, you agree to the following terms:\n\n1) Eligibility — You must comply with all applicable laws and age requirements.\n2) Fair Play — Cheating, automated participation, or abuse is prohibited.\n3) Rewards — Prizes, coupons, and points are subject to availability and expiration.\n4) Data — We process necessary data to operate games; see Privacy Policy for details.\n5) Liability — PlayMass is not liable for indirect, incidental, or consequential damages.\n6) Changes — We may update these Terms; continued use constitutes acceptance.\n7) Contact — For support, contact the game organizer or PlayMass support.`,
    PRIVACY_TITLE: platTexts.PRIVACY_TITLE || 'Privacy Policy',
    PRIVACY_BODY: platTexts.PRIVACY_BODY || `This Privacy Policy describes how PlayMass collects and processes personal data:\n\n1) Data Collected — Name and contact details (email/phone) provided during registration.\n2) Purpose — To operate the game, manage rewards, and improve the experience.\n3) Legal Basis — Consent and/or legitimate interests.\n4) Retention — Kept only as long as necessary for the purposes stated.\n5) Sharing — Limited to service providers and legal requirements; no unauthorized sale of data.\n6) Security — Technical and organizational measures to protect data.\n7) Rights — Access, rectification, deletion, and objection where applicable.\n8) Contact — For privacy inquiries, contact the game organizer or PlayMass support.`,
    DELETION_TITLE: platTexts.DELETION_TITLE || 'User Data Deletion',
    DELETION_BODY: platTexts.DELETION_BODY || `To request deletion of your personal data used in this game:\n\n1) In-App: If available, use the account or profile menu to submit a deletion request.\n2) By Email: Contact the game organizer or PlayMass support with your name and (if known) your participant UUID.\n3) Processing: We will verify your request and delete associated data from our systems, subject to legal retention obligations.\n4) Scope: Deletion includes gameplay records and contact information stored for this game.\n5) Questions: For additional details, refer to our Privacy Policy.`
  }
  return { texts: mergedTexts, styles: platStyles }
}

function toStarsHexaConfig(game: Game): PlayFlowResolvedConfig {
  const g = game as any
  const raw = g.configuration?.starsHexa || {}
  const defaults = PlaymassDefaults.starsHexa

  const welcome = {
    title: raw.texts?.welcomeTitle || defaults.welcome.title,
    subtitle: raw.texts?.welcomeSubtitle || defaults.welcome.subtitle,
    ctaLabel: raw.texts?.ctaStart || defaults.welcome.ctaLabel,
    colors: {
      primary: raw.colors?.palette?.primary || defaults.colors.palette.primary,
      accent: raw.colors?.palette?.accent || defaults.colors.palette.accent,
      background: raw.colors?.palette?.bg || defaults.colors.palette.background,
      text: raw.colors?.palette?.text || defaults.colors.palette.text,
      buttonPrimary: defaults.colors.palette.buttonPrimary,
      buttonText: defaults.colors.palette.buttonText,
    }
  }

  const rulesItems: string[] | undefined = raw.texts?.rulesBody
    ? raw.texts.rulesBody.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : defaults.rules.items

  const rules = {
    title: raw.texts?.rulesTitle || defaults.rules.title,
    items: rulesItems,
    customTexts: {},
    colors: welcome.colors
  }

  const gameCfg = {
    component: 'StarsHexa' as const,
    config: {
      hexagons: raw.hexagons || [],
      maxFlipsPerAttempt: raw.maxFlipsPerAttempt || 3,
      totalStars: raw.totalStars || (raw.hexagons?.filter((h: any) => h.hasHiddenStar).length || 0),
      theme: raw.theme || 'default'
    },
    colors: welcome.colors,
    texts: raw.texts || {}
  }

  const result = {
    title: raw.texts?.resultTitle || defaults.result.title,
    subtitle: defaults.result.subtitle,
    ctaLabel: raw.texts?.resultPlayAgainCTA || defaults.result.ctaLabel,
    colors: welcome.colors
  }

  return {
    module: 'starsHexa',
    welcome,
    rules,
    game: gameCfg,
    result,
    platform: derivePlatform(g),
    meta: { gameId: g._id?.toString?.() || '' }
  }
}

function toPenaltyConfig(game: Game): PlayFlowResolvedConfig {
  const g = game as any
  const raw = g.configuration?.penaltyShootout || {}
  const defaults = PlaymassDefaults.penaltyShootout

  const welcome = {
    title: raw.texts?.gameTitle || defaults.welcome.title,
    subtitle: defaults.welcome.subtitle,
    ctaLabel: raw.texts?.startPlayingButton || defaults.welcome.ctaLabel,
    colors: {
      primary: raw.colors?.homeScoreCard || defaults.colors.palette.primary,
      accent: raw.colors?.visitorScoreCard || defaults.colors.palette.accent,
      background: raw.colors?.gameField || defaults.colors.palette.background,
      text: defaults.colors.palette.text,
      buttonPrimary: defaults.colors.palette.buttonPrimary,
      buttonText: defaults.colors.palette.buttonText,
    }
  }

  const rules = {
    title: raw.texts?.gameRulesTitle || defaults.rules.title,
    items: raw.texts?.gameRulesText ? raw.texts.gameRulesText.split('\n').map((s: string) => s.trim()).filter(Boolean) : defaults.rules.items,
    customTexts: {
      winConditionsTitle: raw.texts?.winConditionsTitle || 'Win Conditions:',
      winConditionsText: raw.texts?.winConditionsText || 'Score more than your opponent.'
    },
    colors: welcome.colors
  }

  const gameCfg = {
    component: 'PenaltyShootout' as const,
    config: {
      players: raw.players || [],
      playersToSelect: raw.playersToSelect || 5,
      totalGoals: raw.totalGoals || 7,
      theme: raw.theme || 'football'
    },
    colors: welcome.colors,
    texts: raw.texts || {}
  }

  const result = {
    title: raw.texts?.gameResultsTitle || defaults.result.title,
    subtitle: defaults.result.subtitle,
    ctaLabel: raw.texts?.playAgainButton || defaults.result.ctaLabel,
    colors: welcome.colors
  }

  return {
    module: 'penaltyShootout',
    welcome,
    rules,
    game: gameCfg,
    result,
    platform: derivePlatform(g),
    meta: { gameId: g._id?.toString?.() || '' }
  }
}

export async function resolvePlayConfig(game: Game, options?: { ref?: string }): Promise<PlayFlowResolvedConfig> {
  const type = game.type
  const base = type === 'STARS_HEXA' ? toStarsHexaConfig(game) : toPenaltyConfig(game)
  // Preserve referral metadata if provided
  if (options?.ref) {
    base.meta.ref = options.ref
  }
  return base
}

