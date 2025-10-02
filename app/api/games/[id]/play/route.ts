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
import { logger } from '../../../../lib/logger'

/**
 * Game Play API Route Handler
 * 
 * This endpoint handles the actual game play mechanics:
 * - POST: Play the game and return results
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
    const playRequest: PlayGameRequest & { hexagonId?: string; attemptId?: string; gameType?: string; result?: any } = await request.json()
    
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
    
    // Validate supported game types — QUIZZZ only
    const supported = ['QUIZZZ']
    if (!supported.includes(game.type)) {
      return NextResponse.json({
        success: false,
        message: 'Unsupported game type',
        error: {
          code: 'UNSUPPORTED_GAME_TYPE',
          message: `Unsupported game type: ${game.type}`
        }
      }, { status: 400 })
    }
    
    // No additional server config validation needed here for supported types
    // (QUIZZZ only)
    
    
    // Find or create participant
    let participant = await (ParticipantModel as any).findByContact(
      playRequest.participant?.email,
      playRequest.participant?.phone
    )

    // If not found via contact, attempt uuid-based lookup (guest/trial support)
    if (!participant && (playRequest as any)?.participant?.uuid) {
      participant = await ParticipantModel.findOne({ uuid: (playRequest as any).participant.uuid })
    }

    // Derive login provider from httpOnly user-session cookie (POC persistence)
    const sessionCookie = request.cookies.get('user-session')?.value
    let loginProvider: 'facebook' | 'email' | undefined
    try {
      if (sessionCookie) {
        const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8'))
        if (decoded?.provider === 'facebook') loginProvider = 'facebook'
        else if (decoded?.provider === 'email') loginProvider = 'email'
      }
    } catch {}

    // Set referral info from request if available
    const incomingUuid = (playRequest as any).participant?.uuid as string | undefined
    const incomingRef = (playRequest as any).ref as string | undefined
    
    if (!participant) {
      // Create new participant (allow uuid-only for guest/trial)
      participant = new ParticipantModel({
        name: playRequest.participant?.name || 'Guest',
        email: playRequest.participant?.email || undefined,
        phone: playRequest.participant?.phone || undefined,
        uuid: incomingUuid,
        referrerUuid: incomingRef && incomingUuid !== incomingRef ? incomingRef : undefined,
        groupIds: [],
        gameResults: [],
        totalGamesPlayed: 0,
        totalRewardsEarned: 0,
        metadata: loginProvider ? { loginProvider } : {}
      })
      
      await participant.save()

      // If referrer exists, optionally record the invite count (stored in metadata)
      if (incomingRef && (!incomingUuid || incomingUuid !== incomingRef)) {
        await ParticipantModel.updateOne(
          { uuid: incomingRef },
          { $inc: { 'metadata.invitedCount': 1 } }
        )
      }
    } else {
      // Update uuid/referrer if missing; set login provider if not recorded yet
      const updates: any = {}
      if (incomingUuid && !participant.uuid) updates.uuid = incomingUuid
      if (incomingRef && incomingRef !== participant.uuid && !participant.referrerUuid) updates.referrerUuid = incomingRef
      if (loginProvider && !(participant as any).metadata?.loginProvider) {
        updates['metadata.loginProvider'] = loginProvider
      }
      if (Object.keys(updates).length) {
        await ParticipantModel.updateOne({ _id: participant._id }, { $set: updates })
      }
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
    
    // No per-click item selection; supported games post completion directly
    
    // Calculate game result based on type
    let gameOutcome: GameOutcome
    const isAttemptCompletion = (game.type === 'QUIZZZ')

    if (game.type === 'QUIZZZ') {
      const clientOutcome = (playRequest as any).result
      if (!clientOutcome || !clientOutcome.type) {
        return NextResponse.json({
          success: false,
          message: 'Missing result outcome for quiz game',
          error: { code: 'VALIDATION_ERROR', message: 'Result payload is required for QUIZZZ' }
        }, { status: 400 })
      }
      gameOutcome = clientOutcome as GameOutcome
    } else {
      return NextResponse.json({ success: false, message: 'Unsupported game type at runtime', error: { code: 'UNSUPPORTED_GAME_TYPE', message: 'Only QUIZZZ is supported' } }, { status: 400 })
    }
    
    const outcome: GameOutcome = gameOutcome

    // Idempotency by (gameId, participantId, sessionId)
    const attemptId = (playRequest as any).attemptId || sessionId
    if (attemptId) {
      const existing = await GameResultModel.findOne({ gameId: game._id, participantId: participant._id, sessionId: attemptId })
      if (existing) {
        return NextResponse.json({ 
          success: true, 
          data: { 
            result: existing.outcome,
            rewards: [],
            canPlayAgain: false
          }, 
          message: 'Duplicate attempt ignored' 
        })
      }
    }
    
    // Create game result record (validated only for attempt-completion types)
    const gameResultRecord = new GameResultModel({
      gameId: game._id,
      participantId: participant._id,
      outcome: outcome,
      playedAt: new Date(),
      ipAddress: clientIP,
      userAgent: userAgent,
      sessionId: attemptId || sessionId,
      isValidated: isAttemptCompletion
    })
    
    await gameResultRecord.save()

    if (isAttemptCompletion) {
      // Update participant stats
      participant.gameResults.push(gameResultRecord._id)
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
    
if (outcome.type === 'WIN' && outcome.rewardIds.length > 0 && isAttemptCompletion) {
      for (const rewardId of outcome.rewardIds) {
        try {
          const reward = await RewardModel.findById(rewardId)
          
          if (reward && (reward as any).canBeClaimed()) {
            // Create reward claim
            const rewardClaim = new RewardClaimModel({
              rewardId: reward._id,
              participantId: participant._id,
              gameResultId: gameResultRecord._id,
              status: 'AVAILABLE',
              claimedAt: new Date(),
              expiresAt: reward.expiresAt || null,
                metadata: {
                  gameTitle: game.title,
                  itemText: (typeof outcome.value === 'string' && outcome.value) || (outcome.value != null ? String(outcome.value) : 'Game item'),
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
          logger.error('Reward distribution error', { error: rewardError, rewardId })
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
      message: 'Game played successfully'
    })
    
  } catch (error) {
    logger.error('Play game error', { error })
    
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
 * Calculate hex flip result for hex-based layouts
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
        message = `Congratulations! You found the star and revealed: ${flippedHexagon.text}!`
      } else {
        outcomeType = 'WIN'
        message = `Great! You found a star! ${flippedHexagon.text}`
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
    logger.error('Hexa calculation error', { error, hexagonId: flippedHexagon?.id })
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
 * Calculate Penalty Shootout result for player selection
 * Determines if the player scores a goal or misses
 */
function calculatePenaltyResult(
  selectedPlayer: any, 
  allPlayers: any[], 
  participantId: string, 
  sessionId: string
): GameOutcome {
  try {
    // Determine if this player scores a goal
    const scoredGoal = selectedPlayer.hasGoal
    
    // Count total goals in the game
    const totalGoalsInGame = allPlayers.filter(p => p.hasGoal).length
    
    // For penalty shootout, we track "goals" as "stars"
    const goalsScored = scoredGoal ? 1 : 0
    
    // In penalty shootout, game completion is handled by the frontend component
    // based on the number of attempts, so we don't determine foundAllStars here
    const foundAllStars = false // Game completion is determined by the component
    
    // Determine outcome type
    let outcomeType: GameOutcomeType = 'NO_REWARD'
    let message = `Player #${selectedPlayer.playerNumber}: ${scoredGoal ? 'GOAL!' : 'MISS!'}`
    
    if (scoredGoal) {
      outcomeType = 'WIN'
      message = `GOAL! Player #${selectedPlayer.playerNumber} scores!`
    } else {
      outcomeType = 'NO_REWARD'
      message = `MISS! Player #${selectedPlayer.playerNumber} missed the shot!`
    }
    
    return {
      type: outcomeType,
      hexagonId: selectedPlayer.id,
      starsFound: goalsScored, // Goals are treated as "stars" for consistency
      totalStarsInGame: totalGoalsInGame,
      foundAllStars: foundAllStars,
      value: `Player #${selectedPlayer.playerNumber}`,
      rewardIds: [], // Rewards typically handled at game completion, not per shot
      message: message
    }
    
  } catch (error) {
    logger.error('Penalty calculation error', { error, playerId: selectedPlayer?.id })
    return {
      type: 'NO_REWARD',
      hexagonId: selectedPlayer.id,
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
    
    // Relaxed timing check: do not reject; optionally log
    if (playTime < 200) {
      logger.warn('Fast game result', { resultId: gameResult._id, playTime })
    }
    
    // Reject if result was generated too slowly (more than 10 minutes)
    if (playTime > 10 * 60 * 1000) {
      logger.warn('Suspiciously slow game result', { resultId: gameResult._id, playTime })
      return false
    }
    
    // Add more validation logic here as needed
    // - Pattern analysis
    // - Device fingerprinting
    // - Behavioral analysis
    
    return true
    
  } catch (error) {
    logger.error('Validation error', { error })
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
