import { ObjectId, Document } from 'mongodb'
import { ReactNode } from 'react'

// Base interface for all database documents
// This ensures consistent structure across all models
export interface BaseDocument {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

// Centralized Game System Types
// These interfaces support the centralized game environment architecture

// Participant data for centralized registration
export interface ParticipantData {
  name: string
  email?: string
  phone?: string
  uuid?: string // Unique identifier for referral tracking
  referrerUuid?: string // UUID of the person who referred this participant
}

// Game Layout Props for centralized layout system
export interface GameLayoutProps {
  // Game identification
  gameId: string
  gameType: string
  
  // Header content (1st position)
  title: string
  subtitle: string
  titleIcon?: string
  
  // Game content (2nd position) 
  gameContent: ReactNode
  
  // Status content (3rd position)
  statusContent?: ReactNode
  
  // Description content (4th position)  
  descriptionContent?: ReactNode
  
  // Layout customization
  theme?: 'default' | 'purple' | 'blue' | 'colorful'
  backgroundGradient?: string
  containerClassName?: string
  
  // State management
  isLoading?: boolean
  isGameComplete?: boolean
}

// Unified Registration Props
export interface UnifiedRegistrationProps {
  // Registration handling
  onRegister: (participant: ParticipantData) => Promise<void>
  onTrialMode: () => void
  
  // Game customization
  gameTitle?: string
  gameName?: string
  
  // State management
  isLoading?: boolean
  error?: string | null
  
  // Form customization
  requireEmail?: boolean
  requirePhone?: boolean
  showTrialOption?: boolean
  
  // Styling
  theme?: 'default' | 'light' | 'dark'
  className?: string
}

// Game Status Props for centralized status tracking
export interface GameStatusProps {
  // Game type identification
  gameType: 'STARS_HEXA' | string
  
  // Common game state
  isGameComplete?: boolean
  isLoading?: boolean
  
  // Stars Hexa specific stats
  starsHexa?: {
    currentRound: number
    totalRounds: number
    flipsUsed: number
    maxFlipsPerRound: number
    starsFound: number
    totalStars: number
  }
  
  
  // Custom stats for future game types
  customStats?: Array<{
    label: string
    value: string | number
    description: string
    isHighlighted?: boolean
  }>
  
  // Styling
  theme?: 'default' | 'compact' | 'detailed'
  className?: string
}

// Game Description Props for centralized game information
export interface GameDescriptionProps {
  // Game type identification
  gameType: 'STARS_HEXA' | string
  
  // Game state context
  isGameComplete?: boolean
  isGameActive?: boolean
  spinsRemaining?: number
  attemptsRemaining?: number
  
  // Content customization
  title?: string
  showRules?: boolean
  showWinConditions?: boolean
  showCurrentState?: boolean
  
  // Stars Hexa specific content
  starsHexaRules?: {
    maxFlipsPerRound: number
    totalRounds: number
    totalStars: number
    autoFlipBackDelay: number
  }
  
  
  // Custom content for future games
  customRules?: string[]
  customWinConditions?: string[]
  customDescription?: string
  
  // Styling
  theme?: 'default' | 'compact' | 'detailed'
  className?: string
}

// Game Types and Interfaces
// These define the structure for different game types and their configurations

export type GameType = 'STARS_HEXA' | 'PENALTY_SHOOTOUT';

// Lucky Wheel segment type used by the wheel component
// What: Defines a segment with label and probability for spin logic
// Why: Provides a reusable contract for wheel-based games and UIs.
export interface WheelSegment {
  id: string
  label: string
  probability?: number // Percentage (should sum to 100 across segments); defaults handled at runtime
  color?: string
  backgroundColor?: string
  isWinning?: boolean
  isActive?: boolean
}

// Simple wheel configuration (admin-friendly)
export interface SimpleWheelConfiguration {
  jackpotsCount: number // 1..6
  wheel1Segments: number
  wheel2Segments: number
  wheel3Segments: number
  totalSegmentsToUse: number
  segmentNames: string[]
}

// Complete wheel configuration used by runtime/wheel
export interface WheelOfFortuneConfiguration {
  segments: WheelSegment[]
  wheel1Segments: WheelSegment[]
  wheel2Segments: WheelSegment[]
  wheel3Segments: WheelSegment[]
  spins: number
  spinsPerGame: number
  durationMs: number
  pointerAt: 'top' | 'right' | 'bottom' | 'left'
  size: number
  theme: 'default' | 'colorful' | 'minimal'
  allowImmediateReplay: boolean
  gameRule: {
    winCondition: string
    jackpotLabel: string
    collectionsNeeded: number
  }
  simpleConfig: SimpleWheelConfiguration
}

export type GameStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export interface HexagonCard {
  id: string
  text: string
  hasHiddenStar: boolean
  isRevealed: boolean
  position: number // 0-6 for the 7 hexagons in 2-3-2 layout
  color?: string
  backgroundColor?: string
  rewardId?: string // If this hexagon contains a reward
}

export interface PenaltyCard {
  id: string
  playerNumber: number // Jersey number (2-22)
  hasGoal: boolean // true if player scores, false if miss
  isRevealed: boolean
  position: number // 0-10 for the 11 hexagons in 1-4-3-2-1 layout
  color?: string
  backgroundColor?: string
}


export interface GeneralTexts {
  // 🎯 Welcome & Registration
  gameTitle?: string
  namePlaceholder?: string
  emailPlaceholder?: string
  phonePlaceholder?: string
  contactRequiredError?: string
  startPlayingButton?: string
  tryWithoutRegText?: string
  tryWithoutRegButton?: string

  // 📋 Game Rules & Description
  gameRulesTitle?: string
  playButton?: string
  gameRulesText?: string
  winConditionsTitle?: string
  winConditionsText?: string
  gameDescription?: string

  // 🏆 Result Page & Result Messages
  gameResultsTitle?: string
  playAgainButton?: string
  shareWithFriendsButton?: string
  victoryResultMessage?: string
  defeatResultMessage?: string

  // 📊 Win/Loss Messages
  defeatTitle?: string
  victoryTitle?: string
  drawMessage?: string

  // ⚠️ Loading & Error Messages
  loadingGameText?: string
  gameNotFoundTitle?: string
  gameNotFoundMessage?: string
  tryAgainButton?: string
  gameTypeNotSupportedTitle?: string
  gameTypeNotSupportedMessage?: string
}

export interface GeneralColors {
  // 🎨 Background Colors
  pageBackground?: string
  blockBackground?: string

  // 🔘 Button Colors
  primaryButton?: string
  secondaryButton?: string

  // ⚽ Game Field Colors
  homeScoreCard?: string
  visitorScoreCard?: string
  gameField?: string
  playerCard?: string
  failedPenalty?: string
}

export interface PlatformTexts {
  // Hero titles
  TEXT_10?: string
  TEXT_20?: string
  TEXT_30?: string
  TEXT_40?: string
  // Welcome - description + headings and placeholders
  TEXT_11?: string
  TEXT_12?: string
  TEXT_13?: string
  TEXT_14?: string
  TEXT_15?: string
  TEXT_16?: string
  TEXT_17?: string
  TEXT_18?: string
  TEXT_19?: string
  // Rules
  TEXT_21?: string
  TEXT_22?: string
  TEXT_23?: string
  TEXT_24?: string
  TEXT_25?: string
  // Result
  TEXT_41?: string
  TEXT_42?: string
  TEXT_43?: string
  TEXT_44?: string
  TEXT_45?: string
  TEXT_46?: string
  // New per-game platformized fields
  // What: Contact helper + try-without-registration tagline + CTA Title/Description + CTA Buttons with URLs
  // Why: Ensure platformized flow texts are fully configurable per game without hardcoding
  TEXT_26?: string // Please provide either email or phone number
  TEXT_27?: string // Want to try without registration?
  // Back-compat single CTA
  TEXT_44_URL?: string // Deprecated in favor of CTA_BUTTONS, still supported as first CTA
  // New CTA structure
  CTA_TITLE?: string
  CTA_DESCRIPTION?: string
  WON_TEXT?: string
  LOST_TEXT?: string
  CTA1_BG?: string
  CTA_BUTTONS?: Array<{ text: string; url: string; bg?: string }>
  // Legal docs
  TERMS_TITLE?: string
  TERMS_BODY?: string
  PRIVACY_TITLE?: string
  PRIVACY_BODY?: string
}

export interface PlatformStyles {
  hero?: {
    background?: string
    titleClass?: string
  }
  main?: {
    background?: string
    h1Class?: string
    h2Class?: string
    pClass?: string
    buttonPrimaryClass?: string
    buttonSecondaryClass?: string
  }
  scoreboard?: {
    homeBg?: string
    visitorBg?: string
    digitColor?: string
    showLabels?: boolean
    homeLabel?: string
    visitorLabel?: string
  }
}

export interface GameConfiguration {
  // Central platform configuration
  platform?: {
    texts?: PlatformTexts
    styles?: PlatformStyles
  }

  // Global (game-agnostic) settings available to all games
  general?: {
    texts?: GeneralTexts
    colors?: GeneralColors
  }

  // Stars Hexa specific configuration
  starsHexa?: {
    hexagons: HexagonCard[]
    totalStars: number // Number of hidden stars (1-3)
    maxFlipsPerAttempt: number // Maximum flips allowed per attempt
    theme: 'default' | 'colorful' | 'minimal'

    // Optional UI texts for 4-page flow (welcome/rules/game/result)
    // Why: enable admin customization without breaking existing games
    texts?: {
      // Welcome page
      welcomeTitle?: string
      welcomeSubtitle?: string
      ctaStart?: string
      ctaGuest?: string
      // Rules page
      rulesTitle?: string
      rulesBody?: string
      // Result page
      resultTitle?: string
      resultInviteCTA?: string
      resultPlayAgainCTA?: string
      resultPartnerCTA?: string
      // In-game HUD or auxiliary texts
      gameHUD?: string
    }

    // Optional color palette with page-level overrides
    // Colors validated at schema level; here we only type the shape
    colors?: {
      palette?: {
        primary?: string
        accent?: string
        bg?: string
        text?: string
      }
      pageOverrides?: {
        welcome?: Record<string, string>
        rules?: Record<string, string>
        game?: Record<string, string>
        result?: Record<string, string>
      }
    }

    // Emoji customization for win/lose states
    emojis?: {
      win?: string // Default: ⭐️
      lose?: string // Default: 🍄
    }
  }
  
  // Penalty Shootout specific configuration
  penaltyShootout?: {
    players: PenaltyCard[] // 11 penalty cards in 1-4-3-2-1 formation
    totalGoals: number // Number of goals (7 out of 11)
    playersToSelect: number // Number of players to select for penalties (5)
    maxFlipsPerAttempt: number // Maximum penalty kicks per round (5)
    theme: 'default' | 'colorful' | 'football'
    
    // Customizable texts
    texts?: {
      // Registration texts
      gameTitle?: string
      namePlaceholder?: string
      emailPlaceholder?: string
      phonePlaceholder?: string
      contactRequiredError?: string
      startPlayingButton?: string
      tryWithoutRegText?: string
      tryWithoutRegButton?: string
      
      // Game texts
      gameRulesTitle?: string
      gameRulesText?: string
      winConditionsTitle?: string
      winConditionsText?: string
      gameDescription?: string
      playButton?: string
      
      // Result page texts
      gameResultsTitle?: string // "GAME RESULTS" in scoreboard
      playAgainButton?: string
      shareWithFriendsButton?: string
      shareResultTitle?: string
      copyLinkButton?: string
      shareButton?: string
      congratulationsText?: string // "Congratulations!"
      gameOverText?: string // "Game Over"
      inviteFriendsButton?: string // "Invite Friends"
      
      // Result message emojis and texts
      victoryResultEmoji?: string // "Victory"
      defeatResultEmoji?: string // "Defeat"
      victoryResultMessage?: string // "Fantastic! You won the penalty shootout"
      defeatResultMessage?: string // "Good effort! You lost the penalty shootout. Try again!"
      
      // Labels and UI elements
      yourGoalsLabel?: string
      opponentGoalsLabel?: string
      starsFoundLabel?: string // "Stars Found"
      roundsUsedLabel?: string // "Rounds Used"
      
      // Win/Loss texts (legacy - keeping for backwards compatibility)
      defeatIcon?: string
      defeatTitle?: string
      trialModeIndicator?: string
      visitorWinMessage?: string
      drawIcon?: string
      drawMessage?: string
      visitorPenaltyWinMessage?: string
      victoryIcon?: string
      victoryTitle?: string
      homeWinMessage?: string
      
      // Loading and Error texts
      loadingGameText?: string // "Loading game..."
      gameNotFoundTitle?: string // "Game Not Found"
      gameNotFoundMessage?: string // "The game you're looking for doesn't exist or is no longer available."
      tryAgainButton?: string // "Try Again"
      gameTypeNotSupportedTitle?: string // "Game Type Not Supported"
      gameTypeNotSupportedMessage?: string // "This game type is not yet supported in the play interface."
    }
    
    // Customizable colors
    colors?: {
      // Background colors
      pageBackground?: string
      blockBackground?: string
      titleField?: string
      
      // Button colors
      primaryButton?: string
      secondaryButton?: string
      
      // Game field colors
      homeScoreCard?: string
      visitorScoreCard?: string
      gameField?: string
      playerCard?: string
      failedPenalty?: string
    }
  }
  
  // General game settings
  allowMultipleAttempts: boolean
  maxAttemptsPerUser: number
  requireRegistration: boolean
  showResults: boolean
  endDate?: Date
  startDate?: Date
}

export interface ShareLink {
  id: string
  url: string
  shortCode: string
  qrCodeUrl?: string
  expiresAt?: Date
  clickCount: number
  isActive: boolean
  createdAt: Date
}

export interface Game extends BaseDocument {
  title: string
  description?: string
  type: GameType
  status: GameStatus
  configuration: GameConfiguration
  targetGroups: ObjectId[] // References to TargetGroup documents
  shareLinks: ShareLink[]
  createdBy: string // User identifier (email or ID)
  totalParticipants: number
  totalPlays: number
  isPublic: boolean
  tags?: string[]
}

// Target Group and Participant Management
// These interfaces handle user segmentation and participation tracking

export interface GroupMember {
  id: string
  name: string
  email?: string
  phone?: string
  metadata?: Record<string, any> // Additional custom fields
  joinedAt: Date
  isActive: boolean
}

export interface TargetGroup extends BaseDocument {
  name: string
  description?: string
  members: GroupMember[]
  games: ObjectId[] // References to Game documents
  createdBy: string
  isActive: boolean
  tags?: string[]
  memberCount: number
}

export interface Participant extends BaseDocument {
  name: string
  email?: string
  phone?: string
  uuid?: string // Unique identifier for referral tracking (optional for backward compatibility)
  referrerUuid?: string // UUID of the person who referred this participant
  groupIds: ObjectId[] // Can belong to multiple groups
  gameResults: ObjectId[] // References to GameResult documents
  totalGamesPlayed: number
  totalRewardsEarned: number
  metadata?: Record<string, any>
  isActive: boolean
  lastActivityAt: Date
}

// Game Results and Outcomes
// These interfaces track individual game plays and their outcomes

export type GameOutcomeType = 'WIN' | 'LOSE' | 'NO_REWARD'

export interface GameOutcome {
  type: GameOutcomeType
  // Stars Hexa specific fields
  hexagonId?: string // For Stars Hexa games - which hexagon was revealed
  // Lucky Wheel specific field
  segmentId?: string // For wheel games - ID of the winning segment
  // Common metrics
  starsFound: number // Number of stars discovered in this attempt
  totalStarsInGame: number // Total stars hidden in the game
  foundAllStars: boolean // Whether player found all stars
  // Common fields
  value?: string | number
  rewardIds: string[] // Multiple rewards can be won
  message?: string // Custom message to show user
}

export interface GameResult extends BaseDocument {
  gameId: ObjectId
  participantId: ObjectId
  outcome: GameOutcome
  playedAt: Date
  ipAddress?: string
  userAgent?: string
  location?: {
    country?: string
    city?: string
    coordinates?: [number, number] // [longitude, latitude]
  }
  sessionId: string
  isValidated: boolean // For anti-cheat verification
}

// Rewards and Benefits System
// These interfaces manage the rewards that can be won through games

export type RewardType = 'POINTS' | 'COUPON' | 'PHYSICAL_PRIZE' | 'DISCOUNT' | 'CUSTOM'

export type RewardStatus = 'AVAILABLE' | 'CLAIMED' | 'EXPIRED' | 'USED'

export interface RewardConfiguration {
  // Points reward
  points?: {
    amount: number
    currency?: string
  }
  
  // Coupon reward
  coupon?: {
    code: string
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
    minOrderValue?: number
    expiresAt?: Date
  }
  
  // Physical prize
  physicalPrize?: {
    name: string
    description: string
    imageUrl?: string
    shippingRequired: boolean
    estimatedValue?: number
  }
  
  // Custom reward
  custom?: {
    title: string
    description: string
    instructions?: string
    metadata?: Record<string, any>
  }
}

export interface Reward extends BaseDocument {
  gameId: ObjectId
  title: string
  description?: string
  type: RewardType
  configuration: RewardConfiguration
  totalQuantity?: number // null for unlimited
  remainingQuantity?: number
  isActive: boolean
  expiresAt?: Date
  createdBy: string
  imageUrl?: string
  termsAndConditions?: string
}

export interface RewardClaim extends BaseDocument {
  rewardId: ObjectId
  participantId: ObjectId
  gameResultId: ObjectId
  status: RewardStatus
  claimedAt: Date
  usedAt?: Date
  expiresAt?: Date
  validationCode?: string // For verification
  metadata?: Record<string, any>
  notes?: string
}

// API Response Types
// These interfaces define the structure of API responses

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface GameStats {
  totalGames: number
  activeGames: number
  totalParticipants: number
  totalPlays: number
  totalRewards: number
  conversionRate: number // Percentage of plays that result in rewards
  popularGameTypes: Array<{
    type: GameType
    count: number
    percentage: number
  }>
}

export interface ParticipantStats {
  totalParticipants: number
  activeParticipants: number
  averageGamesPerParticipant: number
  topParticipants: Array<{
    participantId: ObjectId
    name: string
    gamesPlayed: number
    rewardsEarned: number
  }>
}

// Validation and Error Types
// These interfaces help with data validation and error handling

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface GameValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
}

export interface PlayAttemptValidation {
  canPlay: boolean
  reasons: string[]
  attemptsRemaining?: number
  nextAvailableAt?: Date
}

// Utility Types
// These are helper types for common patterns

export type DocumentId = string | ObjectId

export type CreateGameRequest = Omit<Game, '_id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalPlays'>

export type UpdateGameRequest = Partial<CreateGameRequest>

export type CreateTargetGroupRequest = Omit<TargetGroup, '_id' | 'createdAt' | 'updatedAt' | 'memberCount' | 'games'>

export type PlayGameRequest = {
  gameId: string
  participant: {
    name: string
    email?: string
    phone?: string
  }
  sessionId?: string
}

export type PlayGameResponse = {
  result: GameOutcome
  rewards: Reward[]
  canPlayAgain: boolean
  attemptsRemaining?: number
  shareUrl?: string
}

// Filter and Query Types
// These types help with database queries and filtering

export interface GameFilters {
  status?: GameStatus[]
  type?: GameType[]
  createdBy?: string
  startDate?: Date
  endDate?: Date
  isPublic?: boolean
  hasActiveTargetGroups?: boolean
}

export interface ParticipantFilters {
  groupIds?: string[]
  isActive?: boolean
  hasPlayed?: boolean
  lastActivityAfter?: Date
  lastActivityBefore?: Date
}

export interface RewardFilters {
  type?: RewardType[]
  isActive?: boolean
  hasQuantityRemaining?: boolean
  expiringBefore?: Date
  createdBy?: string
}
