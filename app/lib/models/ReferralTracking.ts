import mongoose, { Schema, Model } from 'mongoose'
import { ReferralTracking, ReferralEventType, ReferralStatus } from '../../types'

/**
 * ReferralTracking Model (v4.10.0)
 * 
 * WHAT: Tracks individual referral links and their conversion lifecycle
 * WHY: Enable viral growth with complete attribution and analytics
 * 
 * This model stores:
 * - Referral link clicks and conversions
 * - Multi-event tracking (click, signup, first game, win, reward)
 * - Reward attribution and payout tracking
 * - Fraud detection data (IP, user agent, suspicious patterns)
 * - Campaign association and analytics
 */

// Event subdocument schema
// WHAT: Individual trackable events in referral lifecycle
// WHY: Complete attribution and conversion funnel analysis
const referralEventSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: {
      values: ['CLICK', 'SIGNUP', 'FIRST_GAME', 'GAME_WIN', 'REWARD_CLAIM'] as ReferralEventType[],
      message: 'Event type must be one of: CLICK, SIGNUP, FIRST_GAME, GAME_WIN, REWARD_CLAIM'
    }
  },
  timestamp: {
    type: Date,
    required: [true, 'Event timestamp is required'],
    default: Date.now
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false })

// Main ReferralTracking schema
const referralTrackingSchema = new Schema<ReferralTracking>({
  // Referrer identification
  // WHAT: UUID of participant who created the referral link
  // WHY: Track who is driving growth and attribute rewards correctly
  referrerUuid: {
    type: String,
    required: [true, 'Referrer UUID is required'],
    trim: true,
    index: true
  },
  
  // Referred person identification
  // WHAT: UUID and participant ID of person who clicked and converted
  // WHY: Track conversion and prevent duplicate counting
  referredUuid: {
    type: String,
    trim: true,
    index: true,
    sparse: true // Only index non-null values
  },
  
  referredParticipantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    index: true,
    sparse: true
  },
  
  // Game context (optional)
  // WHAT: Specific game being shared
  // WHY: Game-specific referral campaigns and analytics
  gameId: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    index: true,
    sparse: true
  },
  
  // Unique referral code
  // WHAT: Short tracking code (e.g., 6F3WDVU2) appended to URLs
  // WHY: Easy sharing and unique attribution
  referralCode: {
    type: String,
    required: [true, 'Referral code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [6, 'Referral code must be at least 6 characters'],
    maxlength: [12, 'Referral code cannot exceed 12 characters'],
    index: true
  },
  
  // Referral lifecycle status
  // WHAT: Current state of referral (pending, converted, rewarded, expired)
  // WHY: Track conversion funnel and trigger reward payouts
  status: {
    type: String,
    required: [true, 'Referral status is required'],
    enum: {
      values: ['PENDING', 'CONVERTED', 'REWARDED', 'EXPIRED'] as ReferralStatus[],
      message: 'Status must be one of: PENDING, CONVERTED, REWARDED, EXPIRED'
    },
    default: 'PENDING',
    index: true
  },
  
  // Event timeline
  // WHAT: Array of all events in referral lifecycle
  // WHY: Complete attribution, conversion analysis, and fraud detection
  events: {
    type: [referralEventSchema],
    default: []
  },
  
  // Analytics metrics
  // WHAT: Click count for this referral link
  // WHY: Measure shareability and viral coefficient
  clickCount: {
    type: Number,
    default: 0,
    min: [0, 'Click count cannot be negative']
  },
  
  conversionDate: {
    type: Date,
    index: true
  },
  
  firstGameDate: {
    type: Date
  },
  
  // Reward tracking
  // WHAT: Track reward payout to referrer
  // WHY: Prevent double-rewards and measure ROI of referral program
  rewardEarned: {
    type: Boolean,
    default: false,
    index: true
  },
  
  rewardAmount: {
    type: Number,
    min: [0, 'Reward amount cannot be negative']
  },
  
  rewardClaimedAt: {
    type: Date
  },
  
  // Sharing context
  // WHAT: Where and how the link was shared
  // WHY: Optimize channel mix and detect fraud patterns
  source: {
    type: String,
    enum: ['whatsapp', 'facebook', 'twitter', 'email', 'copy', 'other'],
    trim: true,
    lowercase: true
  },
  
  // Fraud detection
  // WHAT: IP address and user agent of referral click
  // WHY: Detect and prevent self-referrals and bot abuse
  ipAddress: {
    type: String,
    trim: true
  },
  
  userAgent: {
    type: String,
    trim: true,
    maxlength: [1000, 'User agent cannot exceed 1000 characters']
  },
  
  // Campaign expiration
  // WHAT: Optional time limit for referral validity
  // WHY: Support time-limited viral campaigns
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'referraltrackings'
})

// Indexes for optimal query performance
// WHAT: Compound and single-field indexes for common query patterns
// WHY: Fast lookups for referral analytics and fraud detection

// Index: Find all referrals by referrer (leaderboard, user dashboard)
referralTrackingSchema.index({ referrerUuid: 1, createdAt: -1 })

// Index: Find referral by code (link click attribution)
// Already unique index on referralCode field

// Index: Find pending conversions (reward payout jobs)
referralTrackingSchema.index({ status: 1, rewardEarned: 1 })

// Index: Fraud detection (multiple referrals from same IP)
referralTrackingSchema.index({ ipAddress: 1, createdAt: -1 })

// Index: Campaign analytics (by game and date range)
referralTrackingSchema.index({ gameId: 1, createdAt: -1 })

// Index: Conversion funnel analysis
referralTrackingSchema.index({ status: 1, conversionDate: -1 })

// Index: Expired referrals cleanup job
referralTrackingSchema.index({ expiresAt: 1 }, { sparse: true })

// Virtual fields

// WHAT: Check if referral link is expired
// WHY: Easy expiration validation in application logic
referralTrackingSchema.virtual('isExpired').get(function(this: ReferralTracking) {
  if (!this.expiresAt) return false
  return new Date() > this.expiresAt
})

// WHAT: Check if referral has converted
// WHY: Simplified conversion checking
referralTrackingSchema.virtual('isConverted').get(function(this: ReferralTracking) {
  return this.status === 'CONVERTED' || this.status === 'REWARDED'
})

// Instance methods

/**
 * Add event to referral timeline
 * WHAT: Records a new event in the referral lifecycle
 * WHY: Complete attribution tracking
 */
referralTrackingSchema.methods.addEvent = function(
  this: ReferralTracking,
  type: ReferralEventType,
  metadata?: Record<string, any>
): void {
  this.events.push({
    type,
    timestamp: new Date(),
    metadata: metadata || {}
  })
}

/**
 * Mark referral as converted
 * WHAT: Updates status and conversion date when referred user signs up
 * WHY: Trigger reward payout and analytics
 */
referralTrackingSchema.methods.markConverted = function(
  this: ReferralTracking,
  referredUuid: string,
  participantId: string
): void {
  this.status = 'CONVERTED'
  this.referredUuid = referredUuid
  this.referredParticipantId = new mongoose.Types.ObjectId(participantId)
  this.conversionDate = new Date()
  // WHAT: Use type assertion to call instance method
  // WHY: TypeScript doesn't recognize Mongoose instance methods on 'this'
  ;(this as any).addEvent('SIGNUP', { referredUuid, participantId })
}

/**
 * Mark referral as rewarded
 * WHAT: Updates status and reward fields when payout is issued
 * WHY: Prevent double-rewards and track program ROI
 */
referralTrackingSchema.methods.markRewarded = function(
  this: ReferralTracking,
  amount: number
): void {
  this.status = 'REWARDED'
  this.rewardEarned = true
  this.rewardAmount = amount
  this.rewardClaimedAt = new Date()
  // WHAT: Use type assertion to call instance method
  // WHY: TypeScript doesn't recognize Mongoose instance methods on 'this'
  ;(this as any).addEvent('REWARD_CLAIM', { amount })
}

// Static methods for analytics and queries

/**
 * Get referral stats for a user
 * WHAT: Aggregate referral performance metrics
 * WHY: User dashboard and leaderboard display
 */
referralTrackingSchema.statics.getUserStats = async function(
  referrerUuid: string
): Promise<{
  totalReferrals: number
  pendingReferrals: number
  convertedReferrals: number
  totalClicks: number
  totalRewardsEarned: number
  conversionRate: number
}> {
  const referrals = await this.find({ referrerUuid })
  
  const stats = {
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter((r: any) => r.status === 'PENDING').length,
    convertedReferrals: referrals.filter((r: any) => r.status === 'CONVERTED' || r.status === 'REWARDED').length,
    totalClicks: referrals.reduce((sum: number, r: any) => sum + r.clickCount, 0),
    totalRewardsEarned: referrals.reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0),
    conversionRate: 0
  }
  
  stats.conversionRate = stats.totalClicks > 0
    ? (stats.convertedReferrals / stats.totalClicks * 100)
    : 0
  
  return stats
}

/**
 * Find referral by code
 * WHAT: Look up referral tracking by unique code
 * WHY: Attribution when user clicks referral link
 */
referralTrackingSchema.statics.findByCode = function(
  code: string
): Promise<ReferralTracking | null> {
  return this.findOne({ referralCode: code.toUpperCase() })
}

/**
 * Detect suspicious referral patterns
 * WHAT: Check for potential fraud (self-referrals, bot abuse)
 * WHY: Protect referral program integrity
 */
referralTrackingSchema.statics.detectFraud = async function(
  referrerUuid: string,
  ipAddress?: string
): Promise<{ suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = []
  
  // Check for excessive referrals from same IP
  if (ipAddress) {
    const sameIpCount = await this.countDocuments({
      referrerUuid,
      ipAddress,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
    })
    
    if (sameIpCount >= 5) {
      reasons.push('Multiple referrals from same IP in 24h')
    }
  }
  
  // Check for rapid-fire referral creation
  const recentReferrals = await this.find({
    referrerUuid,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1h
  })
  
  if (recentReferrals.length >= 20) {
    reasons.push('Excessive referral creation rate')
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons
  }
}

// Pre-save middleware
// WHAT: Validate and process before saving
// WHY: Data integrity and business rule enforcement
referralTrackingSchema.pre('save', function(next) {
  // Auto-expire old pending referrals (90 days)
  if (this.status === 'PENDING' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
  
  next()
})

// Export model
const ReferralTrackingModel = (mongoose.models.ReferralTracking as Model<ReferralTracking>) || 
  mongoose.model<ReferralTracking>('ReferralTracking', referralTrackingSchema)

export default ReferralTrackingModel
