// app/lib/models/HexMap.ts
// WHAT: Mongoose model for reusable hex maps built with the Hexa Creator.
// WHY: Persist named axial coordinate sets (with radius and tags) for reuse across hex-based games.

import mongoose, { Schema, Model } from 'mongoose'
import type { HexMap } from '../../types'
import { hexDistance } from '../../lib/hex/geometry'

// Coordinate sub-schema (axial)
const coordSchema = new Schema<{ q: number; r: number }>({
  q: { type: Number, required: true },
  r: { type: Number, required: true }
}, { _id: false })

// Main schema
const hexMapSchema = new Schema<HexMap>({
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
      validator: function(this: HexMap, v: Array<{ q: number; r: number }>) {
        if (!Array.isArray(v)) return false
        // All integers
        for (const c of v) {
          if (!Number.isInteger(c.q) || !Number.isInteger(c.r)) return false
        }
        // Deduplicate and ensure within radius constraint
        const seen = new Set<string>()
        for (const c of v) {
          const key = `${c.q},${c.r}`
          if (seen.has(key)) return false
          seen.add(key)
          const d = hexDistance({ q: c.q, r: c.r }, { q: 0, r: 0 })
          if (typeof this.radius === 'number' && d > this.radius) return false
        }
        return true
      },
      message: 'Coordinates must be unique, integer axial pairs within the specified radius'
    }
  },
  radius: {
    type: Number,
    default: 4,
    min: [1, 'Radius must be at least 1'],
    max: [24, 'Radius cannot exceed 24']
  },
  hexCount: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: [],
    set: (vals: string[]) => Array.from(new Set((vals || []).map(v => String(v).trim().toLowerCase()).filter(Boolean))).slice(0, 50)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: [true, 'createdBy is required'],
    trim: true
  }
}, {
  timestamps: true,
  collection: 'hexmaps',
  versionKey: '__v'
})

// Indexes
// Keep only a single unique index definition for `name` to avoid Mongoose duplicate index warnings
hexMapSchema.index({ name: 'text', tags: 'text' }, { name: 'hexmap_text_search' })

// Pre-save to compute hexCount and sanitize coords
hexMapSchema.pre('save', function(next) {
  // Compute hexCount precisely from coords
  // Also reassign coords after de-duplication & within-radius filter as a guard (UI should enforce already)
  const seen = new Set<string>()
  const sanitized: Array<{ q: number; r: number }> = []
  for (const c of (this.coords || [])) {
    if (!Number.isInteger(c.q) || !Number.isInteger(c.r)) continue
    const key = `${c.q},${c.r}`
    if (seen.has(key)) continue
    const d = hexDistance({ q: c.q, r: c.r }, { q: 0, r: 0 })
    if (d <= (this.radius || 4)) {
      seen.add(key)
      sanitized.push({ q: c.q, r: c.r })
    }
  }
  ;(this as any).coords = sanitized
  ;(this as any).hexCount = sanitized.length
  next()
})

const HexMapModel: Model<HexMap> = (mongoose.models.HexMap as Model<HexMap>) || mongoose.model<HexMap>('HexMap', hexMapSchema)
export default HexMapModel
