#!/usr/bin/env node
// Purge all games and related data that are NOT of type QUIZZZ.
// - Deletes Games (type != 'QUIZZZ')
// - Deletes Rewards, GameResults, RewardClaims linked to those games
// - Cleans participants.gameResults references and recalculates participant totals
//
// Safe: Does NOT delete any QUIZZZ games or their data.

const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const mongoose = require('mongoose')

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL
if (!uri) {
  console.error('Missing MONGODB_URI (or MONGODB_URL / DATABASE_URL) in environment')
  process.exit(1)
}

;(async () => {
  const startedAt = new Date()
  try {
    await mongoose.connect(uri)
    const db = mongoose.connection.db

    const gamesCol = db.collection('games')
    const resultsCol = db.collection('gameresults')
    const rewardsCol = db.collection('rewards')
    const rewardClaimsCol = db.collection('rewardclaims')
    const participantsCol = db.collection('participants')

    // 1) Find all non-QUIZZZ games
    const nonQuizGames = await gamesCol.find({ type: { $ne: 'QUIZZZ' } }, { projection: { _id: 1, title: 1, type: 1 } }).toArray()
    if (!nonQuizGames.length) {
      console.log('No non-QUIZZZ games found. Nothing to purge.')
      process.exit(0)
    }
    const gameIds = nonQuizGames.map(g => g._id)
    console.log(`Found ${nonQuizGames.length} non-QUIZZZ games to purge`)

    // 2) Collect related IDs
    const resultDocs = await resultsCol.find({ gameId: { $in: gameIds } }, { projection: { _id: 1, participantId: 1 } }).toArray()
    const resultIds = resultDocs.map(r => r._id)
    const affectedParticipantIds = Array.from(new Set(resultDocs.map(r => String(r.participantId)).filter(Boolean))).map(id => new mongoose.Types.ObjectId(id))

    const rewardDocs = await rewardsCol.find({ gameId: { $in: gameIds } }, { projection: { _id: 1 } }).toArray()
    const rewardIds = rewardDocs.map(r => r._id)

    // 3) Delete reward claims linked to those games (by rewardId or gameResultId)
    const rcFilter = { $or: [] }
    if (rewardIds.length) rcFilter.$or.push({ rewardId: { $in: rewardIds } })
    if (resultIds.length) rcFilter.$or.push({ gameResultId: { $in: resultIds } })
    let rcDeleted = { deletedCount: 0 }
    if (rcFilter.$or.length) {
      rcDeleted = await rewardClaimsCol.deleteMany(rcFilter)
    }

    // 4) Delete game results and rewards, then games
    const grDeleted = resultIds.length ? await resultsCol.deleteMany({ _id: { $in: resultIds } }) : { deletedCount: 0 }
    const rwDeleted = rewardIds.length ? await rewardsCol.deleteMany({ _id: { $in: rewardIds } }) : { deletedCount: 0 }
    const gmDeleted = await gamesCol.deleteMany({ _id: { $in: gameIds } })

    // 5) Clean participants.gameResults references and recalc totals for affected participants
    if (resultIds.length) {
      await participantsCol.updateMany(
        { _id: { $in: affectedParticipantIds } },
        { $pull: { gameResults: { $in: resultIds } } }
      )

      // Recalculate totals for affected participants
      for (const pid of affectedParticipantIds) {
        const remainingResults = await resultsCol.countDocuments({ participantId: pid, isValidated: true })
        const remainingClaims = await rewardClaimsCol.countDocuments({ participantId: pid })
        await participantsCol.updateOne(
          { _id: pid },
          { $set: { totalGamesPlayed: remainingResults, totalRewardsEarned: remainingClaims } }
        )
      }
    }

    console.log('Purge summary:')
    console.log(`  Games removed: ${gmDeleted.deletedCount}`)
    console.log(`  GameResults removed: ${grDeleted.deletedCount}`)
    console.log(`  Rewards removed: ${rwDeleted.deletedCount}`)
    console.log(`  RewardClaims removed: ${rcDeleted.deletedCount}`)
    console.log(`  Participants updated: ${affectedParticipantIds.length}`)

    const finishedAt = new Date()
    console.log(`Completed at: ${finishedAt.toISOString()} (took ${Math.round((finishedAt - startedAt)/1000)}s)`) 
    process.exit(0)
  } catch (err) {
    console.error('Purge failed:', err?.message || err)
    process.exit(1)
  } finally {
    try { await mongoose.disconnect() } catch {}
  }
})()
