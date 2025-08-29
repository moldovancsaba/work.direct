import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import GameModel from '../../../../lib/models/Game'
import RewardModel from '../../../../lib/models/Reward'
import ParticipantModel from '../../../../lib/models/Participant'
import GameResultModel from '../../../../lib/models/GameResult'
import mongoose from 'mongoose'

// GET single game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
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

    // Get stats for the game
    const [participantCount, gameResultCount, rewards] = await Promise.all([
      ParticipantModel.countDocuments({ gameId: game._id }),
      GameResultModel.countDocuments({ gameId: game._id }),
      RewardModel.find({ gameId: game._id })
    ])
    
    const gameWithStats = {
      ...game,
      id: game._id.toString(),
      rewards,
      _count: {
        participants: participantCount,
        gameResults: gameResultCount
      }
    }

    return NextResponse.json({ game: gameWithStats })
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}

// PUT update game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    const {
      title,
      description,
      type,
      configuration,
      rewards,
      maxAttemptsPerUser,
      isActive
    } = body

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
    if (configuration !== undefined) updateData.configuration = configuration
    if (maxAttemptsPerUser !== undefined) {
      updateData['configuration.maxAttemptsPerUser'] = maxAttemptsPerUser
    }
    if (isActive !== undefined) {
      updateData.status = isActive ? 'ACTIVE' : 'DRAFT'
    }

    // Update the game
    const updatedGame = await GameModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    // Handle rewards update if provided
    if (rewards !== undefined) {
      // Delete existing rewards
      await RewardModel.deleteMany({ gameId: id })

      // Create new rewards
      if (rewards.length > 0) {
        const rewardPromises = rewards.map((reward: any) => {
          const rewardData = {
            gameId: id,
            title: reward.title,
            description: reward.description || '',
            type: reward.type,
            value: reward.value,
            maxQuantity: reward.maxQuantity,
            isActive: reward.isActive ?? true
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
    console.error('Error updating game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

// DELETE game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}
