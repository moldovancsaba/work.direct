import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../lib/mongodb'
import ParticipantModel from '../../lib/models/Participant'
import { ApiResponse } from '../../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Participants API Route Handler
 * 
 * This endpoint handles participant registration and management:
 * - POST: Register new participants
 * - GET: Retrieve participants with filtering and pagination
 * 
 * Used by game interfaces for participant registration and admin tools for management
 */

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse request body
    const participantData = await request.json()
    
    // Validate required fields
    if (!participantData.name) {
      return NextResponse.json({
        success: false,
        message: 'Participant name is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required participant information'
        }
      }, { status: 400 })
    }
    
    // Validate contact information (at least email or phone required)
    if (!participantData.email && !participantData.phone) {
      return NextResponse.json({
        success: false,
        message: 'Either email or phone number is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Contact information is required for participant registration'
        }
      }, { status: 400 })
    }
    
    // Check if participant already exists
    const existingParticipant = await (ParticipantModel as any).findByContact(
      participantData.email,
      participantData.phone
    )
    
    if (existingParticipant) {
      return NextResponse.json({
        success: true,
        data: existingParticipant,
        message: 'Participant already exists'
      })
    }
    
    // Generate UUID for new participant if not provided
    const uuid = participantData.uuid || uuidv4()
    
    // Try derive login provider from httpOnly user-session cookie (POC)
    const sessionCookie = request.cookies.get('user-session')?.value
    let loginProvider: 'facebook' | 'email' | undefined
    try {
      if (sessionCookie) {
        const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8'))
        if (decoded?.provider === 'facebook') loginProvider = 'facebook'
        else if (decoded?.provider === 'email') loginProvider = 'email'
      }
    } catch {}

    // Create new participant
    const participant = new ParticipantModel({
      name: participantData.name,
      email: participantData.email || undefined,
      phone: participantData.phone || undefined,
      uuid: uuid,
      referrerUuid: participantData.referrerUuid || undefined,
      groupIds: participantData.groupIds || [],
      gameResults: [],
      totalGamesPlayed: 0,
      totalRewardsEarned: 0,
      metadata: { ...(participantData.metadata || {}), ...(loginProvider ? { loginProvider } : {}) },
      isActive: true
    })
    
    // Save to database
    const savedParticipant = await participant.save()
    
    return NextResponse.json({
      success: true,
      data: savedParticipant,
      message: 'Participant registered successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Register participant error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        message: 'Participant validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 })
    }
    
    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Participant with this contact information already exists',
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Duplicate participant contact information'
        }
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to register participant',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Cap at 100
    const skip = (page - 1) * limit
    
    // Filter parameters
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default to true
    const groupId = searchParams.get('groupId')
    const searchText = searchParams.get('search')
    
    // Build query
    const query: any = {}
    
    if (activeOnly) {
      query.isActive = true
    }
    
    if (groupId) {
      query.groupIds = groupId
    }
    
    if (searchText) {
      query.$text = { $search: searchText }
    }
    
    // Execute query
    // Fetch participants (lean objects for augmentation)
    const participantsPromise = ParticipantModel.find(query)
      .sort(searchText ? { score: { $meta: 'textScore' } } : { lastActivityAt: -1 })
      .skip(skip)
      .limit(limit)
      // Select essential fields + loginProvider for admin list view
      .select('name email phone uuid referrerUuid createdAt lastActivityAt totalGamesPlayed totalRewardsEarned isActive metadata.loginProvider')
      .lean()
      .exec()
    
    const countPromise = ParticipantModel.countDocuments(query)
    
    const [participants, totalCount] = await Promise.all([participantsPromise, countPromise])
    
    // Compute invites count per participant based on referrerUuid linkage
    // WHAT: Count how many participants joined via each participant's referral (uuid)
    // WHY: Admin requested visibility into referral effectiveness per participant
    const uuids = participants.map((p: any) => p.uuid).filter(Boolean)
    let invitesByReferrer: Record<string, number> = {}
    if (uuids.length > 0) {
      const inviteAgg = await ParticipantModel.aggregate([
        { $match: { referrerUuid: { $in: uuids } } },
        { $group: { _id: '$referrerUuid', count: { $sum: 1 } } }
      ])
      invitesByReferrer = inviteAgg.reduce((acc: Record<string, number>, row: any) => {
        acc[row._id] = row.count
        return acc
      }, {})
    }

    const augmented = participants.map((p: any) => ({
      ...p,
      invitesCount: p.uuid ? (invitesByReferrer[p.uuid] || 0) : 0,
      loginProvider: p?.metadata?.loginProvider || (p?.email ? 'email' : undefined)
    }))
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      success: true,
      data: augmented,
      message: `Retrieved ${augmented.length} participants`,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    })
    
  } catch (error) {
    console.error('Get participants error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve participants',
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 })
  }
}

/**
 * Delete a participant by ID
 * 
 * Handles participant removal with proper validation and cleanup
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Connect to database
    await connectDB()
    
    // Parse query parameters to get participant ID
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('id')
    
    // Validate participant ID
    if (!participantId) {
      return NextResponse.json({
        success: false,
        message: 'Participant ID is required',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing participant ID parameter'
        }
      }, { status: 400 })
    }
    
    // Find and delete the participant
    const deletedParticipant = await ParticipantModel.findByIdAndDelete(participantId)
    
    if (!deletedParticipant) {
      return NextResponse.json({
        success: false,
        message: 'Participant not found',
        error: {
          code: 'NOT_FOUND',
          message: 'No participant exists with the provided ID'
        }
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: { id: participantId },
      message: 'Participant deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete participant error:', error)
    
    // Handle invalid ObjectId errors
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json({
        success: false,
        message: 'Invalid participant ID format',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Participant ID must be a valid MongoDB ObjectId'
        }
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete participant',
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
