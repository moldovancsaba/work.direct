import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import GameModel from '../../../lib/models/Game'
import { ApiResponse, UpdateGameRequest } from '../../../types'
import mongoose from 'mongoose'
import { logger } from '../../../lib/logger'

/**
 * Individual Game API Route Handler
 * 
 * This endpoint handles operations for specific games:
 * - GET: Retrieve game configuration and details
 * - PUT: Update game configuration
 * - DELETE: Soft delete or archive game
 * 
 * Used by both admin interfaces and public game play interfaces
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Await params
    const { id } = await params
    
    // Validate game ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid game ID format',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Game ID must be a valid MongoDB ObjectId'
        }
      }, { status: 400 })
    }
    
    // Find the game by ID
    const game = await GameModel.findById(id).exec()
    
    if (!game) {
      return NextResponse.json({
        success: false,
        message: 'Game not found',
        error: {
          code: 'NOT_FOUND',
        message: `No game found with ID: ${id}`
        }
      }, { status: 404 })
    }
    
    // Check if requesting user can access this game
    const { searchParams } = new URL(request.url)
    const requestingUser = searchParams.get('userId')
    
    // For non-public games, verify access
    if (!game.isPublic && requestingUser !== game.createdBy) {
      // This could be enhanced with proper authentication/authorization
      // For now, we'll allow access but include a warning in the response
      logger.warn('Unauthorized access attempt to private game', { gameId: id, requestingUser })
    }
    
    // Return game details
    return NextResponse.json({
      success: true,
      data: game,
      message: 'Game retrieved successfully'
    })
    
  } catch (error) {
    logger.error('Get game error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve game',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Await params
    const { id } = await params
    
    // Validate game ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid game ID format',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Game ID must be a valid MongoDB ObjectId'
        }
      }, { status: 400 })
    }
    
    // Parse request body
    const updateData: UpdateGameRequest = await request.json()
    
    // Find existing game
    const existingGame = await GameModel.findById(id)
    
    if (!existingGame) {
      return NextResponse.json({
        success: false,
        message: 'Game not found',
        error: {
          code: 'NOT_FOUND',
          message: `No game found with ID: ${id}`
        }
      }, { status: 404 })
    }
    
// Legacy hex-game validation removed — platform supports one active game type (QUIZZZ)
    
    // Prevent certain fields from being updated after game is active
    if (existingGame.status === 'ACTIVE') {
      const restrictedFields = ['type']
      
      // Check if trying to update restricted fields
      if (updateData.type && updateData.type !== existingGame.type) {
        return NextResponse.json({
          success: false,
          message: 'Cannot change game type for active games',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Game type cannot be modified once the game is active'
          }
        }, { status: 400 })
      }
      
      // Allow minor configuration updates but prevent major hexagon changes
// Legacy hex-game active-game restriction removed
    }
    
    // Merge update data with existing game
    const updatedGame = await GameModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, // Return updated document
        runValidators: true // Run mongoose validations
      }
    )
    
    if (!updatedGame) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update game',
        error: {
          code: 'UPDATE_FAILED',
          message: 'Game update operation failed'
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: updatedGame,
      message: 'Game updated successfully'
    })
    
  } catch (error) {
    logger.error('Update game error', { error })
    
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
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update game',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Await params
    const { id } = await params
    
    // Validate game ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid game ID format',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Game ID must be a valid MongoDB ObjectId'
        }
      }, { status: 400 })
    }
    
    // Parse request body for partial updates
    const patchData = await request.json()
    
    // Find existing game
    const existingGame = await GameModel.findById(id)
    
    if (!existingGame) {
      return NextResponse.json({
        success: false,
        message: 'Game not found',
        error: {
          code: 'NOT_FOUND',
          message: `No game found with ID: ${id}`
        }
      }, { status: 404 })
    }
    
    // Update the game with partial data
    const updatedGame = await GameModel.findByIdAndUpdate(
      id,
      { $set: patchData },
      { 
        new: true, // Return updated document
        runValidators: true // Run mongoose validations
      }
    )
    
    if (!updatedGame) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update game',
        error: {
          code: 'UPDATE_FAILED',
          message: 'Game update operation failed'
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: updatedGame,
      message: 'Game updated successfully'
    })
    
  } catch (error) {
    logger.error('Patch game error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update game',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Await params
    const { id } = await params
    
    // Validate game ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid game ID format',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Game ID must be a valid MongoDB ObjectId'
        }
      }, { status: 400 })
    }
    
    // Find existing game
    const existingGame = await GameModel.findById(id)
    
    if (!existingGame) {
      return NextResponse.json({
        success: false,
        message: 'Game not found',
        error: {
          code: 'NOT_FOUND',
          message: `No game found with ID: ${id}`
        }
      }, { status: 404 })
    }
    
    // Parse query parameters to determine delete behavior
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'
    
    if (hardDelete) {
      // Hard delete - completely remove from database
      // This should only be allowed for games with no associated data
      
      // Check if game has any plays or results
      if (existingGame.totalPlays > 0) {
        return NextResponse.json({
          success: false,
          message: 'Cannot permanently delete game with existing play data',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Use soft delete (archive) instead to preserve data integrity'
          }
        }, { status: 400 })
      }
      
      await GameModel.findByIdAndDelete(id)
      
      return NextResponse.json({
        success: true,
        message: 'Game permanently deleted',
        data: { deletedId: id }
      })
      
    } else {
      // Soft delete - archive the game
      const archivedGame = await GameModel.findByIdAndUpdate(
        id,
        { 
          $set: { 
            status: 'ARCHIVED',
            isPublic: false // Make archived games private
          } 
        },
        { new: true }
      )
      
      return NextResponse.json({
        success: true,
        message: 'Game archived successfully',
        data: archivedGame
      })
    }
    
  } catch (error) {
    logger.error('Delete game error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete game',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
