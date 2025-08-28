import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../../lib/mongodb'
import GameModel from '../../../../lib/models/Game'
import ParticipantModel from '../../../../lib/models/Participant'
import GameResultModel from '../../../../lib/models/GameResult'
import RewardModel from '../../../../lib/models/Reward'
import RewardClaimModel from '../../../../lib/models/RewardClaim'
import { ApiResponse, PlayGameRequest, PlayGameResponse, GameOutcome, GameOutcomeType } from '../../../../types'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * Game Play API Route Handler
 * 
 * This endpoint handles the actual game play mechanics:
 * - POST: Play the Lucky Wheel game and return results
 * 
 * Features:
 * - Probability-based result calculation
 * - Anti-cheat validation (IP tracking, attempt limits)
 * - Automatic reward distribution
 * - Comprehensive result tracking
 * - Session management for fair play
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<PlayGameResponse>>> {
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
    const playRequest: PlayGameRequest = await request.json()
    
    // Validate required fields
    if (!playRequest.participant?.name) {
      return NextResponse.json({
        success: false,
        message: 'Participant name is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing participant information'
        }
      }, { status: 400 })
    }
    
    // Get client information for anti-cheat tracking
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const sessionId = playRequest.sessionId || uuidv4()
    
    // Find the game
    const game = await GameModel.findById(id)
    
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
    
    // Check if game is playable
    const now = new Date()
    let isPlayable = true
    let unavailableReason = ''
    
    // Check if game is in active status
    if (game.status !== 'ACTIVE') {
      isPlayable = false
      unavailableReason = `Game status: ${game.status}`
    }
    
    // Check if game is within its active date range
    if (isPlayable && game.configuration.startDate && now < game.configuration.startDate) {
      isPlayable = false
      unavailableReason = 'Game has not started yet'
    }
    
    if (isPlayable && game.configuration.endDate && now > game.configuration.endDate) {
      isPlayable = false
      unavailableReason = 'Game has ended'
    }
    
    if (!isPlayable) {
      return NextResponse.json({
        success: false,
        message: 'Game is not currently playable',
        error: {
          code: 'GAME_UNAVAILABLE',
          message: unavailableReason
        }
      }, { status: 403 })
    }
    
    // Validate game type
    if (game.type !== 'LUCKY_WHEEL') {
      return NextResponse.json({
        success: false,
        message: 'This endpoint only supports Lucky Wheel games',
        error: {
          code: 'UNSUPPORTED_GAME_TYPE',
          message: `Game type: ${game.type}`
        }
      }, { status: 400 })
    }
    
    // Validate wheel configuration
    if (!game.configuration.wheel?.segments || game.configuration.wheel.segments.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Game configuration is invalid',
        error: {
          code: 'INVALID_CONFIGURATION',
          message: 'Wheel segments are missing or empty'
        }
      }, { status: 500 })
    }
    
    // Find or create participant
    let participant = await (ParticipantModel as any).findByContact(
      playRequest.participant.email,
      playRequest.participant.phone
    )
    
    if (!participant) {
      // Create new participant
      participant = new ParticipantModel({
        name: playRequest.participant.name,
        email: playRequest.participant.email || undefined,
        phone: playRequest.participant.phone || undefined,
        groupIds: [],
        gameResults: [],
        totalGamesPlayed: 0,
        totalRewardsEarned: 0,
        metadata: {}
      })
      
      await participant.save()
    }
    
    // Check attempt limits
    if (!game.configuration.allowMultipleAttempts) {
      const existingResult = await GameResultModel.findOne({
        gameId: game._id,
        participantId: participant._id,
        isValidated: true
      })
      
      if (existingResult) {
        return NextResponse.json({
          success: false,
          message: 'You have already played this game',
          error: {
            code: 'ATTEMPT_LIMIT_EXCEEDED',
            message: 'This game allows only one attempt per participant'
          }
        }, { status: 403 })
      }
    } else {
      // Check maximum attempts
      const attemptCount = await GameResultModel.countDocuments({
        gameId: game._id,
        participantId: participant._id,
        isValidated: true
      })
      
      if (attemptCount >= game.configuration.maxAttemptsPerUser) {
        return NextResponse.json({
          success: false,
          message: 'Maximum attempts reached for this game',
          error: {
            code: 'ATTEMPT_LIMIT_EXCEEDED',
            message: `Maximum ${game.configuration.maxAttemptsPerUser} attempts allowed`
          }
        }, { status: 403 })
      }
    }
    
    // Note: IP-based rate limiting removed to support hostess/event use cases
    // where multiple participants may play from the same location
    
    // Calculate Lucky Wheel result using probability-based selection
    const wheelResult = calculateWheelResult(game.configuration.wheel.segments)
    
    if (!wheelResult) {
      return NextResponse.json({
        success: false,
        message: 'Failed to calculate game result',
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Wheel result calculation failed'
        }
      }, { status: 500 })
    }
    
    // Determine outcome type and rewards
    const outcome: GameOutcome = {
      type: wheelResult.rewardId ? 'WIN' : 'NO_REWARD',
      segmentId: wheelResult.id,
      value: wheelResult.value,
      rewardIds: wheelResult.rewardId ? [wheelResult.rewardId] : [],
      message: wheelResult.rewardId ? 
        `Congratulations! You won: ${wheelResult.label}` : 
        `You landed on: ${wheelResult.label}. Better luck next time!`
    }
    
    // Create game result record
    const gameResult = new GameResultModel({
      gameId: game._id,
      participantId: participant._id,
      outcome: outcome,
      playedAt: new Date(),
      ipAddress: clientIP,
      userAgent: userAgent,
      sessionId: sessionId,
      isValidated: false // Will be validated after anti-cheat checks
    })
    
    await gameResult.save()
    
    // Perform basic validation (can be enhanced with more sophisticated anti-cheat)
    const isValidResult = await validateGameResult(gameResult)
    
    if (isValidResult) {
      gameResult.isValidated = true
      await gameResult.save()
      
      // Update participant stats
      ;(participant as any).recordGameResult(gameResult._id.toString())
      await participant.save()
      
      // Update game stats
      await GameModel.findByIdAndUpdate(game._id, {
        $inc: { 
          totalPlays: 1,
          ...(participant.totalGamesPlayed === 1 ? { totalParticipants: 1 } : {})
        }
      })
    }
    
    // Handle reward distribution if applicable
    const rewards: any[] = []
    
    if (outcome.type === 'WIN' && outcome.rewardIds.length > 0 && isValidResult) {
      for (const rewardId of outcome.rewardIds) {
        try {
          const reward = await RewardModel.findById(rewardId)
          
          if (reward && (reward as any).canBeClaimed()) {
            // Create reward claim
            const rewardClaim = new RewardClaimModel({
              rewardId: reward._id,
              participantId: participant._id,
              gameResultId: gameResult._id,
              status: 'AVAILABLE',
              claimedAt: new Date(),
              expiresAt: reward.expiresAt || null,
              metadata: {
                gameTitle: game.title,
                segmentLabel: wheelResult.label
              }
            })
            
            await rewardClaim.save()
            
            // Update reward quantity
            if ((reward as any).claim()) {
              await reward.save()
            }
            
            // Update participant reward count
            ;(participant as any).addReward()
            await participant.save()
            
            // Add reward info to response
            rewards.push((reward as any).getDisplayInfo())
          }
        } catch (rewardError) {
          console.error('Reward distribution error:', rewardError)
          // Continue processing - don't fail the entire game for reward issues
        }
      }
    }
    
    // Determine if participant can play again
    // Calculate actual attempts for this specific game
    const currentGameAttempts = await GameResultModel.countDocuments({
      gameId: game._id,
      participantId: participant._id,
      isValidated: true
    })
    
    const remainingAttempts = game.configuration.allowMultipleAttempts ? 
      Math.max(0, game.configuration.maxAttemptsPerUser - currentGameAttempts) : 0
    const canPlayAgain = remainingAttempts > 0 && isPlayable
    
    // Prepare response
    const response: PlayGameResponse = {
      result: outcome,
      rewards: rewards,
      canPlayAgain: canPlayAgain,
      attemptsRemaining: remainingAttempts > 0 ? remainingAttempts : undefined,
      shareUrl: game.shareLinks.length > 0 ? game.shareLinks[0].url : undefined
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      message: isValidResult ? 'Game played successfully' : 'Game result pending validation'
    })
    
  } catch (error) {
    console.error('Play game error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to play game',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * Calculate Lucky Wheel result based on segment probabilities
 * Uses weighted random selection to ensure fair probability distribution
 */
function calculateWheelResult(segments: any[]) {
  try {
    // Create weighted array based on probabilities
    const weightedSegments: any[] = []
    
    segments.forEach(segment => {
      // Add segment multiple times based on its probability
      const weight = Math.round(segment.probability * 100) // Convert to integer weight
      for (let i = 0; i < weight; i++) {
        weightedSegments.push(segment)
      }
    })
    
    if (weightedSegments.length === 0) {
      throw new Error('No valid segments for selection')
    }
    
    // Select random segment from weighted array
    const randomIndex = Math.floor(Math.random() * weightedSegments.length)
    return weightedSegments[randomIndex]
    
  } catch (error) {
    console.error('Wheel calculation error:', error)
    return null
  }
}

/**
 * Basic anti-cheat validation for game results
 * This can be enhanced with more sophisticated checks
 */
async function validateGameResult(gameResult: any): Promise<boolean> {
  try {
    // Check for suspicious patterns
    const isSuspicious = await (gameResult as any).isSuspicious()
    
    if (isSuspicious) {
      console.warn(`Suspicious game result detected: ${gameResult._id}`)
      return false
    }
    
    // Add more validation logic here as needed
    // - Time-based validations
    // - Pattern analysis
    // - Device fingerprinting
    // - Behavioral analysis
    
    return true
    
  } catch (error) {
    console.error('Validation error:', error)
    return false
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
