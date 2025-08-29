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
 * - POST: Play the Stars Hexa game and return results
 * 
 * Features:
 * - Hexagon flipping and star discovery logic
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
    const playRequest: PlayGameRequest & { hexagonId?: string } = await request.json()
    
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
    if (game.type !== 'STARS_HEXA') {
      return NextResponse.json({
        success: false,
        message: 'This endpoint only supports Stars Hexa games',
        error: {
          code: 'UNSUPPORTED_GAME_TYPE',
          message: `Game type: ${game.type}`
        }
      }, { status: 400 })
    }
    
    // Validate Stars Hexa configuration
    if (!game.configuration.starsHexa?.hexagons || game.configuration.starsHexa.hexagons.length !== 7) {
      return NextResponse.json({
        success: false,
        message: 'Game configuration is invalid',
        error: {
          code: 'INVALID_CONFIGURATION',
          message: 'Stars Hexa hexagons are missing or invalid'
        }
      }, { status: 500 })
    }
    
    // Validate hexagon ID is provided
    if (!playRequest.hexagonId) {
      return NextResponse.json({
        success: false,
        message: 'Hexagon ID is required for Stars Hexa games',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing hexagonId in request'
        }
      }, { status: 400 })
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
          message: '🎯 You\'ve already completed this game! Each player gets only one chance.',
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
          message: `🎮 You've used all ${game.configuration.maxAttemptsPerUser} attempts for this game. Thanks for playing!`,
          error: {
            code: 'ATTEMPT_LIMIT_EXCEEDED',
            message: `Maximum ${game.configuration.maxAttemptsPerUser} attempts allowed`
          }
        }, { status: 403 })
      }
    }
    
    // Note: IP-based rate limiting removed to support hostess/event use cases
    // where multiple participants may play from the same location
    
    // Find the hexagon being flipped
    const flippedHexagon = game.configuration.starsHexa.hexagons.find(h => h.id === playRequest.hexagonId)
    
    if (!flippedHexagon) {
      return NextResponse.json({
        success: false,
        message: 'Hexagon not found',
        error: {
          code: 'NOT_FOUND',
          message: `No hexagon found with ID: ${playRequest.hexagonId}`
        }
      }, { status: 404 })
    }
    
    // Check if hexagon is already revealed in this session
    const existingFlip = await GameResultModel.findOne({
      gameId: game._id,
      participantId: participant._id,
      'outcome.hexagonId': playRequest.hexagonId,
      sessionId: sessionId
    })
    
    if (existingFlip) {
      return NextResponse.json({
        success: false,
        message: '🔄 You\'ve already flipped that card! Try another one.',
        error: {
          code: 'ALREADY_REVEALED',
          message: 'This hexagon has already been revealed in this session'
        }
      }, { status: 400 })
    }
    
    // Calculate Stars Hexa result
    const hexaResult = calculateHexaResult(flippedHexagon, game.configuration.starsHexa.hexagons, participant._id.toString(), sessionId)
    
    // Log the flipped hexagon for debugging
    console.log('Flipped hexagon:', {
      id: flippedHexagon.id,
      text: flippedHexagon.text,
      hasHiddenStar: flippedHexagon.hasHiddenStar,
      position: flippedHexagon.position,
      starsFound: hexaResult.starsFound,
      totalStars: hexaResult.totalStarsInGame,
      foundAllStars: hexaResult.foundAllStars
    })
    
    const outcome: GameOutcome = hexaResult
    
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
      participant.gameResults.push(gameResult._id)
      participant.totalGamesPlayed += 1
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
                hexagonText: flippedHexagon.text,
                sessionId: sessionId
              }
            })
            
            await rewardClaim.save()
            
            // Update reward quantity
            if ((reward as any).claim()) {
              await reward.save()
            }
            
            // Update participant reward count
            participant.totalRewardsEarned += 1
            await participant.save()
                       // Add reward info to response
            rewards.push(reward)
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
 * Calculate Stars Hexa result for hexagon flip
 * Determines if a star was found and calculates game progress
 */
function calculateHexaResult(
  flippedHexagon: any, 
  allHexagons: any[], 
  participantId: string, 
  sessionId: string
): GameOutcome {
  try {
    // Determine if this hexagon has a star
    const foundStar = flippedHexagon.hasHiddenStar
    
    // Count total stars in the game
    const totalStarsInGame = allHexagons.filter(h => h.hasHiddenStar).length
    
    // For now, we'll say they found 1 star if this hexagon has a star
    // In a more complex implementation, you'd track stars found across the session
    const starsFound = foundStar ? 1 : 0
    
    // Determine if all stars have been found (simplified for single flip)
    const foundAllStars = foundStar && totalStarsInGame === 1
    
    // Determine outcome type
    let outcomeType: GameOutcomeType = 'NO_REWARD'
    let message = `You revealed: ${flippedHexagon.text}`
    
    if (foundStar) {
      if (foundAllStars) {
        outcomeType = 'WIN'
        message = `🎉 Congratulations! You found the star and revealed: ${flippedHexagon.text}!`
      } else {
        outcomeType = 'WIN'
        message = `⭐ Great! You found a star! ${flippedHexagon.text}`
      }
    }
    
    return {
      type: outcomeType,
      hexagonId: flippedHexagon.id,
      starsFound: starsFound,
      totalStarsInGame: totalStarsInGame,
      foundAllStars: foundAllStars,
      value: flippedHexagon.text,
      rewardIds: flippedHexagon.rewardId ? [flippedHexagon.rewardId] : [],
      message: message
    }
    
  } catch (error) {
    console.error('Hexa calculation error:', error)
    return {
      type: 'NO_REWARD',
      hexagonId: flippedHexagon.id,
      starsFound: 0,
      totalStarsInGame: 0,
      foundAllStars: false,
      rewardIds: [],
      message: 'Error calculating result'
    }
  }
}

/**
 * Basic anti-cheat validation for game results
 * This can be enhanced with more sophisticated checks
 */
async function validateGameResult(gameResult: any): Promise<boolean> {
  try {
    // Basic validation - check if result timing is reasonable
    const now = new Date()
    const playTime = now.getTime() - gameResult.playedAt.getTime()
    
    // Reject if result was generated too quickly (less than 1 second)
    if (playTime < 1000) {
      console.warn(`Suspiciously fast game result: ${gameResult._id}, time: ${playTime}ms`)
      return false
    }
    
    // Reject if result was generated too slowly (more than 10 minutes)
    if (playTime > 10 * 60 * 1000) {
      console.warn(`Suspiciously slow game result: ${gameResult._id}, time: ${playTime}ms`)
      return false
    }
    
    // Add more validation logic here as needed
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
