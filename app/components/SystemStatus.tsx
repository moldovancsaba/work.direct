'use client'

import { useEffect, useState } from 'react'
import { ApiResponse } from '../types'
import { logger } from '../lib/logger'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error'
  timestamp: string
  version: string
  environment: string
  uptime: number
  memory: {
    used: number
    total: number
    external: number
  }
  database: {
    status: string
    responseTime: number
    details: any
  }
  services: {
    mongodb: boolean
    mongoose: boolean
  }
  responseTime: number
  checks: {
    database: boolean
    memory: boolean
    responseTime: boolean
  }
}

/**
 * SystemStatus Component
 * 
 * This component displays real-time system health information by fetching data
 * from the /api/health endpoint. It shows database connectivity, memory usage,
 * response times, and overall system status.
 * 
 * Features:
 * - Auto-refreshes every 30 seconds
 * - Color-coded status indicators
 * - Detailed metrics display
 * - Error handling with user-friendly messages
 */
export default function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchHealthStatus = async () => {
    try {
      setError(null)
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<SystemHealth> = await response.json()
      
      if (data.success && data.data) {
        setHealth(data.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(data.message || 'Failed to fetch health status')
      }
    } catch (err) {
      logger.error('Failed to fetch system health', { error: err })
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      // Set a minimal error state to show something to the user
      setHealth({
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'unknown',
        uptime: 0,
        memory: { used: 0, total: 0, external: 0 },
        database: { status: 'error', responseTime: 0, details: {} },
        services: { mongodb: false, mongoose: false },
        responseTime: 0,
        checks: { database: false, memory: false, responseTime: false }
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch health status on component mount and set up auto-refresh
  useEffect(() => {
    fetchHealthStatus()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Utility function to get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy':
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  // Utility function to format uptime
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error && !health) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-800 font-medium">System Status Unavailable</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button
          onClick={fetchHealthStatus}
          className="mt-3 text-red-700 hover:text-red-900 text-sm underline"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="text-gray-500 text-center py-4">
        No health data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            health.status === 'healthy' ? 'bg-green-500' :
            health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor(health.status)
          }`}>
            {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          </span>
        </div>
        
        {lastUpdated && (
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">Database</div>
          <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
            getStatusColor(health.database.status)
          }`}>
            {health.database.status === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {health.database.responseTime}ms
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Memory Usage</div>
          <div className="text-lg font-semibold text-gray-900">
            {health.memory.used}MB
          </div>
          <div className="text-xs text-gray-400">
            of {health.memory.total}MB
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Response Time</div>
          <div className={`text-lg font-semibold ${
            health.responseTime < 500 ? 'text-green-600' :
            health.responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {health.responseTime}ms
          </div>
          <div className="text-xs text-gray-400">
            {health.responseTime < 500 ? 'Excellent' :
             health.responseTime < 1000 ? 'Good' : 'Slow'}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Uptime</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatUptime(health.uptime)}
          </div>
          <div className="text-xs text-gray-400">
            {health.environment}
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div>
        <div className="text-sm text-gray-500 mb-3">Service Status</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">MongoDB</span>
            <div className={`w-2 h-2 rounded-full ${
              health.services.mongodb ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Mongoose ODM</span>
            <div className={`w-2 h-2 rounded-full ${
              health.services.mongoose ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
      </div>

      {/* System Checks */}
      <div>
        <div className="text-sm text-gray-500 mb-3">System Checks</div>
        <div className="space-y-2">
          {Object.entries(health.checks).map(([check, passing]) => (
            <div key={check} className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                passing ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm capitalize">
                {check.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className={`text-xs ${
                passing ? 'text-green-600' : 'text-red-600'
              }`}>
                {passing ? 'Passing' : 'Failing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={fetchHealthStatus}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          <span>Refresh</span>
          {loading && (
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      </div>
    </div>
  )
}
