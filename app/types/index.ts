import { ObjectId, Document } from 'mongodb'
import { ReactNode } from 'react'

// Base interface for all database documents
// This ensures consistent structure across all models
export interface BaseDocument {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

// Map coordinate systems for reusable grid-based game layouts
// WHAT: Shareable named sets of coordinates that multiple grid-based games can use as levels/maps.
// WHY: Centralize map creation and reuse across different coordinate systems (hex, square, diamond),
//      enabling randomization and filtering by size/tags while maintaining type safety per grid type.

// Hex maps for hexagonal grid layouts (axial coordinates)
export interface HexCoord { q: number; r: number }

export interface HexFieldExtents { top?: HexCoord; bottom?: HexCoord; left?: HexCoord; right?: HexCoord }

export interface HexMap extends BaseDocument {
  name: string // Unique, human-readable identifier; used as reference in game configs
  coords: HexCoord[] // Axial coordinates included in the map (within radius) — interactive cards
  radius: number // Maximum hex distance from origin allowed in this map (e.g., 4)
  hexCount: number // Derived: coords.length
  tags?: string[] // Optional hashtags for search and grouping (stored lowercase)
  backgroundImageUrl?: string // Optional background image URL for editor preview and public rendering
  isActive: boolean // Soft delete / archival toggle
  createdBy: string // Admin identifier
  // WHAT: Optional extents marking the intended visible field across aspect ratios
  // WHY: Runtime can fit the rotated grid to ensure these extremes are visible on any screen
  fieldExtents?: HexFieldExtents
  // WHAT: Optional field mask list — cells visible as the game field regardless of interactivity
  // WHY: Decouple visibility (field) from interactivity (cards)
  fieldMask?: HexCoord[]
}

// Square maps for square grid layouts (Cartesian coordinates with Chebyshev distance)
// WHAT: Grid-aligned squares with selection mask based on max(|x|,|y|) <= radius (square boundary)
// WHY: Enables square-tiled games with intuitive rectangular selection areas
export interface SquareCoord { x: number; y: number }

export interface SquareFieldExtents { top?: SquareCoord; bottom?: SquareCoord; left?: SquareCoord; right?: SquareCoord }

export interface SquareMap extends BaseDocument {
  name: string // Unique within SquareMap collection
  coords: SquareCoord[] // Cartesian coordinates within Chebyshev radius — interactive cards
  radius: number // Maximum Chebyshev distance from origin (1-24)
  cellCount: number // Derived: coords.length after deduplication
  tags?: string[] // Optional hashtags for search and grouping (stored lowercase)
  backgroundImageUrl?: string // Optional background image URL for editor preview and public rendering
  isActive: boolean // Soft delete / archival toggle
  createdBy: string // Admin identifier
  // WHAT: Optional extents marking the intended visible field across aspect ratios
  fieldExtents?: SquareFieldExtents
  // WHAT: Optional field mask list — cells visible as the game field regardless of interactivity
  // WHY: Decouple visibility (field) from interactivity (cards)
  fieldMask?: SquareCoord[]
}

// Unified grid map typing for Quizz
export type QuizzCoord = HexCoord | SquareCoord

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

export type GameType = 'STARS_HEXA' | 'PENALTY_SHOOTOUT' | 'FIND_RED' | 'WHEEL_OF_FORTUNE' | 'QUIZZ' | 'QUIZZZ';

// Lucky Wheel segment type used by the wheel component
// What: Defines a segment with label and probability for spin logic
// Why: Provides a reusable contract for wheel-based games and UIs.
// Quizzz game types
export type GridMapType = 'hex' | 'square'

export interface QuizzzAnswer { text: string; isCorrect: boolean }
export interface QuizzzQuestion { id: string; text: string; answers: QuizzzAnswer[] }

export interface QuizzzConfiguration {
  mapType: GridMapType
  mapName?: string
  selectedMaps?: { type: GridMapType; name: string }[]
  numberOfCards: number
  rounds: number
  winLimit: number
  questions: QuizzzQuestion[]
  backgroundCss?: string // multiline CSS background
  tileStyles?: {
    inactiveTileBg?: string // default transparent
    inactiveTileEdge?: string // default transparent
    boardTileBg?: string // default transparent (field)
    boardEdge?: string // default transparent
  }
  cardCoverImages?: string[]
  cardCoverFill?: boolean // cover/fill toggle, true = cover by default
  cardColors?: {
    backBg?: string
    frontFg?: string
    goodAnswerBg?: string
    goodAnswerEmoji?: string
    wrongAnswerBg?: string
    wrongAnswerEmoji?: string
  }
  overlayBg?: string // default '#00000044'
}

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
  // Standardized CTA keys (editor-facing). Why: unify 3-line button blocks and introduce ACTION fields.
  // Result primary CTA (external link)
  CTA1_TEXT?: string
  CTA1_URL?: string
  CTA1_BG?: string

  // Welcome — Next With Login (maps to legacy TEXT_18, TEXT_18_BG)
  NEXT_LOGIN_TEXT?: string
  NEXT_LOGIN_ACTION?: string // e.g., REGISTER_AND_CONTINUE
  NEXT_LOGIN_BG?: string

  // Welcome — Next Without Login (maps to legacy TEXT_19, TEXT_19_BG)
  NEXT_GUEST_TEXT?: string
  NEXT_GUEST_ACTION?: string // e.g., CONTINUE_AS_GUEST
  NEXT_GUEST_BG?: string

  // Rules — Next Play (maps to legacy TEXT_25, TEXT_25_BG)
  NEXT_PLAY_TEXT?: string
  NEXT_PLAY_ACTION?: string // e.g., START_GAME
  NEXT_PLAY_BG?: string

  // Result — Invite Friend (maps to legacy TEXT_45, TEXT_45_BG)
  INVITE_TEXT?: string
  INVITE_ACTION?: string // e.g., INVITE_REFERRAL
  INVITE_BG?: string

  // Result — Play Again (maps to legacy TEXT_46, TEXT_46_BG)
  PLAYAGAIN_TEXT?: string
  PLAYAGAIN_ACTION?: string // e.g., RESTART_GAME
  PLAYAGAIN_BG?: string

  // Additional CTAs array (unchanged storage)
  CTA_BUTTONS?: Array<{ text: string; url: string; bg?: string; fg?: string }>

  // Per-button background CSS (legacy fields, multiline supported)
  // What: precise CSS control per CTA across the flow
  // Why: product requirement for gradients and custom backgrounds via admin
  TEXT_18_BG?: string
  TEXT_19_BG?: string
  TEXT_25_BG?: string
  TEXT_45_BG?: string
  TEXT_46_BG?: string

  // Legal docs
  TERMS_TITLE?: string
  TERMS_BODY?: string
  PRIVACY_TITLE?: string
  PRIVACY_BODY?: string
  DELETION_TITLE?: string
  DELETION_BODY?: string

  // Landing page
  LANDING_TITLE?: string
  LANDING_IMAGE_URL?: string
}

export interface PlatformStyles {
  hero?: {
    background?: string
    titleClass?: string
    fontColor?: string
  }
  main?: {
    background?: string
    // Per-type classes
    h1Class?: string
    h2Class?: string
    pClass?: string
    // Per-type Google Fonts
    h1FontUrl?: string
    h1FontStyle?: string
    h2FontUrl?: string
    h2FontStyle?: string
    pFontUrl?: string
    pFontStyle?: string
    // Per-type colors
    h1Color?: string
    h2Color?: string
    pColor?: string
    // Buttons
    buttonPrimaryClass?: string
    buttonSecondaryClass?: string
  }
  scoreboard?: {
    homeBg?: string
    visitorBg?: string
    digitColor?: string
  }
}

export interface QuizzAnswer {
  text: string
  isCorrect: boolean
}

export interface QuizzQuestion {
  id: string
  text: string
  answers: [QuizzAnswer, QuizzAnswer, QuizzAnswer] // exactly three answers
}

export interface QuizzConfiguration {
  // Map integration
  mapType?: GridMapType // 'hex' | 'square' — determines coordinate system and rendering (legacy)
  mapName?: string // Legacy single map name reference (kept for backward compatibility)
  activeCoords?: QuizzCoord[] // Optional embedded coords (fallback if no mapName)
  mapTag?: string // Legacy random tag when mapName is not provided
  selectedMaps?: { type: GridMapType; name: string }[] // Preferred: explicit selected map list (order matters)
  randomizeSelectedMaps?: boolean // If true, pick a random map from selectedMaps at game start
  // Gameplay
  rounds: number // Y rounds (questions asked)
  targetCorrect: number // X correct answers needed to win
  questions: QuizzQuestion[] // Infinite possible questions (admin-managed)
  theme?: 'default' | 'minimal'
  overlayBg?: string // Background overlay CSS color for the question modal (e.g., rgba(0,0,0,0.6))
  texts?: {
    questionCTA?: string
    submitAnswer?: string
    correctFeedback?: string
    wrongFeedback?: string
  }
  // Presentation — per-cell cover images (transparent PNGs recommended)
  cardCoverImages?: string[]
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

  // Find Red (Get Shorty) specific configuration
  // What: Configuration for the "Get Shorty" game where players try to pick red cards.
  // Why: Adds a simple, repeatable round-based card game with configurable difficulty and colors.
  findRed?: {
    // Optional map integration (enables playing on hex/square/diamond maps)
    mapType?: GridMapType // 'hex' | 'square' | 'diamond'
    mapName?: string // Map name to fetch
    mapTag?: string // Random tag if mapName is not provided
    activeCoords?: QuizzCoord[] // Optional embedded coords

    // Pack parameters per round (used as fallback or to limit visible cells)
    packSize: number // X — total cards per round (used when no map or to limit cells)
    redsPerPack: number // Y — red cards per round (1 ≤ Y ≤ X)
    selectionsPerRound: number // number of picks allowed per round (1 ≤ selectionsPerRound ≤ X)

    // Win condition
    targetReds: number // Z — reds to find to win
    totalRounds: number // W — total rounds in game (1 ≤ Z ≤ W)

    // Presentation
    theme?: 'default' | 'minimal'
    texts?: {
      // Display name for the red item — defaults to "Shorty" per request
      shortyLabel?: string
    }
    colors?: {
      // Global background (board or container) color
      background?: string
      // Foreground color for red (win) face
      winForeground?: string
      // Foreground color for neutral (non-red) face
      neutralForeground?: string
      // Card back color and border color
      cardBack?: string
      cardBorder?: string
    }

    // Optional default reward to attach on final win (uses existing Rewards system)
    defaultRewardId?: string
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
  
  // Wheel of Fortune configuration (optional)
  // What: Enables standardized 4-page flow usage of the existing LuckyWheel component.
  // Why: Reinstate wheel with the same Landing/Welcome/Rules/Game/Result workflow.
  wheelOfFortune?: WheelOfFortuneConfiguration

  // Quizz configuration (hexamap-based quiz)
  quizz?: QuizzConfiguration

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
