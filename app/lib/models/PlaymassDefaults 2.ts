// Purpose: Store PlayMass-wide default configuration per game module.
// What: Mongoose model that saves arbitrary defaults ( Mixed ) for a module.
// Why: Phase 1 needs a safe place to persist playmass-level defaults without
//      altering existing SystemSettings schema. This avoids coupling and enables
//      incremental rollout.

import mongoose, { Schema, Model } from 'mongoose'
import { GameType } from '../../types'

export interface PlaymassDefaultsDoc {
  _id: mongoose.Types.ObjectId
  moduleId: GameType
  defaults: any // Schema.Types.Mixed — arbitrary JSON
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

const playmassDefaultsSchema = new Schema<PlaymassDefaultsDoc>({
  moduleId: {
    type: String,
    required: true,
    enum: ['STARS_HEXA', 'PENALTY_SHOOTOUT'],
    unique: true
  },
  defaults: {
    type: Schema.Types.Mixed,
    default: {}
  },
  updatedBy: {
    type: String,
    required: true,
    default: 'system'
  }
}, {
  timestamps: true,
  collection: 'playmass_defaults',
  versionKey: '__v'
})

playmassDefaultsSchema.statics.getByModule = async function(moduleId: GameType): Promise<PlaymassDefaultsDoc> {
  let doc = await this.findOne({ moduleId })
  if (!doc) {
    doc = new this({ moduleId, defaults: {}, updatedBy: 'system-init' })
    await doc.save()
  }
  return doc
}

playmassDefaultsSchema.statics.updateDefaults = async function(
  moduleId: GameType,
  patch: Record<string, any>,
  updatedBy: string
): Promise<PlaymassDefaultsDoc> {
  const doc = await (this as any).getByModule(moduleId)
  // Deep merge at API/controller layer; here we just assign for simplicity.
  // We keep assignment to avoid unintended merging rules inside the model.
  doc.defaults = { ...(doc.defaults || {}), ...(patch || {}) }
  doc.updatedBy = updatedBy || 'admin'
  return await doc.save()
}

let PlaymassDefaultsModel: Model<PlaymassDefaultsDoc>
try {
  PlaymassDefaultsModel = mongoose.model<PlaymassDefaultsDoc>('PlaymassDefaults')
} catch {
  PlaymassDefaultsModel = mongoose.model<PlaymassDefaultsDoc>('PlaymassDefaults', playmassDefaultsSchema)
}

export default PlaymassDefaultsModel as Model<PlaymassDefaultsDoc> & {
  getByModule(moduleId: GameType): Promise<PlaymassDefaultsDoc>
  updateDefaults(moduleId: GameType, patch: Record<string, any>, updatedBy: string): Promise<PlaymassDefaultsDoc>
}
