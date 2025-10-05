import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import ReferralTrackingModel from '../../../lib/models/ReferralTracking'
import ParticipantModel from '../../../lib/models/Participant'
import { ApiResponse } from '../../../types'
import { logger } from '../../../lib/logger'

/**
 * Referral Statistics API Route (v4.10.0)
 * 
 * WHAT: Provide referral analytics and leaderboard data
 * WHY: Enable referral dashboard and admin analytics
 * 
 * GET /api/referrals/stats?uuid={uuid} - Get user's referral stats
 * GET /api/referrals/stats/platform - Get platform-wide referral stats
 * GET /api/referrals/stats/leaderboard - Get top referrers
 */

/**
 * GET /api/referrals/stats
 * Get referral statistics for a specific user or platform-wide
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const uuid = searchParams.get('uuid')
    const type = searchParams.get('type') || 'user'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    switch (type) {
      case 'user':
        // Get stats for specific user
        if (!uuid) {
          return NextResponse.json({
            success: false,
            message: 'UUID is required for user stats',
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
        
        // Get referral stats using model method
        const userStats = await (ReferralTrackingModel as any).getUserStats(uuid)
        
        // Get referred participants
        const referredParticipants = await (ParticipantModel as any).findReferralsByUuid(uuid)
        
        return NextResponse.json({
          success: true,
          data: {
            uuid,
            name: participant.name,
            stats: {
              ...userStats,
              referralPoints: participant.referralStats?.referralPoints || 0,
              referralRewards: participant.referralStats?.referralRewards?.length || 0
            },
            referrals: referredParticipants.map((p: any) => ({
              uuid: p.uuid,
              name: p.name,
              joinedAt: p.createdAt,
              totalGamesPlayed: p.totalGamesPlayed,
              isActive: p.isActive
            })).slice(0, 20) // Limit to 20 most recent
          },
          message: 'User referral statistics retrieved successfully'
        })
      
      case 'platform':
        // Get platform-wide referral stats
        const platformStats = await (ParticipantModel as any).getReferralStats()
        
        // Get total referral tracking records
        const [totalLinks, activeLinks, expiredLinks] = await Promise.all([
          ReferralTrackingModel.countDocuments({}),
          ReferralTrackingModel.countDocuments({ status: { $in: ['PENDING', 'CONVERTED'] } }),
          ReferralTrackingModel.countDocuments({ status: 'EXPIRED' })
        ])
        
        // Get conversion funnel data
        const conversionFunnel = await ReferralTrackingModel.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalClicks: { $sum: '$clickCount' }
            }
          }
        ])
        
        // Calculate platform conversion rate
        const totalClicks = conversionFunnel.reduce((sum, item) => sum + item.totalClicks, 0)
        const conversions = conversionFunnel.find(item => 
          item._id === 'CONVERTED' || item._id === 'REWARDED'
        )?.count || 0
        
        const platformConversionRate = totalClicks > 0 ? (conversions / totalClicks * 100) : 0
        
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              ...platformStats,
              totalLinks,
              activeLinks,
              expiredLinks,
              platformConversionRate: Math.round(platformConversionRate * 10) / 10
            },
            funnel: conversionFunnel.map(item => ({
              status: item._id,
              count: item.count,
              totalClicks: item.totalClicks
            }))
          },
          message: 'Platform referral statistics retrieved successfully'
        })
      
      case 'leaderboard':
        // Get top referrers leaderboard
        const topReferrers = await (ParticipantModel as any).findTopReferrers(limit, true)
        
        return NextResponse.json({
          success: true,
          data: {
            leaderboard: topReferrers.map((p: any, index: number) => ({
              rank: index + 1,
              uuid: p.uuid,
              name: p.name,
              totalReferrals: p.referralStats?.totalReferrals || 0,
              successfulReferrals: p.referralStats?.successfulReferrals || 0,
              referralPoints: p.referralStats?.referralPoints || 0,
              lastReferralAt: p.referralStats?.lastReferralAt,
              joinedAt: p.createdAt
            }))
          },
          message: 'Referral leaderboard retrieved successfully'
        })
      
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid stats type',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'type must be one of: user, platform, leaderboard'
          }
        }, { status: 400 })
    }
    
  } catch (error) {
    logger.error('Get referral stats error', { error })
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve referral statistics',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
