import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import GameModel from '../../../lib/models/Game'
import RewardModel from '../../../lib/models/Reward'
import ParticipantModel from '../../../lib/models/Participant'
import GameResultModel from '../../../lib/models/GameResult'

// GET all games
export async function GET() {
  try {
    await connectDB()
    
    const games = await GameModel.find({})
      .sort({ createdAt: -1 })
      .lean()
    
    // Get stats for each game
    const gamesWithStats = await Promise.all(
      games.map(async (game) => {
        const [participantCount, gameResultCount, rewards] = await Promise.all([
          ParticipantModel.countDocuments({ gameId: game._id }),
          GameResultModel.countDocuments({ gameId: game._id }),
          RewardModel.find({ gameId: game._id })
        ])
        
        return {
          ...game,
          id: game._id.toString(),
          rewards,
          _count: {
            participants: participantCount,
            gameResults: gameResultCount
          }
        }
      })
    )

    return NextResponse.json({ games: gamesWithStats })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

// POST new game
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
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

    // Validate required fields
    if (!title || !type || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, configuration' },
        { status: 400 }
      )
    }

    // Process configuration based on game type
    let processedConfiguration = { ...configuration }
    
    // For STARS_HEXA games, ensure totalStars is set correctly
    if (type === 'STARS_HEXA' && configuration.starsHexa) {
      const starsCount = configuration.starsHexa.hexagons?.filter((h: any) => h.hasHiddenStar).length || 0
      processedConfiguration.starsHexa = {
        ...configuration.starsHexa,
        totalStars: starsCount
      }
    }
    
    // For 💰🌪️🍀 games, ensure proper validation
    if (type === '💰🌪️🍀' && configuration.wheelOfFortune) {
      processedConfiguration.wheelOfFortune = {
        ...configuration.wheelOfFortune
      }
    }
    
    // Create game data following the existing schema
    const gameData = {
      title,
      description: description || '',
      type,
      status: isActive ? 'ACTIVE' : 'DRAFT',
      configuration: {
        ...processedConfiguration,
        maxAttemptsPerUser: maxAttemptsPerUser || 3
      },
      createdBy: 'admin', // Default creator
      totalParticipants: 0,
      totalPlays: 0,
      isPublic: false
    }

    // Create the game
    const game = new GameModel(gameData)
    const savedGame = await game.save()

    // Create associated rewards if provided
    let gameRewards = []
    if (rewards && rewards.length > 0) {
      const rewardPromises = rewards.map((reward: any) => {
        const rewardData = {
          gameId: savedGame._id,
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
      
      gameRewards = await Promise.all(rewardPromises)
    }

    const gameResponse = {
      ...savedGame.toObject(),
      id: savedGame._id.toString(),
      rewards: gameRewards
    }

    return NextResponse.json({ game: gameResponse }, { status: 201 })
  } catch (error) {
    console.error('Error creating game:', error)
    
    // Return detailed error message if it's a validation error
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create game',
          message: error.message,
          details: (error as any).errors || null
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
