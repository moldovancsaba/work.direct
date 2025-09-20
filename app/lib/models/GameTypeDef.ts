// app/lib/models/GameTypeDef.ts
// WHAT: Mongoose model defining available game types stored in MongoDB (DB-driven lists for Admin UI)
// WHY: Eliminate hardcoded type dropdowns; enable enabling/disabling and ordering types via DB.

import mongoose, { Schema, Model } from 'mongoose'

export interface GameTypeDef {
  code: string // e.g. 'STARS_HEXA', 'PENALTY_SHOOTOUT', 'FIND_RED', 'WHEEL_OF_FORTUNE', 'QUIZZ', 'QUIZZZ'
  name: string // human-readable label shown in Admin
  enabled: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

const gameTypeSchema = new Schema<GameTypeDef>({
  code: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 64 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'game_types',
  versionKey: '__v'
})

gameTypeSchema.index({ enabled: 1, order: 1 })

const GameTypeModel: Model<GameTypeDef> = (mongoose.models.GameTypeDef as Model<GameTypeDef>) || mongoose.model<GameTypeDef>('GameTypeDef', gameTypeSchema)
export default GameTypeModel