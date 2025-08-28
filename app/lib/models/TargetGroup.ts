import mongoose, { Schema, Model } from 'mongoose'
import { TargetGroup, GroupMember } from '../../types'

// GroupMember subdocument schema
// This defines the structure for individual members within a target group
const groupMemberSchema = new Schema<GroupMember>({
  id: {
    type: String,
    required: [true, 'Member ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{7,15}$/, 'Please provide a valid phone number']
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false })

// Main TargetGroup schema
// This defines the complete structure for target group documents in MongoDB
const targetGroupSchema = new Schema<TargetGroup>({
  name: {
    type: String,
    required: [true, 'Target group name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Array of group members with embedded documents
  members: {
    type: [groupMemberSchema],
    default: [],
    validate: {
      validator: function(members: GroupMember[]) {
        // Ensure unique member IDs within the group
        const memberIds = members.map(m => m.id)
        return memberIds.length === new Set(memberIds).size
      },
      message: 'Member IDs must be unique within the group'
    }
  },
  
  // References to games that this group can participate in
  games: [{
    type: Schema.Types.ObjectId,
    ref: 'Game'
  }],
  
  // Creator information
  createdBy: {
    type: String,
    required: [true, 'Creator information is required'],
    trim: true
  },
  
  // Status management
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Optional tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Calculated field for member count (virtual field)
  memberCount: {
    type: Number,
    default: 0,
    min: [0, 'Member count cannot be negative']
  }
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'targetgroups',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and ensure efficient lookups

// Index for creator-based queries
targetGroupSchema.index({ createdBy: 1, createdAt: -1 })

// Index for active groups
targetGroupSchema.index({ isActive: 1 })

// Text index for searching groups by name and description
targetGroupSchema.index({ 
  name: 'text', 
  description: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    description: 5,
    tags: 3
  },
  name: 'targetgroup_search_index'
})

// Index for member email lookups (sparse index for optional field)
targetGroupSchema.index({ 'members.email': 1 }, { sparse: true })

// Index for member ID lookups
targetGroupSchema.index({ 'members.id': 1 })

// Virtual field to automatically calculate member count
// This provides a convenient way to get the current member count without manual updates
targetGroupSchema.virtual('activeMemberCount').get(function(this: TargetGroup) {
  return this.members.filter(member => member.isActive).length
})

// Pre-save middleware to update member count
// This ensures the memberCount field is always accurate before saving
targetGroupSchema.pre('save', function(next) {
  // Update member count based on active members
  this.memberCount = this.members.filter(member => member.isActive).length
  next()
})

// Instance methods for target group operations
// These methods provide business logic directly on the model instances

// Method to add a new member to the group
targetGroupSchema.methods.addMember = function(this: TargetGroup, memberData: Omit<GroupMember, 'id' | 'joinedAt'>): GroupMember {
  // Generate unique ID for new member
  const memberId = new mongoose.Types.ObjectId().toString()
  
  const newMember: GroupMember = {
    id: memberId,
    ...memberData,
    joinedAt: new Date(),
    isActive: true
  }
  
  // Check for duplicate email if provided
  if (newMember.email) {
    const existingMember = this.members.find(m => 
      m.email && m.email.toLowerCase() === newMember.email!.toLowerCase()
    )
    if (existingMember) {
      throw new Error('A member with this email already exists in the group')
    }
  }
  
  this.members.push(newMember)
  return newMember
}

// Method to remove a member from the group (soft delete)
targetGroupSchema.methods.removeMember = function(this: TargetGroup, memberId: string): boolean {
  const member = this.members.find(m => m.id === memberId)
  if (!member) {
    return false
  }
  
  // Soft delete by setting isActive to false
  member.isActive = false
  return true
}

// Method to get active members only
targetGroupSchema.methods.getActiveMembers = function(this: TargetGroup): GroupMember[] {
  return this.members.filter(member => member.isActive)
}

// Static methods for target group queries
// These methods provide convenient ways to query target groups with common filters

// Find groups by creator with pagination
targetGroupSchema.statics.findByCreator = function(
  createdBy: string, 
  page: number = 1, 
  limit: number = 10
): Promise<{ groups: TargetGroup[], total: number }> {
  const skip = (page - 1) * limit
  
  const groupsPromise = this.find({ createdBy, isActive: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec()
    
  const countPromise = this.countDocuments({ createdBy, isActive: true })
  
  return Promise.all([groupsPromise, countPromise]).then(([groups, total]) => ({
    groups,
    total
  }))
}

// Find groups that can participate in a specific game
targetGroupSchema.statics.findForGame = function(gameId: string): Promise<TargetGroup[]> {
  return this.find({
    games: gameId,
    isActive: true
  }).exec()
}

// Search groups by text query
targetGroupSchema.statics.searchGroups = function(
  query: string,
  createdBy?: string,
  limit: number = 20
): Promise<TargetGroup[]> {
  const searchFilter: any = {
    $text: { $search: query },
    isActive: true
  }
  
  if (createdBy) {
    searchFilter.createdBy = createdBy
  }
  
  return this.find(searchFilter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .exec()
}

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let TargetGroupModel: Model<TargetGroup>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  TargetGroupModel = mongoose.model<TargetGroup>('TargetGroup')
} catch (error) {
  // Model doesn't exist yet, create it
  TargetGroupModel = mongoose.model<TargetGroup>('TargetGroup', targetGroupSchema)
}

export default TargetGroupModel
