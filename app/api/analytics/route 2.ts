import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../lib/mongodb'
import GameModel from '../../lib/models/Game'
import ParticipantModel from '../../lib/models/Participant'
import GameResultModel from '../../lib/models/GameResult'
import { ApiResponse } from '../../types'

/**
 * Analytics API Route Handler
 * 
 * This endpoint provides comprehensive analytics data:
 * - GET: Retrieve analytics with date range filtering
 * 
 * Used by admin analytics dashboard for insights and reporting
 */

interface AnalyticsQuery {
  dateRange?: '24h' | '7d' | '30d' | '90d'
  startDate?: string
  endDate?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') as '24h' | '7d' | '30d' | '90d' || '7d'
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    
    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()
    
    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
    } else {
      const now = new Date()
      switch (dateRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
    }

    // Get overview statistics
    const [
      totalGames,
      activeGames,
      totalParticipants,
      activeParticipants,
      totalPlays,
      recentPlays,
      avgSessionData,
      completionRateData
    ] = await Promise.all([
      GameModel.countDocuments(),
      GameModel.countDocuments({ status: 'ACTIVE' }),
      ParticipantModel.countDocuments(),
      ParticipantModel.countDocuments({ isActive: true }),
      GameResultModel.countDocuments(),
      GameResultModel.countDocuments({ playedAt: { $gte: startDate, $lte: endDate } }),
      // Average session calculation (placeholder - would need session tracking)
      GameResultModel.aggregate([
        { $match: { playedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$sessionId', count: { $sum: 1 } } },
        { $group: { _id: null, avgSession: { $avg: '$count' } } }
      ]),
      // Completion rate calculation
      GameResultModel.aggregate([
        { $match: { playedAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            wins: { $sum: { $cond: [{ $eq: ['$outcome.type', 'WIN'] }, 1, 0] } }
          }
        }
      ])
    ])

    const avgSession = avgSessionData[0]?.avgSession || 0
    const completionData = completionRateData[0]
    const completionRate = completionData ? (completionData.wins / completionData.total * 100) : 0

    // Get game-specific statistics
    const gameStats = await GameModel.aggregate([
      {
        $lookup: {
          from: 'gameresults',
          localField: '_id',
          foreignField: 'gameId',
          as: 'results'
        }
      },
      {
        $addFields: {
          totalPlays: { $size: '$results' },
          recentPlays: {
            $size: {
              $filter: {
                input: '$results',
                cond: {
                  $and: [
                    { $gte: ['$$this.playedAt', startDate] },
                    { $lte: ['$$this.playedAt', endDate] }
                  ]
                }
              }
            }
          },
          wins: {
            $size: {
              $filter: {
                input: '$results',
                cond: { $eq: ['$$this.outcome.type', 'WIN'] }
              }
            }
          },
          uniqueParticipants: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$results',
                  as: 'result',
                  in: '$$result.participantId'
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $gt: ['$totalPlays', 0] },
              { $multiply: [{ $divide: ['$wins', '$totalPlays'] }, 100] },
              0
            ]
          },
          avgScore: {
            $cond: [
              { $gt: ['$totalPlays', 0] },
              {
                $avg: {
                  $map: {
                    input: '$results',
                    as: 'result',
                    in: '$$result.outcome.starsFound'
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          title: 1,
          status: 1,
          type: 1,
          totalPlays: 1,
          recentPlays: 1,
          uniqueParticipants: 1,
          winRate: 1,
          avgScore: 1,
          createdAt: 1
        }
      },
      { $sort: { recentPlays: -1, totalPlays: -1 } },
      { $limit: 10 }
    ])

    // Get daily activity data
    const dailyActivity = await GameResultModel.aggregate([
      { 
        $match: { 
          playedAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$playedAt' },
            month: { $month: '$playedAt' },
            day: { $dayOfMonth: '$playedAt' }
          },
          plays: { $sum: 1 },
          uniqueParticipants: { $addToSet: '$participantId' }
        }
      },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          participants: { $size: '$uniqueParticipants' }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          plays: 1,
          participants: 1
        }
      },
      { $sort: { date: 1 } }
    ])

    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
    const previousPlays = await GameResultModel.countDocuments({
      playedAt: { $gte: previousStartDate, $lt: startDate }
    })
    
    const previousParticipants = await GameResultModel.distinct('participantId', {
      playedAt: { $gte: previousStartDate, $lt: startDate }
    })

    // Calculate growth rates
    const playsGrowth = previousPlays > 0 ? ((recentPlays - previousPlays) / previousPlays * 100) : 100
    const participantsGrowth = previousParticipants.length > 0 ? 
      ((activeParticipants - previousParticipants.length) / previousParticipants.length * 100) : 100

    // Prepare response data
    const analytics = {
      overview: {
        totalPlays: recentPlays,
        totalPlayers: activeParticipants,
        avgSessionTime: avgSession > 0 ? `${Math.round(avgSession * 4)}m ${Math.round((avgSession * 4 % 1) * 60)}s` : '0m 0s',
        completionRate: Math.round(completionRate * 10) / 10,
        growth: {
          plays: Math.round(playsGrowth * 10) / 10,
          players: Math.round(participantsGrowth * 10) / 10
        }
      },
      gameStats: gameStats.map(game => ({
        id: game._id.toString(),
        title: game.title,
        type: game.type,
        status: game.status,
        plays: game.recentPlays || 0,
        totalPlays: game.totalPlays || 0,
        players: game.uniqueParticipants || 0,
        winRate: Math.round(game.winRate || 0),
        avgScore: Math.round((game.avgScore || 0) * 10) / 10,
        createdAt: game.createdAt
      })),
      chartData: {
        daily: dailyActivity.map(day => ({
          date: day.date.toISOString().split('T')[0],
          plays: day.plays,
          participants: day.participants
        }))
      },
      summary: {
        totalGames,
        activeGames,
        totalParticipants,
        activeParticipants,
        totalPlays,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          period: dateRange
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Analytics data retrieved successfully'
    })

  } catch (error) {
    console.error('Analytics error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve analytics data',
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
