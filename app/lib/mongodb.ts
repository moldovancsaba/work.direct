import { MongoClient, MongoClientOptions } from 'mongodb'
import mongoose from 'mongoose'
import { logger } from './logger'

// Ensure MONGODB_URI environment variable is present
// This is required for both MongoDB native client and Mongoose ODM connections
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

// WHAT: Resolve an explicit database name for connections.
// WHY: Atlas URIs without a path default to 'test'. We prefer an explicit DB to avoid
//      accidental writes to 'test' in production. If DB_NAME is provided, use it. Otherwise,
//      try to parse the database from the URI path. Fallback to 'playmass' as a safe default.
function resolveDbName(mongoUri: string | undefined): string {
  if (!mongoUri) return process.env.DB_NAME || 'playmass'
  try {
    const u = new URL(mongoUri)
    const pathDb = u.pathname && u.pathname !== '/' ? u.pathname.slice(1) : ''
    return process.env.DB_NAME || pathDb || 'playmass'
  } catch {
    return process.env.DB_NAME || 'playmass'
  }
}

const resolvedDbName = resolveDbName(uri)

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
    logger.debug('MongoDB is already connected')
    return
  }

  try {
    // If connection is in progress, wait for it
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve)
      })
      isConnected = true
      logger.info('MongoDB connection established (was connecting)')
      return
    }

    // Create new connection
    const db = await mongoose.connect(uri, {
      // Mongoose-specific connection options
      // These options are optimized for the ODM layer
      dbName: resolvedDbName, // WHAT: Ensure we connect to the intended database; WHY: avoid defaulting to 'test'
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
    logger.info('MongoDB connected successfully via Mongoose', {
      database: db.connection.db?.databaseName,
      readyState: db.connection.readyState
    })
  } catch (error) {
    logger.error('MongoDB connection failed', { error })
    isConnected = false
    // Reset connection state on error
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect()
      } catch (disconnectError) {
        logger.error('Failed to disconnect after connection error', { error: disconnectError })
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
    logger.info('MongoDB disconnected successfully')
  } catch (error) {
    logger.error('MongoDB disconnection failed', { error })
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
    logger.error('Database health check failed', { error })
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
