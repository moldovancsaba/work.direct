import { NextRequest, NextResponse } from 'next/server'
import { checkDBConnection, connectDB } from '../../lib/mongodb'
import { ApiResponse } from '../../types'

/**
 * Health Check API Endpoint
 * 
 * This endpoint provides comprehensive system health information including:
 * - Database connectivity status (both MongoDB native and Mongoose)
 * - Server response time
 * - Memory usage statistics
 * - Environment configuration validation
 * - Timestamp for monitoring purposes
 * 
 * Used by monitoring systems and load balancers to verify application health
 */

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now()
  
  try {
    // Initialize response structure with basic system information
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100, // MB
      },
      database: {
        status: 'unknown',
        responseTime: 0,
        details: {}
      },
      services: {
        mongodb: false,
        mongoose: false
      },
      configuration: {
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
        appUrl: process.env.NEXT_PUBLIC_APP_URL ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV || 'not_set'
      }
    }

    // Test database connectivity
    const dbStartTime = Date.now()
    
    try {
      // Ensure Mongoose connection is established
      await connectDB()
      
      // Perform comprehensive database health check
      const dbHealth = await checkDBConnection()
      
      healthData.database.responseTime = Date.now() - dbStartTime
      healthData.database.status = dbHealth.status
      healthData.database.details = dbHealth.details
      
      healthData.services.mongodb = dbHealth.details.mongodb.connected
      healthData.services.mongoose = dbHealth.details.mongoose.connected
      
      // Determine overall health status based on database connectivity
      if (dbHealth.status === 'error') {
        healthData.status = 'unhealthy'
      } else if (dbHealth.status === 'disconnected') {
        healthData.status = 'degraded'
      }
      
    } catch (dbError) {
      // Database connection failed
      healthData.database.responseTime = Date.now() - dbStartTime
      healthData.database.status = 'error'
      healthData.services.mongodb = false
      healthData.services.mongoose = false
      healthData.status = 'unhealthy'
      
      console.error('Health check database error:', dbError)
      
      // Include error details in development mode only
      if (process.env.NODE_ENV === 'development') {
        healthData.database.details = {
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }
      }
    }

    // Calculate total response time
    const totalResponseTime = Date.now() - startTime
    
    // Add response time to health data
    const finalHealthData = {
      ...healthData,
      responseTime: totalResponseTime,
      checks: {
        database: healthData.database.status === 'connected',
        memory: healthData.memory.used < 500, // Flag if using more than 500MB
        responseTime: totalResponseTime < 1000 // Flag if response time > 1s
      }
    }

    // Determine appropriate HTTP status code based on health status
    let statusCode = 200
    
    if (healthData.status === 'unhealthy') {
      statusCode = 503 // Service Unavailable
    } else if (healthData.status === 'degraded') {
      statusCode = 200 // Still operational but with warnings
    }

    // Return health check response
    const response: ApiResponse = {
      success: healthData.status !== 'unhealthy',
      data: finalHealthData,
      message: `System is ${healthData.status}`
    }

    // Add cache control headers to prevent caching of health checks
    const nextResponse = NextResponse.json(response, { status: statusCode })
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    nextResponse.headers.set('Pragma', 'no-cache')
    nextResponse.headers.set('Expires', '0')
    
    return nextResponse

  } catch (error) {
    // Catch any unexpected errors in the health check itself
    console.error('Health check critical error:', error)
    
    const errorResponse: ApiResponse = {
      success: false,
      message: 'Health check failed',
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * Handle HEAD requests for basic health checks
 * 
 * This is useful for load balancers that only need to verify the service is responding
 * without the overhead of a full health check response body
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Quick database connectivity check
    await connectDB()
    
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Cache-Control', 'no-cache')
    
    return response
    
  } catch (error) {
    // Return 503 Service Unavailable if database is not accessible
    return new NextResponse(null, { status: 503 })
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 * 
 * This allows the health endpoint to be called from browser-based monitoring tools
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache'
    }
  })
}
