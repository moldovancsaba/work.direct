import mongoose, { Schema, Model } from 'mongoose'

// System Settings Interface
export interface SystemSettings {
  _id: mongoose.Types.ObjectId
  // General Settings
  siteName: string
  siteDescription: string
  contactEmail: string
  
  // Game Settings
  defaultMaxAttempts: number
  defaultMaxFlips: number
  requireRegistration: boolean
  allowMultipleAttempts: boolean
  showResults: boolean
  
  // Security Settings
  enableRateLimit: boolean
  maxRequestsPerMinute: number
  sessionTimeout: number
  
  // Notifications
  emailNotifications: boolean
  gameCompletionEmails: boolean
  adminAlerts: boolean
  
  // Appearance
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  enableAnimations: boolean
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  updatedBy: string
}

// System Settings Schema
const systemSettingsSchema = new Schema<SystemSettings>({
  // General Settings
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true,
    maxlength: [100, 'Site name cannot exceed 100 characters'],
    default: 'PlayMass'
  },
  
  siteDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Site description cannot exceed 500 characters'],
    default: 'Interactive game platform for engaging experiences'
  },
  
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email address'],
    default: 'admin@playmass.com'
  },
  
  // Game Settings
  defaultMaxAttempts: {
    type: Number,
    required: [true, 'Default max attempts is required'],
    min: [1, 'Default max attempts must be at least 1'],
    max: [10, 'Default max attempts cannot exceed 10'],
    default: 3
  },
  
  defaultMaxFlips: {
    type: Number,
    required: [true, 'Default max flips is required'],
    min: [1, 'Default max flips must be at least 1'],
    max: [7, 'Default max flips cannot exceed 7'],
    default: 7
  },
  
  requireRegistration: {
    type: Boolean,
    default: false
  },
  
  allowMultipleAttempts: {
    type: Boolean,
    default: true
  },
  
  showResults: {
    type: Boolean,
    default: true
  },
  
  // Security Settings
  enableRateLimit: {
    type: Boolean,
    default: true
  },
  
  maxRequestsPerMinute: {
    type: Number,
    min: [10, 'Max requests per minute must be at least 10'],
    max: [1000, 'Max requests per minute cannot exceed 1000'],
    default: 100
  },
  
  sessionTimeout: {
    type: Number,
    min: [5, 'Session timeout must be at least 5 minutes'],
    max: [120, 'Session timeout cannot exceed 120 minutes'],
    default: 30
  },
  
  // Notifications
  emailNotifications: {
    type: Boolean,
    default: true
  },
  
  gameCompletionEmails: {
    type: Boolean,
    default: false
  },
  
  adminAlerts: {
    type: Boolean,
    default: true
  },
  
  // Appearance
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  
  primaryColor: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color'],
    default: '#3B82F6'
  },
  
  enableAnimations: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  updatedBy: {
    type: String,
    required: [true, 'Updated by is required'],
    default: 'system'
  }
}, {
  // Schema options
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  collection: 'systemsettings',
  versionKey: '__v'
})

// Indexes for optimal query performance
systemSettingsSchema.index({ updatedAt: -1 })

// Static method to get current settings (singleton pattern)
systemSettingsSchema.statics.getCurrentSettings = async function(): Promise<SystemSettings> {
  let settings = await this.findOne().sort({ updatedAt: -1 })
  
  if (!settings) {
    // Create default settings if none exist
    settings = new this({
      updatedBy: 'system-init'
    })
    await settings.save()
  }
  
  return settings
}

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function(
  updates: Partial<Omit<SystemSettings, '_id' | 'createdAt' | 'updatedAt'>>,
  updatedBy: string = 'admin'
): Promise<SystemSettings> {
  let settings = await (this as any).getCurrentSettings()
  
  // Apply updates
  Object.assign(settings, updates, { updatedBy })
  
  // Save and return updated settings
  return await settings.save()
}

// Static method to reset settings to defaults
systemSettingsSchema.statics.resetToDefaults = async function(
  updatedBy: string = 'admin'
): Promise<SystemSettings> {
  // Delete all existing settings
  await this.deleteMany({})
  
  // Create new default settings
  const settings = new this({
    updatedBy: updatedBy
  })
  
  return await settings.save()
}

// Instance method to validate settings before save
systemSettingsSchema.methods.validateSettings = function(): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(this.contactEmail)) {
    errors.push('Invalid contact email format')
  }
  
  // Validate color format
  const colorRegex = /^#[0-9A-F]{6}$/i
  if (!colorRegex.test(this.primaryColor)) {
    errors.push('Invalid primary color format (must be hex)')
  }
  
  // Validate numeric ranges
  if (this.defaultMaxAttempts < 1 || this.defaultMaxAttempts > 10) {
    errors.push('Default max attempts must be between 1 and 10')
  }
  
  if (this.defaultMaxFlips < 1 || this.defaultMaxFlips > 7) {
    errors.push('Default max flips must be between 1 and 7')
  }
  
  if (this.enableRateLimit) {
    if (this.maxRequestsPerMinute < 10 || this.maxRequestsPerMinute > 1000) {
      errors.push('Max requests per minute must be between 10 and 1000')
    }
  }
  
  if (this.sessionTimeout < 5 || this.sessionTimeout > 120) {
    errors.push('Session timeout must be between 5 and 120 minutes')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Pre-save middleware for validation
systemSettingsSchema.pre('save', function(next) {
  const validation = (this as any).validateSettings()
  
  if (!validation.isValid) {
    return next(new Error(`Settings validation failed: ${validation.errors.join(', ')}`))
  }
  
  next()
})

// Create and export the model
let SystemSettingsModel: Model<SystemSettings>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  SystemSettingsModel = mongoose.model<SystemSettings>('SystemSettings')
} catch (error) {
  // Model doesn't exist yet, create it
  SystemSettingsModel = mongoose.model<SystemSettings>('SystemSettings', systemSettingsSchema)
}

export default SystemSettingsModel
