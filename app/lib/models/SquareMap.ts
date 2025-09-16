// app/lib/models/SquareMap.ts
// WHAT: Mongoose model for reusable square grid maps built with the Square Creator.
// WHY: Persist named Cartesian coordinate sets (with Chebyshev radius and tags) for reuse across square-based games.
//      Separate from HexMap to maintain independent evolution and constraints per coordinate system.

import mongoose, { Schema, Model } from 'mongoose'
import type { SquareMap } from '../../types'
import { chebyshevDistance } from '../../lib/square/geometry'

// Coordinate sub-schema (Cartesian)
// WHAT: Integer x,y coordinates for square grid positioning
// WHY: Enforce data type consistency and enable distance-based validation
const coordSchema = new Schema<{ x: number; y: number }>({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false })

// Main schema
const squareMapSchema = new Schema<SquareMap>({
  name: {
    type: String,
    required: [true, 'Map name is required'],
    trim: true,
    minlength: [3, 'Map name must be at least 3 characters'],
    maxlength: [100, 'Map name cannot exceed 100 characters'],
    unique: true
  },
  coords: {
    type: [coordSchema],
    default: [],
    validate: {
      validator: function(this: SquareMap, v: Array<{ x: number; y: number }>) {
        if (!Array.isArray(v)) return false
        // WHAT: Validate all coordinates are integers and within Chebyshev radius
        // WHY: Ensure data integrity and consistency with Square Creator UI constraints
        for (const c of v) {
          if (!Number.isInteger(c.x) || !Number.isInteger(c.y)) return false
        }
        // Deduplicate and ensure within Chebyshev radius constraint
        const seen = new Set<string>()
        for (const c of v) {
          const key = `${c.x},${c.y}`
          if (seen.has(key)) return false
          seen.add(key)
          const d = chebyshevDistance({ x: c.x, y: c.y }, { x: 0, y: 0 })
          if (typeof this.radius === 'number' && d > this.radius) return false
        }
        return true
      },
      message: 'Coordinates must be unique, integer Cartesian pairs within the specified Chebyshev radius'
    }
  },
  radius: {
    type: Number,
    default: 4,
    min: [1, 'Radius must be at least 1'],
    max: [24, 'Radius cannot exceed 24']
  },
  cellCount: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: [],
    // WHAT: Normalize and deduplicate tags, limit count for performance
    // WHY: Consistent search behavior and prevent tag explosion
    set: (vals: string[]) => Array.from(new Set((vals || []).map(v => String(v).trim().toLowerCase()).filter(Boolean))).slice(0, 50)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  backgroundImageUrl: {
    type: String,
    trim: true,
    maxlength: 2048,
    default: undefined
  },
  createdBy: {
    type: String,
    required: [true, 'createdBy is required'],
    trim: true
  }
}, {
  timestamps: true,
  collection: 'squaremaps',
  versionKey: '__v'
})

// Indexes
// WHAT: Single text index for name and tags to enable full-text search
// WHY: Avoid duplicate index warnings on hot reload while supporting admin search features
squareMapSchema.index({ name: 'text', tags: 'text' }, { name: 'squaremap_text_search' })

// Pre-save hook to compute cellCount and sanitize coords
// WHAT: Deduplicate coordinates and compute final cell count before persistence
// WHY: Ensure data hygiene and provide accurate counts for admin UI and public APIs
squareMapSchema.pre('save', function(next) {
  // Compute cellCount precisely from coords
  // Also reassign coords after de-duplication & within-radius filter as a guard (UI should enforce already)
  const seen = new Set<string>()
  const sanitized: Array<{ x: number; y: number }> = []
  for (const c of (this.coords || [])) {
    if (!Number.isInteger(c.x) || !Number.isInteger(c.y)) continue
    const key = `${c.x},${c.y}`
    if (seen.has(key)) continue
    const d = chebyshevDistance({ x: c.x, y: c.y }, { x: 0, y: 0 })
    if (d <= (this.radius || 4)) {
      seen.add(key)
      sanitized.push({ x: c.x, y: c.y })
    }
  }
  ;(this as any).coords = sanitized
  ;(this as any).cellCount = sanitized.length
  next()
})

// WHAT: Model reuse pattern to prevent OverwriteModelError during development hot reload
// WHY: Mongoose caches models globally; check for existing model before creating new one
const SquareMapModel: Model<SquareMap> = (mongoose.models.SquareMap as Model<SquareMap>) || mongoose.model<SquareMap>('SquareMap', squareMapSchema)
export default SquareMapModel