// scripts/migrations/20250914_drop_sharelinks_id_index.js
// 2025-09-14T15:58:48.000Z — Migration: Drop bad unique index shareLinks.id_1 on games
// WHAT: Removes a globally unique index on subdocument field shareLinks.id causing E11000 on inserts
// WHY: Unique index on array subdocuments is enforced across the whole collection and collides on null/missing
// HOW: Connects using MONGODB_URI (.env.local), targets DB from URI path or DB_NAME env var (default: test)

require('dotenv').config({ path: '.env.local' })
const { MongoClient } = require('mongodb')

function resolveDbName(uri, fallback) {
  try {
    const u = new URL(uri)
    const fromPath = u.pathname && u.pathname !== '/' ? u.pathname.slice(1) : ''
    return process.env.DB_NAME || fromPath || fallback || 'test'
  } catch (e) {
    return process.env.DB_NAME || fallback || 'test'
  }
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not set')
  const dbName = resolveDbName(uri, 'test')

  const client = new MongoClient(uri, { maxPoolSize: 1 })
  try {
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection('games')

    const before = await col.indexes()
    const hasBad = before.some(x => x.name === 'shareLinks.id_1')

    if (hasBad) {
      console.log(`[i] Dropping index shareLinks.id_1 in db=${dbName} …`)
      await col.dropIndex('shareLinks.id_1')
      console.log('[✓] Dropped shareLinks.id_1')
    } else {
      console.log('[i] Bad index shareLinks.id_1 not present — nothing to drop')
    }

    // Ensure sparse unique index on shortCode exists (safe id generator is app-level)
    const refreshed = await col.indexes()
    const hasGood = refreshed.some(x => x.name === 'shareLinks.shortCode_1')
    if (!hasGood) {
      console.log('[i] Ensuring sparse unique index shareLinks.shortCode_1 …')
      await col.createIndex({ 'shareLinks.shortCode': 1 }, { unique: true, sparse: true, name: 'shareLinks.shortCode_1' })
      console.log('[✓] Ensured shareLinks.shortCode_1')
    }

    const after = await col.indexes()
    console.log('[i] Indexes after:')
    console.log(after)
    console.log('[✓] Migration completed successfully')
  } finally {
    await client.close()
  }
}

run().catch((err) => {
  console.error('[x] Migration failed:', err?.message || err)
  process.exit(1)
})
