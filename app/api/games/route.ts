import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../lib/mongodb'
import GameModel from '../../lib/models/Game'
import { ApiResponse, CreateGameRequest, GameFilters } from '../../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Games API Route Handler
 * 
 * This endpoint handles CRUD operations for games:
 * - POST: Create new Stars Hexa games
 * - GET: Retrieve games with filtering and pagination
 * 
 * Used by admin interfaces for game management and public interfaces for game discovery
 */

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse request body
    const gameData: CreateGameRequest = await request.json()
    
    // Validate required fields
    if (!gameData.title || !gameData.type || !gameData.createdBy) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: title, type, and createdBy are required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid game data provided'
        }
      }, { status: 400 })
    }
    
    // Validate Stars Hexa specific configuration
    if (gameData.type === 'STARS_HEXA') {
      if (!gameData.configuration.starsHexa?.hexagons || gameData.configuration.starsHexa.hexagons.length !== 7) {
        return NextResponse.json({
          success: false,
          message: 'Stars Hexa games must have exactly 7 hexagons',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid hexagon configuration - must have exactly 7 hexagons'
          }
        }, { status: 400 })
      }
      
      // Validate star count (1-3 stars)
      const starsCount = gameData.configuration.starsHexa.hexagons.filter(h => h.hasHiddenStar).length
      if (starsCount < 1 || starsCount > 3) {
        return NextResponse.json({
          success: false,
          message: 'Stars Hexa games must have between 1-3 hidden stars',
          error: {
            code: 'VALIDATION_ERROR',
            message: `Current star count: ${starsCount}. Must be 1-3 stars.`
          }
        }, { status: 400 })
      }
      
      // Validate positions are 0-6 and unique
      const positions = gameData.configuration.starsHexa.hexagons.map(h => h.position).sort()
      const expectedPositions = [0, 1, 2, 3, 4, 5, 6]
      if (!positions.every((pos, index) => pos === expectedPositions[index])) {
        return NextResponse.json({
          success: false,
          message: 'Hexagon positions must be 0-6 and unique',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid hexagon position configuration'
          }
        }, { status: 400 })
      }
      
      // Ensure each hexagon has a unique ID
      const hexagonIds = gameData.configuration.starsHexa.hexagons.map(h => h.id)
      const uniqueHexagonIds = new Set(hexagonIds)
      if (hexagonIds.length !== uniqueHexagonIds.size) {
        return NextResponse.json({
          success: false,
          message: 'All hexagons must have unique IDs',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Duplicate hexagon IDs found'
          }
        }, { status: 400 })
      }
      
      // Generate unique IDs for hexagons that don't have them
      gameData.configuration.starsHexa.hexagons.forEach(hexagon => {
        if (!hexagon.id) {
          hexagon.id = uuidv4()
        }
      })
      
      // Ensure totalStars matches actual hidden stars
      gameData.configuration.starsHexa.totalStars = starsCount
    }
    
    // Create new game document
    const game = new GameModel({
      ...gameData,
      // Set default configuration values
      configuration: {
        ...gameData.configuration,
        allowMultipleAttempts: gameData.configuration.allowMultipleAttempts ?? true,
        maxAttemptsPerUser: gameData.configuration.maxAttemptsPerUser ?? 1,
        requireRegistration: gameData.configuration.requireRegistration ?? false,
        showResults: gameData.configuration.showResults ?? true
      },
      // Initialize tracking fields
      totalParticipants: 0,
      totalPlays: 0,
      shareLinks: [],
      // Set default visibility
      isPublic: gameData.isPublic ?? false
    })
    
    // Save to database
    const savedGame = await game.save()
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: savedGame,
      message: 'Game created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create game error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        message: 'Game validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 })
    }
    
    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Game with this configuration already exists',
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Duplicate game data'
        }
      }, { status: 409 })
    }
    
    // Handle general errors
    return NextResponse.json({
      success: false,
      message: 'Failed to create game',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Cap at 50
    const skip = (page - 1) * limit
    
    // Filter parameters
    const filters: GameFilters = {}
    
    // Status filter
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',') as any
    }
    
    // Type filter
    const typeParam = searchParams.get('type')
    if (typeParam) {
      filters.type = typeParam.split(',') as any
    }
    
    // Creator filter
    const createdBy = searchParams.get('createdBy')
    if (createdBy) {
      filters.createdBy = createdBy
    }
    
    // Public games filter
    const isPublic = searchParams.get('isPublic')
    if (isPublic) {
      filters.isPublic = isPublic.toLowerCase() === 'true'
    }
    
    // Date range filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate) {
      filters.startDate = new Date(startDate)
    }
    if (endDate) {
      filters.endDate = new Date(endDate)
    }
    
    // Search text parameter
    const searchText = searchParams.get('search')
    
    // Build MongoDB query
    const query: any = {}
    
    // Apply filters
    if (filters.status) {
      query.status = { $in: filters.status }
    }
    
    if (filters.type) {
      query.type = { $in: filters.type }
    }
    
    if (filters.createdBy) {
      query.createdBy = filters.createdBy
    }
    
    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic
    }
    
    // Date range query
    if (filters.startDate || filters.endDate) {
      query.createdAt = {}
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate
      }
    }
    
    // Text search query
    if (searchText) {
      query.$text = { $search: searchText }
    }
    
    // Execute query with pagination
    const gamesPromise = GameModel.find(query)
      .sort(searchText ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('targetGroups', 'name memberCount')
      .exec()
    
    const countPromise = GameModel.countDocuments(query)
    
    // Execute both queries in parallel
    const [games, totalCount] = await Promise.all([gamesPromise, countPromise])
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    // Return paginated response
    return NextResponse.json({
      success: true,
      data: games,
      message: `Retrieved ${games.length} games`,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
    
  } catch (error) {
    console.error('Get games error:', error)
    
    // Handle invalid date errors
    if (error instanceof Error && error.message.includes('Invalid Date')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid date format provided',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please use ISO date format (YYYY-MM-DD)'
        }
      }, { status: 400 })
    }
    
    // Handle general errors
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve games',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 * 
 * This allows the games endpoint to be called from browser-based admin tools
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
