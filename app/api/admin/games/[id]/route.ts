import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import GameModel from '../../../../lib/models/Game'
import RewardModel from '../../../../lib/models/Reward'
import ParticipantModel from '../../../../lib/models/Participant'
import GameResultModel from '../../../../lib/models/GameResult'
import mongoose from 'mongoose'
import { getAdminUser } from '../../../../lib/auth'
import { logger } from '../../../../lib/logger'

// GET single game (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin guard
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    
    const { id } = await params
    logger.debug('GET /api/admin/games/[id] - Received ID', { gameId: id })
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }
    
    const game = await GameModel.findById(id).lean()
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Get stats for the game — use GameResult as source of truth for per-game counts
    const filter: any = { gameId: game._id, isValidated: true }
    const [uniqueParticipants, sessionIds, nullSessionCount, rewards] = await Promise.all([
      GameResultModel.distinct('participantId', filter),
      GameResultModel.distinct('sessionId', filter),
      GameResultModel.countDocuments({ ...filter, $or: [ { sessionId: null }, { sessionId: '' }, { sessionId: { $exists: false } } ] }),
      RewardModel.find({ gameId: game._id })
    ])

    const participantCount = Array.isArray(uniqueParticipants) ? uniqueParticipants.length : 0
    const sessionCount = (Array.isArray(sessionIds) ? sessionIds.filter(Boolean).length : 0) + (nullSessionCount || 0)
    
    const gameWithStats = {
      ...game,
      id: game._id.toString(),
      rewards,
      _count: {
        participants: participantCount,
        gameResults: sessionCount
      }
    }

    return NextResponse.json({ game: gameWithStats })
  } catch (error) {
    logger.error('Error fetching game', { error })
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}

// PUT update game (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin guard
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    logger.debug('API PUT /games/[id] - Received body', { gameId: id, body })
    
    const {
      title,
      description,
      type,
      configuration,
      rewards,
      maxAttemptsPerUser,
      isActive
    } = body
    
    logger.debug('API - Extracted configuration', { gameId: id, configuration })

    // Check if game exists
    const existingGame = await GameModel.findById(id)
    
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Update game data
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    
    // Handle configuration update properly to avoid conflicts
    if (configuration !== undefined) {
      // Process configuration based on game type for consistency
      let processedConfiguration = { ...configuration }
      
      // Legacy game-specific adjustments removed — single-game system
      
      // Ensure maxAttemptsPerUser is preserved or set
      if (maxAttemptsPerUser !== undefined) {
        processedConfiguration.maxAttemptsPerUser = maxAttemptsPerUser
      } else if (existingGame.configuration?.maxAttemptsPerUser) {
        processedConfiguration.maxAttemptsPerUser = existingGame.configuration.maxAttemptsPerUser
      } else {
        processedConfiguration.maxAttemptsPerUser = 3 // Default value
      }
      
      // One-time migration: drop legacy general config when platform present
      if (processedConfiguration.platform && 'general' in processedConfiguration) {
        // Remove legacy field directly to avoid MongoDB operator conflicts
        delete (processedConfiguration as any).general
      }

      // Set cleaned configuration
      updateData.configuration = processedConfiguration
    } else if (maxAttemptsPerUser !== undefined) {
      // If we only have maxAttemptsPerUser, update just that nested property
      updateData['configuration.maxAttemptsPerUser'] = maxAttemptsPerUser
    }
    
    if (isActive !== undefined) {
      updateData.status = isActive ? 'ACTIVE' : 'DRAFT'
    }

    logger.debug('API - Final updateData before DB', { gameId: id, updateData })
    
    // Update the game
    const updatedGame = await GameModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    
    logger.info('API - Game updated successfully', { gameId: id, hasPenaltyConfig: !!updatedGame?.configuration?.penaltyShootout })

    // Handle rewards update if provided
    if (rewards !== undefined) {
      // Delete existing rewards
      await RewardModel.deleteMany({ gameId: id })

      // Create new rewards
      if (rewards.length > 0) {
        const rewardPromises = rewards.map((reward: any) => {
          // Map simplified admin reward to full Reward schema
          let mappedType: any = 'CUSTOM'
          const configuration: any = {}
          if (reward.type === 'POINTS') {
            mappedType = 'POINTS'
            configuration.points = {
              amount: Number(reward.value) || 0,
              currency: 'points'
            }
          } else if (reward.type === 'DISCOUNT') {
            mappedType = 'CUSTOM'
            configuration.custom = {
              title: reward.title,
              description: reward.description || `Discount: ${reward.value}`
            }
          } else {
            configuration.custom = {
              title: reward.title,
              description: reward.description || ''
            }
          }
          const rewardData = {
            gameId: id,
            title: reward.title,
            description: reward.description || '',
            type: mappedType,
            configuration,
            totalQuantity: reward.maxQuantity ?? null,
            remainingQuantity: reward.maxQuantity ?? null,
            isActive: reward.isActive ?? true,
            createdBy: 'admin'
          }
          const newReward = new RewardModel(rewardData)
          return newReward.save()
        })
        
        await Promise.all(rewardPromises)
      }
    }

    // Fetch updated game with rewards
    const gameRewards = await RewardModel.find({ gameId: id })
    
    const gameResponse = {
      ...updatedGame?.toObject(),
      id: updatedGame?._id.toString(),
      rewards: gameRewards
    }

    return NextResponse.json({ game: gameResponse })
  } catch (error) {
    logger.error('Error updating game', { error })
    
    // Return detailed error message if it's a validation error
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to update game',
          message: error.message,
          details: (error as any).errors || null
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

// DELETE game (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin guard
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }
    
    // Check if game exists
    const game = await GameModel.findById(id)
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Delete related records first
    await Promise.all([
      RewardModel.deleteMany({ gameId: id }),
      ParticipantModel.deleteMany({ gameId: id }),
      GameResultModel.deleteMany({ gameId: id })
    ])
    
    // Delete the game
    await GameModel.findByIdAndDelete(id)

    return NextResponse.json({ 
      message: 'Game deleted successfully',
      gameId: id 
    })
  } catch (error) {
    logger.error('Error deleting game', { error })
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}
