import mongoose, { Schema, Model } from 'mongoose'
import { Reward, RewardType, RewardConfiguration } from '../../types'

// RewardConfiguration subdocument schema
// This defines the structure for different types of reward configurations
const rewardConfigurationSchema = new Schema<RewardConfiguration>({
  // Points reward configuration
  points: {
    amount: {
      type: Number,
      min: [0, 'Points amount cannot be negative']
    },
    currency: {
      type: String,
      trim: true,
      maxlength: [10, 'Currency code cannot exceed 10 characters'],
      default: 'points'
    }
  },
  
  // Coupon reward configuration
  coupon: {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: [4, 'Coupon code must be at least 4 characters'],
      maxlength: [50, 'Coupon code cannot exceed 50 characters']
    },
    discountType: {
      type: String,
      enum: {
        values: ['PERCENTAGE', 'FIXED_AMOUNT'],
        message: 'Discount type must be either PERCENTAGE or FIXED_AMOUNT'
      }
    },
    discountValue: {
      type: Number,
      min: [0, 'Discount value cannot be negative']
    },
    minOrderValue: {
      type: Number,
      min: [0, 'Minimum order value cannot be negative']
    },
    expiresAt: {
      type: Date
    }
  },
  
  // Physical prize configuration
  physicalPrize: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Prize name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Prize description cannot exceed 1000 characters']
    },
    imageUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Image URL must be a valid HTTP/HTTPS URL']
    },
    shippingRequired: {
      type: Boolean,
      default: true
    },
    estimatedValue: {
      type: Number,
      min: [0, 'Estimated value cannot be negative']
    }
  },
  
  // Custom reward configuration
  custom: {
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Custom reward title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Custom reward description cannot exceed 1000 characters']
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Instructions cannot exceed 2000 characters']
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }
}, { _id: false })

// Main Reward schema
// This defines the complete structure for reward documents in MongoDB
const rewardSchema = new Schema<Reward>({
  title: {
    type: String,
    required: [true, 'Reward title is required'],
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
    required: [true, 'Reward type is required'],
    enum: {
      values: ['POINTS', 'COUPON', 'PHYSICAL_PRIZE', 'DISCOUNT', 'CUSTOM'] as RewardType[],
      message: 'Reward type must be one of: POINTS, COUPON, PHYSICAL_PRIZE, DISCOUNT, CUSTOM'
    }
  },
  
  // Type-specific configuration
  configuration: {
    type: rewardConfigurationSchema,
    required: [true, 'Reward configuration is required']
  },
  
  // Quantity management
  totalQuantity: {
    type: Number,
    default: null, // null means unlimited
    min: [0, 'Total quantity cannot be negative']
  },
  
  remainingQuantity: {
    type: Number,
    default: null, // null means unlimited
    min: [0, 'Remaining quantity cannot be negative']
  },
  
  // Status management
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Expiration date for the reward itself
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Creator information
  createdBy: {
    type: String,
    required: [true, 'Creator information is required'],
    trim: true
  },
  
  // Visual representation
  imageUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Image URL must be a valid HTTP/HTTPS URL']
  },
  
  // Legal information
  termsAndConditions: {
    type: String,
    trim: true,
    maxlength: [5000, 'Terms and conditions cannot exceed 5000 characters']
  }
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'rewards',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and efficient lookups

// Index for type-based queries
rewardSchema.index({ type: 1, isActive: 1 })

// Index for creator-based queries
rewardSchema.index({ createdBy: 1, createdAt: -1 })

// Index for expiration tracking
rewardSchema.index({ expiresAt: 1, isActive: 1 }, { sparse: true })

// Index for quantity tracking (rewards with limited quantities)
rewardSchema.index({ remainingQuantity: 1, isActive: 1 }, { sparse: true })

// Text index for searching rewards by title and description
rewardSchema.index({ 
  title: 'text', 
  description: 'text'
}, {
  weights: {
    title: 10,
    description: 5
  },
  name: 'reward_search_index'
})

// Index for coupon code lookups
rewardSchema.index({ 'configuration.coupon.code': 1 }, { sparse: true })

// Virtual fields for computed properties
// These provide convenient access to calculated values

// Virtual field to check if reward is expired
rewardSchema.virtual('isExpired').get(function(this: Reward) {
  return this.expiresAt && this.expiresAt < new Date()
})

// Virtual field to check if reward is available (active, not expired, has quantity)
rewardSchema.virtual('isAvailable').get(function(this: Reward) {
  if (!this.isActive) return false
  if ((this as any).isExpired) return false
  if (this.remainingQuantity !== null && this.remainingQuantity !== undefined && this.remainingQuantity <= 0) return false
  return true
})

// Virtual field to get percentage of rewards claimed
rewardSchema.virtual('claimedPercentage').get(function(this: Reward) {
  if (this.totalQuantity === null || this.totalQuantity === undefined) return 0 // Unlimited rewards
  if (this.totalQuantity === 0) return 100
  const claimed = this.totalQuantity - (this.remainingQuantity || 0)
  return Math.round((claimed / this.totalQuantity) * 100)
})

// Virtual field to check if reward is running low (less than 10% remaining)
rewardSchema.virtual('isRunningLow').get(function(this: Reward) {
  if (this.totalQuantity === null) return false // Unlimited rewards
  return (this as any).claimedPercentage >= 90
})

// Pre-save middleware for data validation and processing
// This runs before every save operation to ensure data integrity
rewardSchema.pre('save', function(next) {
  // Set initial remaining quantity if not set
  if (this.isNew && this.totalQuantity !== null && this.remainingQuantity === null) {
    this.remainingQuantity = this.totalQuantity
  }
  
  // Validate remaining quantity doesn't exceed total quantity
  if (this.totalQuantity !== null && this.totalQuantity !== undefined && 
      this.remainingQuantity !== null && this.remainingQuantity !== undefined) {
    if (this.remainingQuantity > this.totalQuantity) {
      this.remainingQuantity = this.totalQuantity
    }
  }
  
  // Type-specific validation
  switch (this.type) {
    case 'POINTS':
      if (!this.configuration.points?.amount) {
        return next(new Error('Points reward must have an amount'))
      }
      break
      
    case 'COUPON':
      const coupon = this.configuration.coupon
      if (!coupon?.code || !coupon?.discountType || coupon?.discountValue === undefined) {
        return next(new Error('Coupon reward must have code, discount type, and discount value'))
      }
      
      // Validate percentage discount
      if (coupon.discountType === 'PERCENTAGE' && coupon.discountValue > 100) {
        return next(new Error('Percentage discount cannot exceed 100%'))
      }
      break
      
    case 'PHYSICAL_PRIZE':
      if (!this.configuration.physicalPrize?.name) {
        return next(new Error('Physical prize must have a name'))
      }
      break
      
    case 'CUSTOM':
      if (!this.configuration.custom?.title) {
        return next(new Error('Custom reward must have a title'))
      }
      break
  }
  
  next()
})

// Instance methods for reward operations
// These methods provide business logic directly on the model instances

// Method to claim a reward (reduce quantity)
rewardSchema.methods.claim = function(this: Reward, quantity: number = 1): boolean {
  // Check if reward is available
  if (!(this as any).isAvailable) {
    return false
  }
  
  // Check if we have enough quantity
  if (this.remainingQuantity !== null && this.remainingQuantity !== undefined) {
    if (this.remainingQuantity < quantity) {
      return false
    }
    this.remainingQuantity -= quantity
  }
  
  return true
}

// Method to restore claimed rewards (e.g., if claim was invalid)
rewardSchema.methods.restore = function(this: Reward, quantity: number = 1): void {
  if (this.remainingQuantity !== null && this.remainingQuantity !== undefined) {
    this.remainingQuantity = Math.min(
      this.remainingQuantity + quantity,
      this.totalQuantity || this.remainingQuantity + quantity
    )
  }
}

// Method to check if reward can be claimed
rewardSchema.methods.canBeClaimed = function(this: Reward, quantity: number = 1): boolean {
  if (!(this as any).isAvailable) return false
  if (this.remainingQuantity === null || this.remainingQuantity === undefined) return true // Unlimited
  return this.remainingQuantity >= quantity
}

// Method to get reward display information
rewardSchema.methods.getDisplayInfo = function(this: Reward) {
  const baseInfo = {
    title: this.title,
    description: this.description,
    type: this.type,
    imageUrl: this.imageUrl,
    isAvailable: (this as any).isAvailable
  }
  
  switch (this.type) {
    case 'POINTS':
      return {
        ...baseInfo,
        value: `${this.configuration.points?.amount || 0} ${this.configuration.points?.currency || 'points'}`
      }
      
    case 'COUPON':
      const coupon = this.configuration.coupon
      const discountText = coupon?.discountType === 'PERCENTAGE' 
        ? `${coupon.discountValue}% off`
        : `$${coupon?.discountValue} off`
      return {
        ...baseInfo,
        value: discountText,
        code: coupon?.code,
        expiresAt: coupon?.expiresAt
      }
      
    case 'PHYSICAL_PRIZE':
      const prize = this.configuration.physicalPrize
      return {
        ...baseInfo,
        value: prize?.estimatedValue ? `$${prize.estimatedValue}` : 'Prize',
        shippingRequired: prize?.shippingRequired
      }
      
    case 'CUSTOM':
      return {
        ...baseInfo,
        value: this.configuration.custom?.title,
        instructions: this.configuration.custom?.instructions
      }
      
    default:
      return baseInfo
  }
}

// Static methods for reward queries
// These methods provide convenient ways to query rewards with common filters

// Find available rewards by type
rewardSchema.statics.findAvailable = function(
  type?: RewardType,
  limit: number = 20
): Promise<Reward[]> {
  const filter: any = {
    isActive: true,
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      },
      {
        $or: [
          { remainingQuantity: null },
          { remainingQuantity: { $gt: 0 } }
        ]
      }
    ]
  }
  
  if (type) {
    filter.type = type
  }
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec()
}

// Find rewards by creator with pagination
rewardSchema.statics.findByCreator = function(
  createdBy: string,
  page: number = 1,
  limit: number = 10
): Promise<{ rewards: Reward[], total: number }> {
  const skip = (page - 1) * limit
  
  const rewardsPromise = this.find({ createdBy })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec()
    
  const countPromise = this.countDocuments({ createdBy })
  
  return Promise.all([rewardsPromise, countPromise]).then(([rewards, total]) => ({
    rewards,
    total
  }))
}

// Find rewards expiring soon
rewardSchema.statics.findExpiringSoon = function(
  days: number = 7
): Promise<Reward[]> {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  
  return this.find({
    isActive: true,
    expiresAt: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
    .sort({ expiresAt: 1 })
    .exec()
}

// Find rewards running low on quantity
rewardSchema.statics.findRunningLow = function(
  threshold: number = 10 // percentage
): Promise<Reward[]> {
  return this.find({
    isActive: true,
    totalQuantity: { $ne: null },
    $expr: {
      $gte: [
        { $divide: [
          { $subtract: ['$totalQuantity', '$remainingQuantity'] },
          '$totalQuantity'
        ]},
        threshold / 100
      ]
    }
  })
    .sort({ remainingQuantity: 1 })
    .exec()
}

// Search rewards by text
rewardSchema.statics.searchRewards = function(
  query: string,
  type?: RewardType,
  activeOnly: boolean = true,
  limit: number = 20
): Promise<Reward[]> {
  const filter: any = {
    $text: { $search: query }
  }
  
  if (type) {
    filter.type = type
  }
  
  if (activeOnly) {
    filter.isActive = true
  }
  
  return this.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .exec()
}

// Get reward statistics
rewardSchema.statics.getRewardStats = function(createdBy?: string): Promise<{
  total: number,
  active: number,
  byType: { [key in RewardType]: number },
  totalQuantity: number,
  claimedQuantity: number,
  expiringSoon: number
}> {
  const filter: any = {}
  if (createdBy) {
    filter.createdBy = createdBy
  }
  
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  
  return Promise.all([
    this.countDocuments(filter),
    this.countDocuments({ ...filter, isActive: true }),
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { ...filter, totalQuantity: { $ne: null } } },
      { $group: { _id: null, total: { $sum: '$totalQuantity' } } }
    ]),
    this.aggregate([
      { $match: { ...filter, totalQuantity: { $ne: null }, remainingQuantity: { $ne: null } } },
      { $group: { _id: null, claimed: { $sum: { $subtract: ['$totalQuantity', '$remainingQuantity'] } } } }
    ]),
    this.countDocuments({
      ...filter,
      isActive: true,
      expiresAt: { $gte: new Date(), $lte: sevenDaysFromNow }
    })
  ]).then(([total, active, typeStats, quantityStats, claimedStats, expiring]) => ({
    total,
    active,
    byType: typeStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count
      return acc
    }, {} as { [key in RewardType]: number }),
    totalQuantity: quantityStats[0]?.total || 0,
    claimedQuantity: claimedStats[0]?.claimed || 0,
    expiringSoon: expiring
  }))
}

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let RewardModel: Model<Reward>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  RewardModel = mongoose.model<Reward>('Reward')
} catch (error) {
  // Model doesn't exist yet, create it
  RewardModel = mongoose.model<Reward>('Reward', rewardSchema)
}

export default RewardModel
