/**
 * Fix Penalty Victory Message Script
 * 
 * This script removes the incorrect "41 3-2!" text from penalty game victory messages
 * and resets them to the proper default value.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/playmass';

async function fixVictoryMessages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const gamesCollection = db.collection('games');
    
    // Find all penalty shootout games with the problematic victory message
    const gamesWithBadText = await gamesCollection.find({
      type: 'PENALTY_SHOOTOUT',
      'configuration.penaltyShootout.texts.victoryMessage': '41 3-2!'
    }).toArray();
    
    console.log(`Found ${gamesWithBadText.length} games with incorrect victory message`);
    
    if (gamesWithBadText.length > 0) {
      // Update all games to fix the victory message
      const result = await gamesCollection.updateMany(
        {
          type: 'PENALTY_SHOOTOUT',
          'configuration.penaltyShootout.texts.victoryMessage': '41 3-2!'
        },
        {
          $set: {
            'configuration.penaltyShootout.texts.victoryMessage': 'Victory! You won {userScore}-{opponentScore}!'
          }
        }
      );
      
      console.log(`✅ Fixed ${result.modifiedCount} games`);
      console.log('Victory message has been reset to: "Victory! You won {userScore}-{opponentScore}!"');
    } else {
      console.log('No games found with the problematic victory message');
    }
    
    // Also check for other similar issues
    const allPenaltyGames = await gamesCollection.find({
      type: 'PENALTY_SHOOTOUT'
    }).toArray();
    
    console.log(`\nChecking all ${allPenaltyGames.length} penalty games for similar issues...`);
    
    for (const game of allPenaltyGames) {
      const texts = game.configuration?.penaltyShootout?.texts || {};
      
      // Check if any text field contains just numbers or similar problematic patterns
      for (const [key, value] of Object.entries(texts)) {
        if (typeof value === 'string' && /^\d+\s*\d*-\d+!?$/.test(value)) {
          console.log(`⚠️  Game ${game._id}: ${key} = "${value}" (looks like test data)`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixVictoryMessages();
