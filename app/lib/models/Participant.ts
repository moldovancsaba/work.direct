import mongoose, { Schema, Model } from 'mongoose'
import { Participant } from '../../types'

// Main Participant schema
// This defines the complete structure for participant documents in MongoDB
const participantSchema = new Schema<Participant>({
  name: {
    type: String,
    required: [true, 'Participant name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    sparse: true // Allow multiple documents to have null/undefined email
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{7,15}$/, 'Please provide a valid phone number'],
    sparse: true // Allow multiple documents to have null/undefined phone
  },
  
  // UUID for referral tracking (optional for backward compatibility)
  uuid: {
    type: String,
    unique: true,
    sparse: true // Allow null/undefined values temporarily for existing participants
  },
  
  // UUID of the person who referred this participant
  referrerUuid: {
    type: String,
    sparse: true // Allow null for participants without referrers
  },
  
  // References to target groups this participant belongs to
  groupIds: [{
    type: Schema.Types.ObjectId,
    ref: 'TargetGroup'
  }],
  
  // References to game results this participant has achieved
  gameResults: [{
    type: Schema.Types.ObjectId,
    ref: 'GameResult'
  }],
  
  // Statistics tracking for participant activity
  totalGamesPlayed: {
    type: Number,
    default: 0,
    min: [0, 'Total games played cannot be negative']
  },
  
  totalRewardsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Total rewards earned cannot be negative']
  },
  
  // Flexible metadata storage for additional participant information
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Status management
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Track last activity for engagement analysis
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'participants',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and ensure efficient lookups

// Unique index for email (sparse to allow nulls)
participantSchema.index({ email: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'participant_email_unique'
})

// Unique index for phone (sparse to allow nulls)
participantSchema.index({ phone: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'participant_phone_unique'
})

// Index for group membership queries
participantSchema.index({ groupIds: 1 })

// Index for active participants
participantSchema.index({ isActive: 1 })

// Index for activity-based queries
participantSchema.index({ lastActivityAt: -1, isActive: 1 })

// Compound index for name-based searches
participantSchema.index({ name: 'text' }, {
  name: 'participant_name_search'
})

// Index for statistics queries
participantSchema.index({ totalGamesPlayed: -1, totalRewardsEarned: -1 })

// Virtual fields for computed properties
// These provide convenient access to calculated values without storing them

// Virtual field to calculate participation rate
participantSchema.virtual('participationRate').get(function(this: Participant) {
  if (this.gameResults.length === 0) return 0
  // This would need additional logic to calculate actual participation rate
  // For now, return a simple calculation based on games played vs time active
  const daysSinceJoined = Math.max(1, Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
  return Math.min(100, (this.totalGamesPlayed / daysSinceJoined) * 100)
})

// Virtual field to check if participant is recently active
participantSchema.virtual('isRecentlyActive').get(function(this: Participant) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return this.lastActivityAt > sevenDaysAgo
})

// Pre-save middleware for data validation and updates
// This runs before every save operation to ensure data integrity
participantSchema.pre('save', function(next) {
  // Update lastActivityAt if this is a modification (not creation)
  if (!this.isNew) {
    this.lastActivityAt = new Date()
  }
  
  // Ensure at least one identity is provided for identification
  // WHAT: Allow guest/trial participants identified by uuid without email/phone.
  // WHY: Admin wants guest plays counted; uuid ensures uniqueness while preserving privacy.
  if (!this.email && !this.phone && !this.uuid) {
    return next(new Error('Participant must have either email, phone number, or uuid'))
  }
  
  next()
})

// Instance methods for participant operations
// These methods provide business logic directly on the model instances

// Method to update participant activity
participantSchema.methods.updateActivity = function(this: Participant): void {
  this.lastActivityAt = new Date()
}

// Method to add participant to a target group
participantSchema.methods.joinGroup = function(this: Participant, groupId: string): void {
  const groupObjectId = new mongoose.Types.ObjectId(groupId)
  
  // Check if already in group
  const alreadyInGroup = this.groupIds.some(id => id.equals(groupObjectId))
  if (!alreadyInGroup) {
    this.groupIds.push(groupObjectId)
  }
}

// Method to remove participant from a target group
participantSchema.methods.leaveGroup = function(this: Participant, groupId: string): boolean {
  const groupObjectId = new mongoose.Types.ObjectId(groupId)
  const initialLength = this.groupIds.length
  
  this.groupIds = this.groupIds.filter(id => !id.equals(groupObjectId))
  return this.groupIds.length < initialLength
}

// Method to record a new game result
participantSchema.methods.recordGameResult = function(this: Participant, gameResultId: string): void {
  const resultObjectId = new mongoose.Types.ObjectId(gameResultId)
  
  // Add to game results if not already present
  const alreadyRecorded = this.gameResults.some(id => id.equals(resultObjectId))
  if (!alreadyRecorded) {
    this.gameResults.push(resultObjectId)
    this.totalGamesPlayed += 1
    ;(this as any).updateActivity()
  }
}

// Method to increment rewards earned
participantSchema.methods.addReward = function(this: Participant, rewardCount: number = 1): void {
  this.totalRewardsEarned += rewardCount
  ;(this as any).updateActivity()
}

// Static methods for participant queries
// These methods provide convenient ways to query participants with common filters

// Find participants by group membership
participantSchema.statics.findByGroup = function(
  groupId: string,
  activeOnly: boolean = true
): Promise<Participant[]> {
  const filter: any = { groupIds: groupId }
  if (activeOnly) {
    filter.isActive = true
  }
  
  return this.find(filter)
    .sort({ lastActivityAt: -1 })
    .exec()
}

// Find participants by email or phone
participantSchema.statics.findByContact = function(
  email?: string,
  phone?: string
): Promise<Participant | null> {
  const filter: any = {}
  
  if (email && phone) {
    filter.$or = [
      { email: email.toLowerCase() },
      { phone: phone }
    ]
  } else if (email) {
    filter.email = email.toLowerCase()
  } else if (phone) {
    filter.phone = phone
  } else {
    return Promise.resolve(null)
  }
  
  return this.findOne(filter).exec()
}

// Find top participants by games played or rewards earned
participantSchema.statics.findTopParticipants = function(
  sortBy: 'games' | 'rewards' = 'games',
  limit: number = 10,
  activeOnly: boolean = true
): Promise<Participant[]> {
  const filter: any = {}
  if (activeOnly) {
    filter.isActive = true
  }
  
  const sortField = sortBy === 'games' ? 'totalGamesPlayed' : 'totalRewardsEarned'
  
  return this.find(filter)
    .sort({ [sortField]: -1, createdAt: -1 })
    .limit(limit)
    .exec()
}

// Find recently active participants
participantSchema.statics.findRecentlyActive = function(
  days: number = 7,
  limit: number = 50
): Promise<Participant[]> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  return this.find({
    lastActivityAt: { $gte: cutoffDate },
    isActive: true
  })
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .exec()
}

// Search participants by name
participantSchema.statics.searchByName = function(
  query: string,
  limit: number = 20
): Promise<Participant[]> {
  return this.find(
    { 
      $text: { $search: query },
      isActive: true
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .exec()
}

// Get participation statistics
participantSchema.statics.getParticipationStats = function(): Promise<{
  total: number,
  active: number,
  recentlyActive: number,
  totalGamesPlayed: number,
  totalRewardsEarned: number
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  return Promise.all([
    this.countDocuments({}),
    this.countDocuments({ isActive: true }),
    this.countDocuments({ lastActivityAt: { $gte: sevenDaysAgo }, isActive: true }),
    this.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalGamesPlayed' } } }
    ]),
    this.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalRewardsEarned' } } }
    ])
  ]).then(([total, active, recentlyActive, gamesResult, rewardsResult]) => ({
    total,
    active,
    recentlyActive,
    totalGamesPlayed: gamesResult[0]?.total || 0,
    totalRewardsEarned: rewardsResult[0]?.total || 0
  }))
}

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let ParticipantModel: Model<Participant>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  ParticipantModel = mongoose.model<Participant>('Participant')
} catch (error) {
  // Model doesn't exist yet, create it
  ParticipantModel = mongoose.model<Participant>('Participant', participantSchema)
}

export default ParticipantModel
