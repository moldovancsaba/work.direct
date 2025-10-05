import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import ReferralTrackingModel from '../../../lib/models/ReferralTracking'
import ParticipantModel from '../../../lib/models/Participant'
import { ApiResponse } from '../../../types'
import { logger } from '../../../lib/logger'

/**
 * Referral Tracking API Route (v4.10.0)
 * 
 * WHAT: Track referral clicks and conversions
 * WHY: Attribute growth to referrers and calculate rewards
 * 
 * POST /api/referrals/track/click - Track referral link click
 * POST /api/referrals/track/convert - Track referral conversion (signup)
 */

/**
 * POST /api/referrals/track
 * Main tracking endpoint that handles both clicks and conversions
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB()
    
    // Parse request body
    const body = await request.json()
    const { 
      referralCode,
      eventType = 'CLICK',
      referredUuid,
      participantId,
      metadata = {}
    } = body
    
    // Validate required fields
    if (!referralCode) {
      return NextResponse.json({
        success: false,
        message: 'Referral code is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'referralCode field is required'
        }
      }, { status: 400 })
    }
    
    // Find referral tracking record
    const referralTracking = await (ReferralTrackingModel as any).findByCode(referralCode)
    if (!referralTracking) {
      return NextResponse.json({
        success: false,
        message: 'Referral code not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Invalid or expired referral code'
        }
      }, { status: 404 })
    }
    
    // Check if referral is expired
    const isExpired = referralTracking.expiresAt && new Date() > referralTracking.expiresAt
    if (isExpired) {
      return NextResponse.json({
        success: false,
        message: 'Referral code expired',
        error: {
          code: 'EXPIRED',
          message: 'This referral link has expired'
        }
      }, { status: 410 })
    }
    
    // Get IP and user agent for fraud detection
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Handle different event types
    switch (eventType) {
      case 'CLICK':
        // Increment click count
        referralTracking.clickCount += 1
        referralTracking.ipAddress = ipAddress
        referralTracking.userAgent = userAgent
        referralTracking.addEvent('CLICK', { ipAddress, userAgent, ...metadata })
        
        await referralTracking.save()
        
        logger.info('Referral click tracked', { 
          referralCode, 
          referrerUuid: referralTracking.referrerUuid,
          clickCount: referralTracking.clickCount 
        })
        
        return NextResponse.json({
          success: true,
          data: {
            referralCode,
            clickCount: referralTracking.clickCount,
            referrerUuid: referralTracking.referrerUuid
          },
          message: 'Click tracked successfully'
        })
      
      case 'SIGNUP':
      case 'CONVERT':
        // Validate conversion fields
        if (!referredUuid || !participantId) {
          return NextResponse.json({
            success: false,
            message: 'Referred user information required',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'referredUuid and participantId are required for conversion tracking'
            }
          }, { status: 400 })
        }
        
        // Check if already converted
        if (referralTracking.status === 'CONVERTED' || referralTracking.status === 'REWARDED') {
          return NextResponse.json({
            success: false,
            message: 'Referral already converted',
            error: {
              code: 'ALREADY_CONVERTED',
              message: 'This referral link has already been used'
            }
          }, { status: 409 })
        }
        
        // Mark as converted
        referralTracking.markConverted(referredUuid, participantId)
        await referralTracking.save()
        
        // Update referrer's stats
        const referrer = await (ParticipantModel as any).findByUuid(referralTracking.referrerUuid)
        if (referrer) {
          referrer.addReferral(true) // Mark as successful referral
          await referrer.save()
        }
        
        // Update referred participant's referrerUuid
        const referred = await ParticipantModel.findById(participantId)
        if (referred && !referred.referrerUuid) {
          referred.referrerUuid = referralTracking.referrerUuid
          await referred.save()
        }
        
        logger.info('Referral conversion tracked', { 
          referralCode, 
          referrerUuid: referralTracking.referrerUuid,
          referredUuid,
          participantId
        })
        
        return NextResponse.json({
          success: true,
          data: {
            referralCode,
            status: 'CONVERTED',
            referrerUuid: referralTracking.referrerUuid,
            referredUuid,
            conversionDate: referralTracking.conversionDate
          },
          message: 'Conversion tracked successfully'
        })
      
      case 'FIRST_GAME':
        // Track when referred user plays their first game
        const isConverted = referralTracking.status === 'CONVERTED' || referralTracking.status === 'REWARDED'
        if (!isConverted) {
          return NextResponse.json({
            success: false,
            message: 'Cannot track first game for non-converted referral',
            error: {
              code: 'NOT_CONVERTED',
              message: 'User must sign up first'
            }
          }, { status: 400 })
        }
        
        referralTracking.firstGameDate = new Date()
        referralTracking.addEvent('FIRST_GAME', metadata)
        await referralTracking.save()
        
        // Update referrer's successful referrals count
        const referrerForGame = await (ParticipantModel as any).findByUuid(referralTracking.referrerUuid)
        if (referrerForGame) {
          // Optionally award bonus points for first game completion
          referrerForGame.addReferralPoints(10) // 10 bonus points
          await referrerForGame.save()
        }
        
        logger.info('First game tracked for referral', { 
          referralCode, 
          referrerUuid: referralTracking.referrerUuid 
        })
        
        return NextResponse.json({
          success: true,
          data: {
            referralCode,
            firstGameDate: referralTracking.firstGameDate
          },
          message: 'First game tracked successfully'
        })
      
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid event type',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'eventType must be one of: CLICK, SIGNUP, CONVERT, FIRST_GAME'
          }
        }, { status: 400 })
    }
    
  } catch (error) {
    logger.error('Referral tracking error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to track referral event',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * GET /api/referrals/track?code={referralCode}
 * Get tracking information for a referral code
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB()
    
    // Get referral code from query params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'Referral code is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'code query parameter is required'
        }
      }, { status: 400 })
    }
    
    // Find referral tracking record
    const referralTracking = await (ReferralTrackingModel as any).findByCode(code)
    if (!referralTracking) {
      return NextResponse.json({
        success: false,
        message: 'Referral code not found',
        error: {
          code: 'NOT_FOUND',
          message: 'Invalid referral code'
        }
      }, { status: 404 })
    }
    
    // Get referrer information
    const referrer = await (ParticipantModel as any).findByUuid(referralTracking.referrerUuid)
    
    return NextResponse.json({
      success: true,
      data: {
        referralCode: referralTracking.referralCode,
        referrerName: referrer?.name || 'A friend',
        gameId: referralTracking.gameId?.toString(),
        status: referralTracking.status,
        clickCount: referralTracking.clickCount,
        isExpired: referralTracking.expiresAt ? new Date() > referralTracking.expiresAt : false,
        expiresAt: referralTracking.expiresAt,
        createdAt: referralTracking.createdAt
      },
      message: 'Referral tracking information retrieved successfully'
    })
    
  } catch (error) {
    logger.error('Get referral tracking error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve referral tracking information',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
