import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import GameModel from '../../../lib/models/Game'
import RewardModel from '../../../lib/models/Reward'
import ParticipantModel from '../../../lib/models/Participant'
import GameResultModel from '../../../lib/models/GameResult'
import { getAdminUser } from '../../../lib/auth'

// GET all games (admin only)
export async function GET() {
  try {
    // Admin auth guard — WHAT: ensure only authenticated admins can access; WHY: protect admin data
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    await connectDB()
    
    const games = await GameModel.find({})
      .sort({ createdAt: -1 })
      .lean()
    
    // Get stats for each game
    const gamesWithStats = await Promise.all(
      games.map(async (game) => {
        // Use GameResult distinct participants to avoid relying on missing gameId on Participant
        // WHAT: Count unique participants per game via GameResult participantId distinct.
        // WHY: Participant documents are global and do not store gameId; GameResult ties participants to games.
        const [uniqueParticipants, gameResultCount, rewards] = await Promise.all([
          GameResultModel.distinct('participantId', { gameId: game._id }),
          GameResultModel.countDocuments({ gameId: game._id }),
          RewardModel.find({ gameId: game._id })
        ])
        
        const participantCount = Array.isArray(uniqueParticipants) ? uniqueParticipants.length : 0
        
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

// POST new game (admin only)
export async function POST(request: NextRequest) {
  try {
    // Admin auth guard — WHAT/WHY as above
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

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
        // Map simplified admin reward to full Reward schema
        // WHAT: Admin provides simple {title, description, type, value, maxQuantity, isActive}
        // WHY: Reward schema requires configuration; map to POINTS or CUSTOM accordingly.
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
          // FREEBIE or others → CUSTOM
          configuration.custom = {
            title: reward.title,
            description: reward.description || ''
          }
        }
        const rewardData = {
          gameId: savedGame._id,
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
