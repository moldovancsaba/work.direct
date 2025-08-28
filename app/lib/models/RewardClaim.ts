import mongoose, { Schema, Model } from 'mongoose'
import { RewardClaim, RewardStatus } from '../../types'

// Main RewardClaim schema
// This defines the complete structure for reward claim documents in MongoDB
const rewardClaimSchema = new Schema<RewardClaim>({
  // Reference to the reward being claimed
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: 'Reward',
    required: [true, 'Reward ID is required'],
    index: true
  },
  
  // Reference to the participant claiming the reward
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: [true, 'Participant ID is required'],
    index: true
  },
  
  // Reference to the game result that earned this reward
  gameResultId: {
    type: Schema.Types.ObjectId,
    ref: 'GameResult',
    required: [true, 'Game result ID is required']
  },
  
  // Status of the reward claim
  status: {
    type: String,
    required: [true, 'Claim status is required'],
    enum: {
      values: ['AVAILABLE', 'CLAIMED', 'EXPIRED', 'USED'] as RewardStatus[],
      message: 'Status must be one of: AVAILABLE, CLAIMED, EXPIRED, USED'
    },
    default: 'AVAILABLE'
  },
  
  // Timestamp when the reward was claimed by the participant
  claimedAt: {
    type: Date,
    required: [true, 'Claimed at timestamp is required'],
    default: Date.now
  },
  
  // Timestamp when the reward was actually used/redeemed
  usedAt: {
    type: Date,
    default: null
  },
  
  // Expiration date for the specific reward claim
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Unique validation code for verifying reward authenticity
  validationCode: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    minlength: [8, 'Validation code must be at least 8 characters'],
    maxlength: [64, 'Validation code cannot exceed 64 characters']
  },
  
  // Flexible metadata storage for claim-specific information
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Optional notes for administrative purposes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'rewardclaims',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and efficient lookups

// Compound index for participant-reward queries
rewardClaimSchema.index({ participantId: 1, rewardId: 1, claimedAt: -1 })

// Index for status-based queries
rewardClaimSchema.index({ status: 1, claimedAt: -1 })

// Index for expiration tracking
rewardClaimSchema.index({ expiresAt: 1, status: 1 }, { sparse: true })

// Index for validation code lookups
rewardClaimSchema.index({ validationCode: 1 }, { 
  unique: true, 
  sparse: true,
  name: 'validation_code_unique'
})

// Index for game result tracking
rewardClaimSchema.index({ gameResultId: 1 })

// Index for reward-specific queries
rewardClaimSchema.index({ rewardId: 1, status: 1, claimedAt: -1 })

// Compound index for unused rewards expiring soon
rewardClaimSchema.index({ 
  status: 1, 
  expiresAt: 1, 
  participantId: 1 
}, {
  name: 'unused_expiring_rewards'
})

// Virtual fields for computed properties
// These provide convenient access to calculated values

// Virtual field to check if claim is expired
rewardClaimSchema.virtual('isExpired').get(function(this: RewardClaim) {
  return this.expiresAt && this.expiresAt < new Date()
})

// Virtual field to check if claim is active (claimed but not used or expired)
rewardClaimSchema.virtual('isActive').get(function(this: RewardClaim) {
  return this.status === 'CLAIMED' && !(this as any).isExpired
})

// Virtual field to check if claim is pending (available but not yet claimed)
rewardClaimSchema.virtual('isPending').get(function(this: RewardClaim) {
  return this.status === 'AVAILABLE'
})

// Virtual field to get time until expiration
rewardClaimSchema.virtual('timeUntilExpiration').get(function(this: RewardClaim) {
  if (!this.expiresAt) return null
  return this.expiresAt.getTime() - Date.now()
})

// Virtual field to check if claim is expiring soon (within 24 hours)
rewardClaimSchema.virtual('isExpiringSoon').get(function(this: RewardClaim) {
  if (!this.expiresAt) return false
  const twentyFourHours = 24 * 60 * 60 * 1000
  return (this as any).timeUntilExpiration !== null && (this as any).timeUntilExpiration <= twentyFourHours
})

// Pre-save middleware for data validation and processing
// This runs before every save operation to ensure data integrity
rewardClaimSchema.pre('save', function(next) {
  // Generate validation code if not present and status is CLAIMED
  if (this.status === 'CLAIMED' && !this.validationCode) {
    this.validationCode = generateValidationCode()
  }
  
  // Set usedAt timestamp when status changes to USED
  if (this.isModified('status') && this.status === 'USED' && !this.usedAt) {
    this.usedAt = new Date()
  }
  
  // Auto-expire if past expiration date
  if (this.expiresAt && this.expiresAt < new Date() && this.status !== 'EXPIRED') {
    this.status = 'EXPIRED'
  }
  
  // Validate status transitions
  if (this.isModified('status')) {
    const validTransitions: { [key in RewardStatus]: RewardStatus[] } = {
      'AVAILABLE': ['CLAIMED', 'EXPIRED'],
      'CLAIMED': ['USED', 'EXPIRED'],
      'EXPIRED': [], // Cannot transition from expired
      'USED': [] // Cannot transition from used
    }
    
    const previousStatus = this.getChanges()?.status?.[0] as RewardStatus
    if (previousStatus && !validTransitions[previousStatus].includes(this.status)) {
      return next(new Error(`Invalid status transition from ${previousStatus} to ${this.status}`))
    }
  }
  
  next()
})

// Helper function to generate unique validation codes
// This creates a secure, unique code for reward verification
function generateValidationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar looking chars
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Instance methods for reward claim operations
// These methods provide business logic directly on the model instances

// Method to claim the reward (change status from AVAILABLE to CLAIMED)
rewardClaimSchema.methods.claim = function(this: RewardClaim): boolean {
  if (this.status !== 'AVAILABLE') {
    return false
  }
  
  if ((this as any).isExpired) {
    this.status = 'EXPIRED'
    return false
  }
  
  this.status = 'CLAIMED'
  this.claimedAt = new Date()
  return true
}

// Method to use/redeem the reward
rewardClaimSchema.methods.use = function(this: RewardClaim, notes?: string): boolean {
  if (this.status !== 'CLAIMED') {
    return false
  }
  
  if ((this as any).isExpired) {
    this.status = 'EXPIRED'
    return false
  }
  
  this.status = 'USED'
  this.usedAt = new Date()
  if (notes) {
    this.notes = notes
  }
  return true
}

// Method to expire the reward claim
rewardClaimSchema.methods.expire = function(this: RewardClaim): void {
  if (this.status !== 'USED') {
    this.status = 'EXPIRED'
  }
}

// Method to validate the reward using validation code
rewardClaimSchema.methods.validateCode = function(this: RewardClaim, code: string): boolean {
  return this.validationCode === code && this.status === 'CLAIMED' && !(this as any).isExpired
}

// Method to get claim summary information
rewardClaimSchema.methods.getSummary = function(this: RewardClaim) {
  return {
    id: this._id,
    status: this.status,
    claimedAt: this.claimedAt,
    usedAt: this.usedAt,
    expiresAt: this.expiresAt,
    validationCode: this.validationCode,
    isExpired: (this as any).isExpired,
    isActive: (this as any).isActive,
    isExpiringSoon: (this as any).isExpiringSoon,
    timeUntilExpiration: (this as any).timeUntilExpiration
  }
}

// Static methods for reward claim queries and operations
// These methods provide convenient ways to query claims with common filters

// Find claims by participant with pagination
rewardClaimSchema.statics.findByParticipant = function(
  participantId: string,
  status?: RewardStatus,
  page: number = 1,
  limit: number = 20
): Promise<{ claims: RewardClaim[], total: number }> {
  const skip = (page - 1) * limit
  const filter: any = { participantId }
  
  if (status) {
    filter.status = status
  }
  
  const claimsPromise = this.find(filter)
    .sort({ claimedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('rewardId', 'title type imageUrl')
    .populate('gameResultId', 'playedAt outcome')
    .exec()
    
  const countPromise = this.countDocuments(filter)
  
  return Promise.all([claimsPromise, countPromise]).then(([claims, total]) => ({
    claims,
    total
  }))
}

// Find claims by reward with analytics data
rewardClaimSchema.statics.findByReward = function(
  rewardId: string,
  includeAnalytics: boolean = false
): Promise<{ claims: RewardClaim[], analytics?: any }> {
  const claimsPromise = this.find({ rewardId })
    .sort({ claimedAt: -1 })
    .populate('participantId', 'name email')
    .exec()
  
  if (!includeAnalytics) {
    return claimsPromise.then((claims: RewardClaim[]) => ({ claims }))
  }
  
  const analyticsPromise = this.aggregate([
    { $match: { rewardId: new mongoose.Types.ObjectId(rewardId) } },
    {
      $group: {
        _id: null,
        totalClaims: { $sum: 1 },
        availableClaims: { $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, 1, 0] } },
        claimedRewards: { $sum: { $cond: [{ $eq: ['$status', 'CLAIMED'] }, 1, 0] } },
        usedRewards: { $sum: { $cond: [{ $eq: ['$status', 'USED'] }, 1, 0] } },
        expiredRewards: { $sum: { $cond: [{ $eq: ['$status', 'EXPIRED'] }, 1, 0] } },
        avgTimeToUse: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$usedAt', null] }, { $ne: ['$claimedAt', null] }] },
              { $subtract: ['$usedAt', '$claimedAt'] },
              null
            ]
          }
        }
      }
    }
  ])
  
  return Promise.all([claimsPromise, analyticsPromise]).then(([claims, analytics]) => ({
    claims,
    analytics: analytics[0] || {
      totalClaims: 0,
      availableClaims: 0,
      claimedRewards: 0,
      usedRewards: 0,
      expiredRewards: 0,
      avgTimeToUse: null
    }
  }))
}

// Find claims expiring soon
rewardClaimSchema.statics.findExpiringSoon = function(
  hours: number = 24,
  status: RewardStatus[] = ['AVAILABLE', 'CLAIMED']
): Promise<RewardClaim[]> {
  const futureDate = new Date(Date.now() + hours * 60 * 60 * 1000)
  
  return this.find({
    status: { $in: status },
    expiresAt: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
    .sort({ expiresAt: 1 })
    .populate('participantId', 'name email')
    .populate('rewardId', 'title type')
    .exec()
}

// Expire claims that have passed their expiration date
rewardClaimSchema.statics.expireOldClaims = function(): Promise<{ modifiedCount: number }> {
  return this.updateMany(
    {
      status: { $in: ['AVAILABLE', 'CLAIMED'] },
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'EXPIRED' }
    }
  ).then((result: any) => ({ modifiedCount: result.modifiedCount }))
}

// Find claim by validation code
rewardClaimSchema.statics.findByValidationCode = function(
  validationCode: string
): Promise<RewardClaim | null> {
  return this.findOne({ validationCode })
    .populate('rewardId', 'title type configuration')
    .populate('participantId', 'name email')
    .exec()
}

// Get claim statistics
rewardClaimSchema.statics.getClaimStats = function(
  rewardId?: string,
  participantId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalClaims: number,
  byStatus: { [key in RewardStatus]: number },
  claimRate: number,
  usageRate: number,
  avgTimeToUse: number,
  expiringSoon: number
}> {
  const filter: any = {}
  if (rewardId) filter.rewardId = rewardId
  if (participantId) filter.participantId = participantId
  if (startDate || endDate) {
    filter.claimedAt = {}
    if (startDate) filter.claimedAt.$gte = startDate
    if (endDate) filter.claimedAt.$lte = endDate
  }
  
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  
  return Promise.all([
    this.countDocuments(filter),
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    this.countDocuments({ ...filter, status: 'CLAIMED' }),
    this.countDocuments({ ...filter, status: 'USED' }),
    this.aggregate([
      {
        $match: {
          ...filter,
          status: 'USED',
          usedAt: { $ne: null },
          claimedAt: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$usedAt', '$claimedAt'] } }
        }
      }
    ]),
    this.countDocuments({
      status: { $in: ['AVAILABLE', 'CLAIMED'] },
      expiresAt: { $gte: new Date(), $lte: twentyFourHoursFromNow }
    })
  ]).then(([totalClaims, statusStats, claimedCount, usedCount, timeStats, expiringSoon]) => {
    const byStatus = statusStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count
      return acc
    }, {} as { [key in RewardStatus]: number })
    
    // Fill in missing statuses with 0
    const allStatuses: RewardStatus[] = ['AVAILABLE', 'CLAIMED', 'EXPIRED', 'USED']
    allStatuses.forEach(status => {
      if (!(status in byStatus)) {
        byStatus[status] = 0
      }
    })
    
    return {
      totalClaims,
      byStatus,
      claimRate: totalClaims > 0 ? (claimedCount / totalClaims) * 100 : 0,
      usageRate: claimedCount > 0 ? (usedCount / claimedCount) * 100 : 0,
      avgTimeToUse: timeStats[0]?.avgTime || 0,
      expiringSoon
    }
  })
}

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let RewardClaimModel: Model<RewardClaim>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  RewardClaimModel = mongoose.model<RewardClaim>('RewardClaim')
} catch (error) {
  // Model doesn't exist yet, create it
  RewardClaimModel = mongoose.model<RewardClaim>('RewardClaim', rewardClaimSchema)
}

export default RewardClaimModel
