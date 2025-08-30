import mongoose, { Schema, Model } from 'mongoose'
import { Game, GameType, GameStatus, HexagonCard, WheelSegment, ShareLink } from '../../types'

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

// WheelSegment subdocument schema
// This defines the structure for individual wheel segments in Wheel of Fortune games
const wheelSegmentSchema = new Schema<WheelSegment>({
  id: {
    type: String,
    required: [true, 'Wheel segment ID is required'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Wheel segment label is required'],
    trim: true,
    maxlength: [100, 'Segment label cannot exceed 100 characters']
  },
  color: {
    type: String,
    required: [true, 'Segment color is required'],
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  probability: {
    type: Number,
    min: [0, 'Probability cannot be negative'],
    max: [1, 'Probability cannot exceed 1'],
    default: null
  },
  rewardId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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
      values: ['STARS_HEXA', '💰🌪️🍀', 'SCRATCH_CARD', 'QUIZ', 'POLL'] as GameType[],
      message: 'Game type must be one of: STARS_HEXA, 💰🌪️🍀, SCRATCH_CARD, QUIZ, POLL'
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
    
    // Wheel of Fortune specific configuration
    wheelOfFortune: {
      segments: {
        type: [wheelSegmentSchema]
        // Validation handled in pre-save middleware
      },
      spins: {
        type: Number,
        default: 8
        // Validation handled in pre-save middleware
      },
      durationMs: {
        type: Number,
        default: 4500
        // Validation handled in pre-save middleware
      },
      pointerAt: {
        type: String,
        enum: ['top', 'right'],
        default: 'top'
      },
      size: {
        type: Number,
        default: 520
        // Validation handled in pre-save middleware
      },
      theme: {
        type: String,
        enum: ['default', 'colorful', 'minimal'],
        default: 'default'
      },
      allowImmediateReplay: {
        type: Boolean,
        default: false
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
  
  // Validate Wheel of Fortune configuration for Wheel of Fortune games
  if (this.type === '💰🌪️🍀') {
    if (!this.configuration.wheelOfFortune || !this.configuration.wheelOfFortune.segments || this.configuration.wheelOfFortune.segments.length < 2) {
      return next(new Error('Wheel of Fortune games must have at least 2 segments'))
    }
    
    if (this.configuration.wheelOfFortune.segments.length > 12) {
      return next(new Error('Wheel of Fortune games cannot have more than 12 segments'))
    }
    
    const hasEmptyLabels = this.configuration.wheelOfFortune.segments.some(s => !s.label || s.label.trim().length === 0)
    if (hasEmptyLabels) {
      return next(new Error('All wheel segments must have non-empty labels'))
    }
    
    // Validate wheel configuration
    if (this.configuration.wheelOfFortune.spins && (this.configuration.wheelOfFortune.spins < 3 || this.configuration.wheelOfFortune.spins > 15)) {
      return next(new Error('Wheel spins must be between 3-15'))
    }
    
    if (this.configuration.wheelOfFortune.durationMs && (this.configuration.wheelOfFortune.durationMs < 2000 || this.configuration.wheelOfFortune.durationMs > 10000)) {
      return next(new Error('Wheel duration must be between 2-10 seconds'))
    }
    
    if (this.configuration.wheelOfFortune.size && (this.configuration.wheelOfFortune.size < 300 || this.configuration.wheelOfFortune.size > 800)) {
      return next(new Error('Wheel size must be between 300-800 pixels'))
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
