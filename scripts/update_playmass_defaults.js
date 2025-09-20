#!/usr/bin/env node
// Update PlayMass defaults in MongoDB Atlas without running the Next server
// Reads .env.local for MONGODB_URI

const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const mongoose = require('mongoose')

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL
if (!uri) {
  console.error('Missing MONGODB_URI (or MONGODB_URL / DATABASE_URL) in environment')
  process.exit(1)
}

const collectionName = 'playmass_defaults'

const modules = ['STARS_HEXA', 'PENALTY_SHOOTOUT']

const patch = {
  platform: {
    styles: {
      main: {
        h1FontUrl: 'https://fonts.google.com/specimen/Montserrat',
        h1FontStyle: 'Bold 700',
        h1Class: 'text-3xl font-bold',
        h2FontUrl: 'https://fonts.google.com/specimen/Montserrat',
        h2FontStyle: 'SemiBold 600',
        h2Class: 'text-xl font-semibold',
        pFontUrl: 'https://fonts.google.com/specimen/Montserrat',
        pFontStyle: 'Regular 400',
        pClass: 'text-base',
        inputClass: 'w-full px-4 py-3 rounded-lg',
        buttonPrimaryClass: 'btn btn-primary'
      }
    },
    texts: {
      TERMS_TITLE: 'Terms & Conditions',
      TERMS_BODY: 'Provide your terms and conditions here.',
      PRIVACY_TITLE: 'Privacy Policy',
      PRIVACY_BODY: 'Provide your privacy policy here.',
      DELETION_TITLE: 'Data Deletion',
      DELETION_BODY: 'Explain how users can request data deletion.'
    }
  }
}

;(async () => {
  try {
    await mongoose.connect(uri)
    const db = mongoose.connection.db

    for (const moduleId of modules) {
      const existing = await db.collection(collectionName).findOne({ moduleId })
      const nextDefaults = mergeDeep(existing?.defaults || {}, patch)
      await db.collection(collectionName).updateOne(
        { moduleId },
        {
          $set: {
            moduleId,
            defaults: nextDefaults,
            updatedBy: 'admin'
          }
        },
        { upsert: true }
      )
      console.log(`Updated defaults for ${moduleId}`)
    }
  } catch (err) {
    console.error('Update failed:', err?.message || err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
})()

function mergeDeep(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) return override
  if (base && typeof base === 'object' && override && typeof override === 'object') {
    const out = { ...base }
    for (const k of Object.keys(override)) {
      out[k] = mergeDeep(base?.[k], override[k])
    }
    return out
  }
  return override !== undefined ? override : base
}
