const { MongoClient } = require('mongodb')

async function resetSettings() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/playmass')
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const collection = db.collection('systemsettings')
    
    // Delete all existing settings documents
    const deleteResult = await collection.deleteMany({})
    console.log(`Deleted ${deleteResult.deletedCount} existing settings documents`)
    
    // Insert fresh default settings
    const defaultSettings = {
      siteName: 'PlayMass',
      siteDescription: 'Interactive game platform for engaging experiences',
      contactEmail: 'admin@playmass.com',
      defaultMaxAttempts: 3,
      defaultMaxFlips: 7,
      requireRegistration: false,
      allowMultipleAttempts: true,
      showResults: true,
      enableRateLimit: true,
      maxRequestsPerMinute: 100,
      sessionTimeout: 30,
      emailNotifications: true,
      gameCompletionEmails: false,
      adminAlerts: true,
      theme: 'light',
      primaryColor: '#3B82F6',
      enableAnimations: true,
      updatedBy: 'system-reset',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const insertResult = await collection.insertOne(defaultSettings)
    console.log(`Inserted new default settings with ID: ${insertResult.insertedId}`)
    
    console.log('Settings reset completed successfully!')
    
  } catch (error) {
    console.error('Error resetting settings:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('MongoDB connection closed')
  }
}

resetSettings()
