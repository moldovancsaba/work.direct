import { MongoClient, MongoClientOptions } from 'mongodb'
import mongoose from 'mongoose'

// Ensure MONGODB_URI environment variable is present
// This is required for both MongoDB native client and Mongoose ODM connections
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {
  // Connection pool settings for optimal performance
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 10000, // Increased to 10 seconds for better reliability
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // 10 second connection timeout
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true, // Enable retryable writes
}

// Global variable for MongoDB client connection
// This implements the singleton pattern to prevent multiple connections in serverless environments
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value across module reloads
  // This prevents creating new connections on every hot reload
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, create a new client for each connection
  // This is optimal for serverless environments where global state is not persistent
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Mongoose connection management with singleton pattern
// This handles the ODM layer for schema-based document modeling
let isConnected = false

export const connectDB = async (): Promise<void> => {
  // Check if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected')
    return
  }

  try {
    // If connection is in progress, wait for it
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve)
      })
      isConnected = true
      console.log('MongoDB connection established (was connecting)')
      return
    }

    // Create new connection
    const db = await mongoose.connect(uri, {
      // Mongoose-specific connection options
      // These options are optimized for the ODM layer
      bufferCommands: false, // Disable mongoose buffering for serverless
      maxPoolSize: 10, // Maintain up to 10 socket connections  
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds for better reliability
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // 10 second connection timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true, // Enable retryable writes
    })

    // Wait for connection to be fully ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - readyState not reached'))
        }, 10000)
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout)
          resolve(void 0)
        })
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
    }

    isConnected = true
    console.log('MongoDB connected successfully via Mongoose')
    
    // Log connection details for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Connected to database: ${db.connection.db?.databaseName}`)
      console.log(`Connection ready state: ${db.connection.readyState}`)
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    isConnected = false
    // Reset connection state on error
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect()
      } catch (disconnectError) {
        console.error('Failed to disconnect after connection error:', disconnectError)
      }
    }
    throw error
  }
}

// Graceful disconnection utility
// This ensures proper cleanup of database connections
export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) {
    return
  }

  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('MongoDB disconnected successfully')
  } catch (error) {
    console.error('MongoDB disconnection failed:', error)
    throw error
  }
}

// Connection health check utility
// This provides real-time connection status for monitoring
export const checkDBConnection = async (): Promise<{
  status: 'connected' | 'disconnected' | 'error',
  details: {
    mongoose: {
      connected: boolean,
      readyState: number,
      host?: string,
      database?: string
    },
    mongodb: {
      connected: boolean,
      serverInfo?: any
    }
  }
}> => {
  const status = {
    status: 'disconnected' as 'connected' | 'disconnected' | 'error',
    details: {
      mongoose: {
        connected: isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        database: mongoose.connection.db?.databaseName
      },
      mongodb: {
        connected: false,
        serverInfo: undefined as any
      }
    }
  }

  try {
    // Check Mongoose connection
    if (mongoose.connection.readyState === 1) {
      status.details.mongoose.connected = true
    }

    // Check MongoDB native client connection
    const client = await clientPromise
    const adminDb = client.db().admin()
    const serverInfo = await adminDb.serverStatus()
    status.details.mongodb.connected = true
    status.details.mongodb.serverInfo = {
      version: serverInfo.version,
      uptime: serverInfo.uptime,
      connections: serverInfo.connections
    }

    // Overall status determination
    if (status.details.mongoose.connected && status.details.mongodb.connected) {
      status.status = 'connected'
    } else {
      status.status = 'disconnected'
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    status.status = 'error'
  }

  return status
}

// Export the MongoDB client promise for native operations
// This allows direct MongoDB operations when ODM is not needed
export { clientPromise }

// Export connection status for middleware and monitoring
export const getConnectionStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host,
  database: mongoose.connection.db?.databaseName
})
