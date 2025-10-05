import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import ReferralTrackingModel from '../../../lib/models/ReferralTracking'
import ParticipantModel from '../../../lib/models/Participant'
import { ApiResponse } from '../../../types'
import { logger } from '../../../lib/logger'

/**
 * Referral Link Generation API Route (v4.10.0)
 * 
 * WHAT: Generate unique referral links for participants to share
 * WHY: Enable viral growth through trackable, shareable links
 * 
 * POST /api/referrals/generate
 * - Creates a new referral tracking record
 * - Generates unique short code for attribution
 * - Supports game-specific or platform-wide referrals
 */

/**
 * Generate a unique referral code
 * WHAT: Create short, URL-safe tracking code
 * WHY: Easy to share, type, and remember
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * POST /api/referrals/generate
 * Generate a new referral link
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB()
    
    // Parse request body
    const body = await request.json()
    const { 
      referrerUuid, 
      gameId = null,
      source = 'other' 
    } = body
    
    // Validate required fields
    if (!referrerUuid) {
      return NextResponse.json({
        success: false,
        message: 'Referrer UUID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'referrerUuid field is required'
        }
      }, { status: 400 })
    }
    
    // Verify referrer exists
    const referrer = await (ParticipantModel as any).findByUuid(referrerUuid)
    if (!referrer) {
      return NextResponse.json({
        success: false,
        message: 'Referrer not found',
        error: {
          code: 'NOT_FOUND',
          message: 'No participant found with the provided UUID'
        }
      }, { status: 404 })
    }
    
    // Check for fraud patterns
    const fraudCheck = await (ReferralTrackingModel as any).detectFraud(
      referrerUuid,
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      undefined
    )
    
    if (fraudCheck.suspicious) {
      logger.warn('Suspicious referral generation attempt', { 
        referrerUuid, 
        reasons: fraudCheck.reasons,
        ip: request.headers.get('x-forwarded-for')
      })
      
      return NextResponse.json({
        success: false,
        message: 'Unable to generate referral link',
        error: {
          code: 'FRAUD_DETECTED',
          message: 'Suspicious activity detected. Please contact support.',
          details: fraudCheck.reasons
        }
      }, { status: 429 })
    }
    
    // Generate unique referral code
    let referralCode = generateReferralCode()
    let attempts = 0
    const maxAttempts = 10
    
    // Ensure code is unique
    while (attempts < maxAttempts) {
      const existing = await (ReferralTrackingModel as any).findByCode(referralCode)
      if (!existing) break
      referralCode = generateReferralCode()
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      logger.error('Failed to generate unique referral code', { referrerUuid })
      return NextResponse.json({
        success: false,
        message: 'Failed to generate unique referral code',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Please try again'
        }
      }, { status: 500 })
    }
    
    // Create referral tracking record
    const referralTracking = new ReferralTrackingModel({
      referrerUuid,
      gameId: gameId || undefined,
      referralCode,
      status: 'PENDING',
      source,
      clickCount: 0,
      rewardEarned: false,
      events: []
    })
    
    await referralTracking.save()
    
    // Build referral URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playmass.doneisbetter.com'
    const referralUrl = gameId 
      ? `${baseUrl}/play/${gameId}?ref=${referralCode}`
      : `${baseUrl}?ref=${referralCode}`
    
    logger.info('Referral link generated', { 
      referrerUuid, 
      referralCode,
      gameId,
      trackingId: referralTracking._id 
    })
    
    return NextResponse.json({
      success: true,
      data: {
        referralCode,
        referralUrl,
        trackingId: referralTracking._id.toString(),
        shareMessage: gameId 
          ? `Check out this awesome game! ${referralUrl}`
          : `Join me on PlayMass! ${referralUrl}`,
        createdAt: referralTracking.createdAt
      },
      message: 'Referral link generated successfully'
    })
    
  } catch (error) {
    logger.error('Generate referral link error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to generate referral link',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * GET /api/referrals/generate?uuid={uuid}
 * Get all referral links for a participant
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB()
    
    // Get UUID from query params
    const { searchParams } = new URL(request.url)
    const uuid = searchParams.get('uuid')
    
    if (!uuid) {
      return NextResponse.json({
        success: false,
        message: 'UUID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'uuid query parameter is required'
        }
      }, { status: 400 })
    }
    
    // Verify participant exists
    const participant = await (ParticipantModel as any).findByUuid(uuid)
    if (!participant) {
      return NextResponse.json({
        success: false,
        message: 'Participant not found',
        error: {
          code: 'NOT_FOUND',
          message: 'No participant found with the provided UUID'
        }
      }, { status: 404 })
    }
    
    // Get all referral links for this user
    const referrals = await ReferralTrackingModel.find({ referrerUuid: uuid })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec()
    
    // Build referral URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://playmass.doneisbetter.com'
    const referralData = referrals.map(ref => ({
      referralCode: ref.referralCode,
      referralUrl: ref.gameId 
        ? `${baseUrl}/play/${ref.gameId}?ref=${ref.referralCode}`
        : `${baseUrl}?ref=${ref.referralCode}`,
      gameId: ref.gameId?.toString(),
      status: ref.status,
      clickCount: ref.clickCount,
      converted: ref.status === 'CONVERTED' || ref.status === 'REWARDED',
      conversionDate: ref.conversionDate,
      rewardEarned: ref.rewardEarned,
      rewardAmount: ref.rewardAmount,
      createdAt: ref.createdAt,
      expiresAt: ref.expiresAt,
      isExpired: ref.expiresAt ? new Date() > ref.expiresAt : false
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        referrals: referralData,
        total: referralData.length,
        stats: {
          totalClicks: referrals.reduce((sum, r) => sum + r.clickCount, 0),
          totalConversions: referrals.filter(r => r.status === 'CONVERTED' || r.status === 'REWARDED').length,
          totalRewards: referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0)
        }
      },
      message: 'Referral links retrieved successfully'
    })
    
  } catch (error) {
    logger.error('Get referral links error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve referral links',
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
