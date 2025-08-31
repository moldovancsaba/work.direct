import { ObjectId, Document } from 'mongodb'

// Base interface for all database documents
// This ensures consistent structure across all models
export interface BaseDocument {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

// Game Types and Interfaces
// These define the structure for different game types and their configurations

export type GameType = 'STARS_HEXA' | '💰🌪️🍀';

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

// Wheel of Fortune specific interfaces
export interface WheelSegment {
  id: string
  label: string
  color: string
  probability?: number // Optional weight for non-equal probability
  rewardId?: string // If this segment contains a reward
  isActive: boolean
}

// Simple configuration for auto-generating wheels
export interface SimpleWheelConfiguration {
  jackpotsCount: 1 | 2 | 3 | 4 | 5 | 6 // How many jackpots across all wheels
  wheel1Segments: 3 | 4 | 5 | 6 | 7 | 8 // Number of segments on wheel 1
  wheel2Segments: 3 | 4 | 5 | 6 | 7 | 8 // Number of segments on wheel 2
  wheel3Segments: 3 | 4 | 5 | 6 | 7 | 8 // Number of segments on wheel 3
  totalSegmentsToUse: 5 | 6 | 7 | 8 | 9 | 10 | 11 // How many different segment types to use (including jackpot)
  segmentNames: string[] // List of available segment names
}

export interface WheelOfFortuneConfiguration {
  segments: WheelSegment[] // Default segments for all wheels (backward compatibility)
  wheel1Segments?: WheelSegment[] // Custom segments for wheel 1
  wheel2Segments?: WheelSegment[] // Custom segments for wheel 2
  wheel3Segments?: WheelSegment[] // Custom segments for wheel 3
  spins: number // Base number of full rotations before stopping
  spinsPerGame: number // Number of spins allowed per game (default 3)
  durationMs: number // Spin animation duration in milliseconds
  pointerAt: 'top' | 'right' // Pointer position
  size: number // SVG size in pixels
  theme: 'default' | 'colorful' | 'minimal'
  allowImmediateReplay: boolean // Whether user can spin again immediately
  gameRule: {
    winCondition: 'collect_three_same' | 'jackpot_once' // Win by collecting 3 same or hitting jackpot once
    jackpotLabel: string // Which segment label is considered jackpot
    collectionsNeeded: number // Number of same items needed to win (default 3)
  }
  // Simple configuration (optional)
  simpleConfig?: SimpleWheelConfiguration
}

export interface GameConfiguration {
  // Stars Hexa specific configuration
  starsHexa?: {
    hexagons: HexagonCard[]
    totalStars: number // Number of hidden stars (1-3)
    maxFlipsPerAttempt: number // Maximum flips allowed per attempt
    theme: 'default' | 'colorful' | 'minimal'
  }
  
  // Wheel of Fortune specific configuration
  wheelOfFortune?: {
    segments: WheelSegment[] // Default segments for all wheels
    wheel1Segments?: WheelSegment[] // Custom segments for wheel 1
    wheel2Segments?: WheelSegment[] // Custom segments for wheel 2
    wheel3Segments?: WheelSegment[] // Custom segments for wheel 3
    spins: number // Base number of full rotations before stopping
    spinsPerGame: number // Number of spins allowed per game (default 3)
    durationMs: number // Spin animation duration in milliseconds
    pointerAt: 'top' | 'right' // Pointer position
    size: number // SVG size in pixels
    theme: 'default' | 'colorful' | 'minimal'
    allowImmediateReplay: boolean // Whether user can spin again immediately
    gameRule: {
      winCondition: 'collect_three_same' | 'jackpot_once' // Win by collecting 3 same or hitting jackpot once
      jackpotLabel: string // Which segment label is considered jackpot
      collectionsNeeded: number // Number of same items needed to win (default 3)
    }
    // Simple configuration (optional)
    simpleConfig?: SimpleWheelConfiguration
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
  starsFound: number // Number of stars discovered in this attempt
  totalStarsInGame: number // Total stars hidden in the game
  foundAllStars: boolean // Whether player found all stars
  // Wheel of Fortune specific fields
  segmentId?: string // For Wheel of Fortune games - which segment was landed on
  segmentLabel?: string // The label of the winning segment
  spinsUsed?: number // Number of spins used in this game session
  spinsRemaining?: number // Number of spins remaining
  segmentsCollected?: Record<string, number> // Track collected segments: label -> count
  isGameComplete?: boolean // Whether the wheel game has ended
  // Triple Wheel specific fields
  allResults?: string[] // All results from all wheels across all spins
  winType?: string // Type of win: 'JACKPOT', 'THREE_SAME', 'NONE'
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
