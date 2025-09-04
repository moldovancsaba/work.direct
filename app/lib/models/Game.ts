import mongoose, { Schema, Model } from 'mongoose'
import { Game, GameType, GameStatus, HexagonCard, PenaltyCard, ShareLink } from '../../types'

// HexagonCard subdocument schema
// This defines the structure for individual hexagon cards in Stars Hexa games
const hexagonCardSchema = new Schema<HexagonCard>({
  id: {
    type: String,
    required: [true, 'Hexagon ID is required'],
    trim: true
  },
  text: {
    type: String,
    required: [true, 'Hexagon text is required'],
    trim: true,
    maxlength: [50, 'Hexagon text cannot exceed 50 characters']
  },
  hasHiddenStar: {
    type: Boolean,
    required: [true, 'Hidden star flag is required'],
    default: false
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    required: [true, 'Hexagon position is required'],
    min: [0, 'Position must be at least 0'],
    max: [6, 'Position cannot exceed 6 (for 7 hexagons: 0-6)']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  backgroundColor: {
    type: String,
    default: '#EFF6FF', // Default light blue background
    match: [/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color']
  },
  rewardId: {
    type: String,
    default: null
  }
}, { _id: false }) // Disable automatic _id for subdocuments

// PenaltyCard subdocument schema
// This defines the structure for individual penalty cards in Penalty Shootout games
const penaltyCardSchema = new Schema<PenaltyCard>({
  id: {
    type: String,
    required: [true, 'Penalty card ID is required'],
    trim: true
  },
  playerNumber: {
    type: Number,
    required: [true, 'Player number is required'],
    min: [2, 'Player number must be at least 2'],
    max: [22, 'Player number cannot exceed 22']
  },
  hasGoal: {
    type: Boolean,
    required: [true, 'Goal flag is required'],
    default: false
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    required: [true, 'Position is required'],
    min: [0, 'Position must be at least 0'],
    max: [10, 'Position cannot exceed 10 (for 11 players: 0-10)']
  },
  color: {
    type: String,
    default: '#22C55E', // Default green color for football
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  backgroundColor: {
    type: String,
    default: '#DCFCE7', // Default light green background
    match: [/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color']
  }
}, { _id: false }) // Disable automatic _id for subdocuments


// ShareLink subdocument schema
// This manages the sharing links and QR codes for games
const shareLinkSchema = new Schema<ShareLink>({
  id: {
    type: String,
    required: [true, 'Share link ID is required'],
    unique: true
  },
  url: {
    type: String,
    required: [true, 'Share URL is required'],
    match: [/^https?:\/\/.+/, 'URL must be a valid HTTP/HTTPS URL']
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    trim: true,
    minlength: [4, 'Short code must be at least 4 characters'],
    maxlength: [12, 'Short code cannot exceed 12 characters']
  },
  qrCodeUrl: {
    type: String,
    default: null,
    match: [/^https?:\/\/.+/, 'QR code URL must be a valid HTTP/HTTPS URL']
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clickCount: {
    type: Number,
    default: 0,
    min: [0, 'Click count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

// Main Game schema
// This defines the complete structure for game documents in MongoDB
const gameSchema = new Schema<Game>({
  title: {
    type: String,
    required: [true, 'Game title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  type: {
    type: String,
    required: [true, 'Game type is required'],
    enum: {
      values: ['STARS_HEXA', 'PENALTY_SHOOTOUT'] as GameType[],
      message: 'Game type must be: STARS_HEXA, PENALTY_SHOOTOUT'
    }
  },
  
  status: {
    type: String,
    required: [true, 'Game status is required'],
    enum: {
      values: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as GameStatus[],
      message: 'Status must be one of: DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED'
    },
    default: 'DRAFT'
  },
  
  // Game configuration object with type-specific settings
  configuration: {
    // Stars Hexa specific configuration
    starsHexa: {
      hexagons: {
        type: [hexagonCardSchema]
        // Validation handled in pre-save middleware
      },
      totalStars: {
        type: Number,
        required: false // Validation handled in pre-save middleware
      },
      maxFlipsPerAttempt: {
        type: Number
        // Validation handled in pre-save middleware
      },
      theme: {
        type: String,
        enum: ['default', 'colorful', 'minimal'],
        default: 'default'
      }
    },
    
    // Penalty Shootout specific configuration
    penaltyShootout: {
      players: {
        type: [penaltyCardSchema]
        // Validation handled in pre-save middleware
      },
      totalGoals: {
        type: Number,
        required: false // Validation handled in pre-save middleware
      },
      playersToSelect: {
        type: Number,
        default: 5 // Always 5 players for penalties
      },
      theme: {
        type: String,
        enum: ['default', 'colorful', 'football'],
        default: 'football'
      },
      // Customizable texts
      texts: {
        // Registration texts
        joinButton: { type: String, default: 'Join' },
        gameTitle: { type: String, default: 'DVTK Büntető Párbaj' },
        registrationSubtitle: { type: String, default: 'Enter your details to play' },
        namePlaceholder: { type: String, default: 'Enter your name' },
        emailPlaceholder: { type: String, default: 'your@email.com' },
        phonePlaceholder: { type: String, default: '+1 (555) 123-4567' },
        contactRequiredError: { type: String, default: 'Please provide either email or phone number' },
        startPlayingButton: { type: String, default: '🎮 Start Playing' },
        tryWithoutRegText: { type: String, default: 'Want to try without registration?' },
        tryWithoutRegButton: { type: String, default: '🎯 Try Without Registration' },
        
        // Game texts
        gameIcon: { type: String, default: '⚽' },
        howToPlayButton: { type: String, default: '📋 How to Play' },
        gameRulesTitle: { type: String, default: '🎮 Game Rules:' },
        gameRulesText: { type: String, default: '⚽ Select 5 players from 11 team members\n⚡ If draw, Visitor WINS!' },
        winConditionsTitle: { type: String, default: '🏆 Win Conditions:' },
        winConditionsText: { type: String, default: '🏆 Score more goals than opponent\n⚽ Select players wisely - you can\'t see who scores until selected\n🔥 In overtime: first team to score more wins' },
        gameDescription: { type: String, default: 'Válaszd ki a büntetőpárbajban résztvevő játékosokat és ha győzöl megkaphatod a DVTK FanZone ajándékok egyikét' },
        playButton: { type: String, default: '🎮 PLAY' },
        
        // Result texts
        gameSubtitle: { type: String, default: '⚽Penalty Shootout Challenge' },
        playAgainButton: { type: String, default: '🎮 Play Again' },
        shareWithFriendsButton: { type: String, default: '🚀 Share with Friends' },
        shareResultTitle: { type: String, default: 'Share Your Result' },
        copyLinkButton: { type: String, default: '📋 Copy Link' },
        shareButton: { type: String, default: '📱 Share' },
        
        // Win/Loss texts
        defeatIcon: { type: String, default: '⚽😕' },
        defeatTitle: { type: String, default: 'Defeat!' },
        trialModeIndicator: { type: String, default: '👀 Trial Mode' },
        yourGoalsLabel: { type: String, default: 'Your Goals' },
        opponentGoalsLabel: { type: String, default: 'Opponent Goals' },
        visitorWinMessage: { type: String, default: '💀 VISITOR won the penalty shootout' },
        drawIcon: { type: String, default: '🎆' },
        drawMessage: { type: String, default: 'DRAW' },
        visitorPenaltyWinMessage: { type: String, default: 'VISITOR wins on penalties!' },
        victoryIcon: { type: String, default: '⚽🎆' },
        victoryTitle: { type: String, default: 'Victory! You won' },
        homeWinMessage: { type: String, default: '⚽ HOME won the penalty shootout' }
      },
      
      // Customizable colors
      colors: {
        // Background colors
        pageBackground: { type: String, default: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' },
        blockBackground: { type: String, default: 'bg-white/10 backdrop-blur-sm' },
        
        // Button colors
        primaryButton: { type: String, default: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' },
        secondaryButton: { type: String, default: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' },
        
        // Game field colors
        scoreboardCard: { type: String, default: '#000000' },
        gameField: { type: String, default: '#2ecc71' },
        playerCard: { type: String, default: '#c00000' },
        failedPenalty: { type: String, default: '#ffffff' }
      }
    },
    
    // General game settings applicable to all game types
    allowMultipleAttempts: {
      type: Boolean,
      default: true
    },
    maxAttemptsPerUser: {
      type: Number,
      default: 1,
      min: [1, 'Must allow at least 1 attempt per user'],
      max: [10, 'Cannot exceed 10 attempts per user']
    },
    requireRegistration: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function(this: Game, endDate: Date) {
          // Ensure end date is after start date if both are provided
          if (this.configuration.startDate && endDate) {
            return endDate > this.configuration.startDate
          }
          return true
        },
        message: 'End date must be after start date'
      }
    }
  },
  
  // References to target groups that can play this game
  targetGroups: [{
    type: Schema.Types.ObjectId,
    ref: 'TargetGroup'
  }],
  
  // Share links for distributing the game
  shareLinks: {
    type: [shareLinkSchema],
    default: []
  },
  
  // Creator information
  createdBy: {
    type: String,
    required: [true, 'Creator information is required'],
    trim: true
  },
  
  // Statistics fields for performance tracking
  totalParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Total participants cannot be negative']
  },
  
  totalPlays: {
    type: Number,
    default: 0,
    min: [0, 'Total plays cannot be negative']
  },
  
  // Visibility settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Optional tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'games',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and ensure uniqueness where required

// Compound index for filtering games by status and type
gameSchema.index({ status: 1, type: 1 })

// Index for creator-based queries
gameSchema.index({ createdBy: 1, createdAt: -1 })

// Index for public games discovery
gameSchema.index({ isPublic: 1, status: 1 })

// Text index for searching games by title and description
gameSchema.index({ 
  title: 'text', 
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 3
  },
  name: 'game_search_index'
})

// Index for date-based queries
gameSchema.index({ 'configuration.startDate': 1, 'configuration.endDate': 1 })

// Ensure unique short codes across all share links
gameSchema.index({ 'shareLinks.shortCode': 1 }, { 
  unique: true, 
  sparse: true // Only enforce uniqueness for non-null values
})

// Instance methods for game operations
// These methods provide business logic directly on the model instances

// Method to check if game is currently playable
gameSchema.methods.isPlayable = function(this: Game): boolean {
  const now = new Date()
  
  // Check if game is in active status
  if (this.status !== 'ACTIVE') {
    return false
  }
  
  // Check if game is within its active date range
  if (this.configuration.startDate && now < this.configuration.startDate) {
    return false
  }
  
  if (this.configuration.endDate && now > this.configuration.endDate) {
    return false
  }
  
  return true
}

// Method to generate a new share link
gameSchema.methods.generateShareLink = function(this: Game): ShareLink {
  const shortCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const shareLink: ShareLink = {
    id: new mongoose.Types.ObjectId().toString(),
    url: `${baseUrl}/play/${this._id}?ref=${shortCode}`,
    shortCode: shortCode,
    qrCodeUrl: undefined, // Will be generated later if needed
    expiresAt: undefined,
    clickCount: 0,
    isActive: true,
    createdAt: new Date()
  }
  
  this.shareLinks.push(shareLink)
  return shareLink
}

// Static methods for game queries
// These methods provide convenient ways to query games with common filters

// Find active games that can be played right now
gameSchema.statics.findPlayable = function(): Promise<Game[]> {
  const now = new Date()
  
  return this.find({
    status: 'ACTIVE',
    $and: [
      {
        $or: [
          { 'configuration.startDate': { $exists: false } },
          { 'configuration.startDate': null },
          { 'configuration.startDate': { $lte: now } }
        ]
      },
      {
        $or: [
          { 'configuration.endDate': { $exists: false } },
          { 'configuration.endDate': null },
          { 'configuration.endDate': { $gte: now } }
        ]
      }
    ]
  })
}

// Find games by creator with pagination
gameSchema.statics.findByCreator = function(
  createdBy: string, 
  page: number = 1, 
  limit: number = 10
): Promise<{ games: Game[], total: number }> {
  const skip = (page - 1) * limit
  
  const gamesPromise = this.find({ createdBy })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec()
    
  const countPromise = this.countDocuments({ createdBy })
  
  return Promise.all([gamesPromise, countPromise]).then(([games, total]) => ({
    games,
    total
  }))
}

// Pre-save middleware for data validation and processing
// This runs before every save operation to ensure data integrity

gameSchema.pre('save', function(next) {
  // Auto-generate share link if game is being activated and has no share links
  if (this.isModified('status') && this.status === 'ACTIVE' && this.shareLinks.length === 0) {
    ;(this as any).generateShareLink()
  }
  
  // Validate Stars Hexa configuration for Stars Hexa games
  if (this.type === 'STARS_HEXA') {
    if (!this.configuration.starsHexa || !this.configuration.starsHexa.hexagons || this.configuration.starsHexa.hexagons.length !== 7) {
      return next(new Error('Stars Hexa games must have exactly 7 hexagons'))
    }
    
    const starsCount = this.configuration.starsHexa.hexagons.filter(h => h.hasHiddenStar).length
    if (starsCount < 1 || starsCount > 3) {
      return next(new Error('Stars Hexa games must have between 1-3 hidden stars'))
    }
    
    // Validate maxFlipsPerAttempt
    if (this.configuration.starsHexa.maxFlipsPerAttempt && (this.configuration.starsHexa.maxFlipsPerAttempt < 3 || this.configuration.starsHexa.maxFlipsPerAttempt > 7)) {
      return next(new Error('Stars Hexa maxFlipsPerAttempt must be between 3-7'))
    }
    
    // Ensure totalStars matches actual hidden stars
    if (!this.configuration.starsHexa.totalStars || this.configuration.starsHexa.totalStars !== starsCount) {
      this.configuration.starsHexa.totalStars = starsCount
    }
  }
  
  // Validate Penalty Shootout configuration for Penalty Shootout games
  if (this.type === 'PENALTY_SHOOTOUT') {
    if (!this.configuration.penaltyShootout || !this.configuration.penaltyShootout.players || this.configuration.penaltyShootout.players.length !== 11) {
      return next(new Error('Penalty Shootout games must have exactly 11 players'))
    }
    
    const goalsCount = this.configuration.penaltyShootout.players.filter(p => p.hasGoal).length
    if (goalsCount !== 7) {
      return next(new Error('Penalty Shootout games must have exactly 7 goals and 4 misses'))
    }
    
    // Validate playersToSelect
    if (this.configuration.penaltyShootout.playersToSelect && this.configuration.penaltyShootout.playersToSelect !== 5) {
      return next(new Error('Penalty Shootout games must allow selecting exactly 5 players'))
    }
    
    // Ensure totalGoals matches actual goals
    if (!this.configuration.penaltyShootout.totalGoals || this.configuration.penaltyShootout.totalGoals !== goalsCount) {
      this.configuration.penaltyShootout.totalGoals = goalsCount
    }
  }
  
  next()
})

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let GameModel: Model<Game>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  GameModel = mongoose.model<Game>('Game')
} catch (error) {
  // Model doesn't exist yet, create it
  GameModel = mongoose.model<Game>('Game', gameSchema)
}

export default GameModel
