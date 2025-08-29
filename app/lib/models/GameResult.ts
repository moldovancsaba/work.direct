import mongoose, { Schema, Model } from 'mongoose'
import { GameResult, GameOutcome, GameOutcomeType } from '../../types'

// GameOutcome subdocument schema
// This defines the structure for individual game outcome data
const gameOutcomeSchema = new Schema<GameOutcome>({
  type: {
    type: String,
    required: [true, 'Outcome type is required'],
    enum: {
      values: ['WIN', 'LOSE', 'NO_REWARD'] as GameOutcomeType[],
      message: 'Outcome type must be one of: WIN, LOSE, NO_REWARD'
    }
  },
  
  hexagonId: {
    type: String,
    default: null // For Stars Hexa games - which hexagon was revealed
  },
  
  starsFound: {
    type: Number,
    default: 0,
    min: [0, 'Stars found cannot be negative']
  },
  
  totalStarsInGame: {
    type: Number,
    default: 0,
    min: [0, 'Total stars cannot be negative']
  },
  
  foundAllStars: {
    type: Boolean,
    default: false
  },
  
  value: {
    type: Schema.Types.Mixed, // Can be string or number
    default: null
  },
  
  rewardIds: [{
    type: String,
    default: []
  }],
  
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  }
}, { _id: false })

// Main GameResult schema
// This defines the complete structure for game result documents in MongoDB
const gameResultSchema = new Schema<GameResult>({
  // Reference to the game that was played
  gameId: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'Game ID is required'],
    index: true
  },
  
  // Reference to the participant who played
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: [true, 'Participant ID is required'],
    index: true
  },
  
  // The outcome of the game play
  outcome: {
    type: gameOutcomeSchema,
    required: [true, 'Game outcome is required']
  },
  
  // Timestamp when the game was played
  playedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'Played at timestamp is required']
  },
  
  // IP address for anti-cheat tracking
  ipAddress: {
    type: String,
    trim: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address format']
  },
  
  // User agent for device tracking
  userAgent: {
    type: String,
    trim: true,
    maxlength: [1000, 'User agent cannot exceed 1000 characters']
  },
  
  // Geographic location data (optional)
  location: {
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function(coordinates: number[]) {
          if (!coordinates || coordinates.length !== 2) return false
          const [lng, lat] = coordinates
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
        },
        message: 'Coordinates must be in format [longitude, latitude] with valid ranges'
      }
    }
  },
  
  // Session identifier for tracking multiple plays in same session
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    trim: true,
    minlength: [8, 'Session ID must be at least 8 characters'],
    maxlength: [128, 'Session ID cannot exceed 128 characters']
  },
  
  // Validation flag for anti-cheat verification
  isValidated: {
    type: Boolean,
    default: false
  }
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'gameresults',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and analytics queries

// Compound index for game-participant queries
gameResultSchema.index({ gameId: 1, participantId: 1, playedAt: -1 })

// Index for time-based analytics
gameResultSchema.index({ playedAt: -1, gameId: 1 })

// Index for participant history
gameResultSchema.index({ participantId: 1, playedAt: -1 })

// Index for session tracking (anti-cheat)
gameResultSchema.index({ sessionId: 1, ipAddress: 1 })

// Index for outcome type analytics
gameResultSchema.index({ 'outcome.type': 1, gameId: 1 })

// Index for reward tracking
gameResultSchema.index({ 'outcome.rewardIds': 1, isValidated: 1 })

// Compound index for anti-cheat queries
gameResultSchema.index({ 
  ipAddress: 1, 
  gameId: 1, 
  playedAt: -1 
}, {
  name: 'anticheat_tracking_index'
})

// Geospatial index for location-based queries (2dsphere for modern geo queries)
gameResultSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true })

// Virtual fields for computed properties
// These provide convenient access to calculated values

// Virtual field to check if result includes rewards
gameResultSchema.virtual('hasRewards').get(function(this: GameResult) {
  return this.outcome.rewardIds && this.outcome.rewardIds.length > 0
})

// Virtual field to get time since played
gameResultSchema.virtual('timeSincePlayed').get(function(this: GameResult) {
  return Date.now() - this.playedAt.getTime()
})

// Virtual field to check if played recently (within 1 hour)
gameResultSchema.virtual('isRecentPlay').get(function(this: GameResult) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return this.playedAt > oneHourAgo
})

// Pre-save middleware for data validation and processing
// This runs before every save operation to ensure data integrity
gameResultSchema.pre('save', function(next) {
  // Ensure coordinates are properly formatted if provided
  if (this.location && this.location.coordinates) {
    // Round coordinates to 6 decimal places for consistency
    this.location.coordinates = this.location.coordinates.map(coord => 
      Math.round(coord * 1000000) / 1000000
    ) as [number, number]
  }
  
  // Note: Allowing WIN outcomes without reward IDs for simple point-based wins
  // In production, you might want actual rewards linked to segments
  // if (this.outcome.type === 'WIN' && (!this.outcome.rewardIds || this.outcome.rewardIds.length === 0)) {
  //   return next(new Error('WIN outcomes must have at least one reward ID'))
  // }
  
  // Ensure NO_REWARD outcomes don't have reward IDs
  if (this.outcome.type === 'NO_REWARD' && this.outcome.rewardIds && this.outcome.rewardIds.length > 0) {
    this.outcome.rewardIds = []
  }
  
  next()
})

// Instance methods for game result operations
// These methods provide business logic directly on the model instances

// Method to validate the game result (anti-cheat verification)
gameResultSchema.methods.validateResult = function(this: GameResult): void {
  this.isValidated = true
}

// Method to invalidate the game result (if cheat detected)
gameResultSchema.methods.invalidate = function(this: GameResult): void {
  this.isValidated = false
}

// Method to check if result is suspicious based on timing
gameResultSchema.methods.isSuspicious = async function(this: GameResult): Promise<boolean> {
  const GameResultModel = this.constructor as Model<GameResult>
  
  // Check for multiple plays from same IP in short time
  const recentPlaysFromSameIP = await GameResultModel.countDocuments({
    ipAddress: this.ipAddress,
    gameId: this.gameId,
    playedAt: {
      $gte: new Date(this.playedAt.getTime() - 5 * 60 * 1000) // 5 minutes before
    },
    _id: { $ne: this._id } // Exclude current result
  })
  
  return recentPlaysFromSameIP >= 3 // Suspicious if 3+ plays from same IP in 5 minutes
}

// Static methods for game result queries and analytics
// These methods provide convenient ways to query results with common filters

// Get results for a specific game with pagination
gameResultSchema.statics.findByGame = function(
  gameId: string,
  page: number = 1,
  limit: number = 50,
  validatedOnly: boolean = true
): Promise<{ results: GameResult[], total: number }> {
  const skip = (page - 1) * limit
  const filter: any = { gameId }
  
  if (validatedOnly) {
    filter.isValidated = true
  }
  
  const resultsPromise = this.find(filter)
    .sort({ playedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('participantId', 'name email')
    .exec()
    
  const countPromise = this.countDocuments(filter)
  
  return Promise.all([resultsPromise, countPromise]).then(([results, total]) => ({
    results,
    total
  }))
}

// Get results for a specific participant
gameResultSchema.statics.findByParticipant = function(
  participantId: string,
  gameId?: string,
  limit: number = 20
): Promise<GameResult[]> {
  const filter: any = { participantId, isValidated: true }
  if (gameId) {
    filter.gameId = gameId
  }
  
  return this.find(filter)
    .sort({ playedAt: -1 })
    .limit(limit)
    .populate('gameId', 'title type')
    .exec()
}

// Get game analytics data
gameResultSchema.statics.getGameAnalytics = function(
  gameId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalPlays: number,
  uniqueParticipants: number,
  winRate: number,
  rewardDistribution: { [key: string]: number },
  playsByDay: { date: string, count: number }[]
}> {
  const filter: any = { gameId, isValidated: true }
  
  if (startDate || endDate) {
    filter.playedAt = {}
    if (startDate) filter.playedAt.$gte = startDate
    if (endDate) filter.playedAt.$lte = endDate
  }
  
  return Promise.all([
    // Total plays
    this.countDocuments(filter),
    
    // Unique participants
    this.distinct('participantId', filter),
    
    // Win rate calculation
    this.countDocuments({ ...filter, 'outcome.type': 'WIN' }),
    
    // Reward distribution
    this.aggregate([
      { $match: filter },
      { $unwind: '$outcome.rewardIds' },
      { $group: { _id: '$outcome.rewardIds', count: { $sum: 1 } } }
    ]),
    
    // Plays by day
    this.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$playedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ])
  ]).then(([totalPlays, uniqueParticipants, winCount, rewards, dailyPlays]) => ({
    totalPlays,
    uniqueParticipants: uniqueParticipants.length,
    winRate: totalPlays > 0 ? (winCount / totalPlays) * 100 : 0,
    rewardDistribution: rewards.reduce((acc: any, item: any) => {
      acc[item._id] = item.count
      return acc
    }, {}),
    playsByDay: dailyPlays.map((item: any) => ({
      date: item._id,
      count: item.count
    }))
  }))
}

// Find suspicious activity patterns
gameResultSchema.statics.findSuspiciousActivity = function(
  gameId?: string,
  hours: number = 24
): Promise<{
  multipleIPPlays: GameResult[],
  rapidFirePlays: GameResult[],
  identicalSessions: GameResult[]
}> {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000)
  const baseFilter: any = { 
    playedAt: { $gte: cutoffDate }
  }
  
  if (gameId) {
    baseFilter.gameId = gameId
  }
  
  return Promise.all([
    // Multiple plays from same IP
    this.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$ipAddress', count: { $sum: 1 }, results: { $push: '$$ROOT' } } },
      { $match: { count: { $gte: 5 } } },
      { $unwind: '$results' },
      { $replaceRoot: { newRoot: '$results' } }
    ]),
    
    // Rapid fire plays (less than 10 seconds between plays)
    this.find(baseFilter).sort({ participantId: 1, playedAt: 1 }).then((results: GameResult[]) => {
      const rapidPlays: GameResult[] = []
      for (let i = 1; i < results.length; i++) {
        const timeDiff = results[i].playedAt.getTime() - results[i-1].playedAt.getTime()
        if (results[i].participantId.equals(results[i-1].participantId) && timeDiff < 10000) {
          rapidPlays.push(results[i])
        }
      }
      return rapidPlays
    }),
    
    // Identical session IDs from different IPs (potential session hijacking)
    this.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$sessionId', ips: { $addToSet: '$ipAddress' }, results: { $push: '$$ROOT' } } },
      { $match: { 'ips.1': { $exists: true } } }, // More than one IP
      { $unwind: '$results' },
      { $replaceRoot: { newRoot: '$results' } }
    ])
  ]).then(([multipleIPPlays, rapidFirePlays, identicalSessions]) => ({
    multipleIPPlays,
    rapidFirePlays,
    identicalSessions
  }))
}

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let GameResultModel: Model<GameResult>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  GameResultModel = mongoose.model<GameResult>('GameResult')
} catch (error) {
  // Model doesn't exist yet, create it
  GameResultModel = mongoose.model<GameResult>('GameResult', gameResultSchema)
}

export default GameResultModel
