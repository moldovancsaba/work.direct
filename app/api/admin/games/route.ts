import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import GameModel from '../../../lib/models/Game'
import RewardModel from '../../../lib/models/Reward'
import ParticipantModel from '../../../lib/models/Participant'
import GameResultModel from '../../../lib/models/GameResult'
import { getAdminUser } from '../../../lib/auth'
import { REGISTRY } from '../../../modules/registry'
import { v4 as uuidv4 } from 'uuid'

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
        // WHAT: Count unique participants and sessions (attempts) per game via GameResult
        // WHY: Participant documents are global and do not store gameId; GameResult ties participants and sessions to games.
        const filter: any = { gameId: game._id, isValidated: true }
        const [uniqueParticipants, sessionIds, nullSessionCount, rewards] = await Promise.all([
          GameResultModel.distinct('participantId', filter),
          GameResultModel.distinct('sessionId', filter),
          GameResultModel.countDocuments({ ...filter, $or: [ { sessionId: null }, { sessionId: '' }, { sessionId: { $exists: false } } ] }),
          RewardModel.find({ gameId: game._id })
        ])

        const participantCount = Array.isArray(uniqueParticipants) ? uniqueParticipants.length : 0
        const sessionCount = (Array.isArray(sessionIds) ? sessionIds.filter(Boolean).length : 0) + (nullSessionCount || 0)
        
        return {
          ...game,
          id: game._id.toString(),
          rewards,
          _count: {
            participants: participantCount,
            gameResults: sessionCount
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
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title and type are required' },
        { status: 400 }
      )
    }

    // Normalize config and seed sensible defaults per game type (reuse registry)
    // WHAT: Auto-hydrate missing per-type configuration to prevent 500s on creation (e.g., Wheel needs segments)
    // WHY: Admin may create a game with minimal inputs first and configure details later.
    const processedConfiguration: any = { ...(configuration || {}) }

    if (type === 'STARS_HEXA') {
      if (processedConfiguration.starsHexa?.hexagons) {
        const starsCount = processedConfiguration.starsHexa.hexagons.filter((h: any) => h.hasHiddenStar).length
        processedConfiguration.starsHexa.totalStars = starsCount
      } else {
        // Provide a minimal valid default if none supplied (7 hexagons with 1 star)
        processedConfiguration.starsHexa = processedConfiguration.starsHexa || {}
        processedConfiguration.starsHexa.hexagons = Array.from({ length: 7 }, (_, idx) => ({
          id: `hex-${idx+1}`,
          text: `Card ${idx+1}`,
          hasHiddenStar: idx === 2,
          position: idx
        }))
        processedConfiguration.starsHexa.maxFlipsPerAttempt = processedConfiguration.starsHexa.maxFlipsPerAttempt || 3
        processedConfiguration.starsHexa.theme = processedConfiguration.starsHexa.theme || 'default'
        processedConfiguration.starsHexa.totalStars = 1
      }
    }

    if (type === 'FIND_RED') {
      // WHAT: Pull default config from registry with safe fallback.
      // WHY: TypeScript marks configuration as optional; provide runtime-safe defaults to satisfy types and prevent runtime errors.
      const def = ((REGISTRY.FIND_RED.defaultConfig.configuration as any)?.findRed) ?? {
        packSize: 6,
        redsPerPack: 2,
        selectionsPerRound: 1,
        targetReds: 3,
        totalRounds: 5,
        theme: 'default',
        texts: { shortyLabel: 'Shorty' },
        colors: {
          background: '#0B1220',
          winForeground: '#FF1A1A',
          neutralForeground: '#A0AEC0',
          cardBack: '#1F2937',
          cardBorder: '#374151'
        }
      }
      const cfg = processedConfiguration.findRed || {}
      // Coerce to numbers and backfill defaults
      processedConfiguration.findRed = {
        packSize: Number(cfg.packSize ?? def.packSize),
        redsPerPack: Number(cfg.redsPerPack ?? def.redsPerPack),
        selectionsPerRound: Number(cfg.selectionsPerRound ?? def.selectionsPerRound),
        targetReds: Number(cfg.targetReds ?? def.targetReds),
        totalRounds: Number(cfg.totalRounds ?? def.totalRounds),
        theme: cfg.theme || def.theme,
        texts: { shortyLabel: cfg?.texts?.shortyLabel || def.texts.shortyLabel },
        colors: {
          background: cfg?.colors?.background || def.colors.background,
          winForeground: cfg?.colors?.winForeground || def.colors.winForeground,
          neutralForeground: cfg?.colors?.neutralForeground || def.colors.neutralForeground,
          cardBack: cfg?.colors?.cardBack || def.colors.cardBack,
          cardBorder: cfg?.colors?.cardBorder || def.colors.cardBorder
        },
        defaultRewardId: cfg.defaultRewardId || ''
      }
    }

    if (type === 'WHEEL_OF_FORTUNE') {
      // WHAT/WHY: Safe access to defaults similar to FIND_RED case above.
      const def = ((REGISTRY.WHEEL_OF_FORTUNE.defaultConfig.configuration as any)?.wheelOfFortune) ?? {
        segments: [],
        spins: 8,
        spinsPerGame: 1,
        durationMs: 4500,
        pointerAt: 'top' as const,
        size: 280,
        theme: 'default',
        allowImmediateReplay: false
      }
      const cfg = processedConfiguration.wheelOfFortune || {}
      // Ensure minimum viable configuration: at least 2 segments
      let segments = Array.isArray(cfg.segments) ? cfg.segments : []
      if (segments.length < 2) {
        // Seed 6 evenly weighted segments
        const even = Math.round((100 / 6) * 1000) / 1000
        segments = Array.from({ length: 6 }, (_, i) => ({
          id: `seg-${i+1}`,
          label: `Segment ${i+1}`,
          probability: even,
          color: '#3B82F6',
          backgroundColor: '#3B82F6',
          isActive: true
        }))
      }
      processedConfiguration.wheelOfFortune = {
        segments,
        spins: Number(cfg.spins ?? def.spins),
        spinsPerGame: Number(cfg.spinsPerGame ?? def.spinsPerGame),
        durationMs: Number(cfg.durationMs ?? def.durationMs),
        pointerAt: cfg.pointerAt || def.pointerAt,
        size: Number(cfg.size ?? def.size),
        theme: cfg.theme || def.theme,
        allowImmediateReplay: cfg.allowImmediateReplay ?? def.allowImmediateReplay
      }
    }

    if (type === 'PENALTY_SHOOTOUT') {
      // If admin didn't supply players, generate a valid default
      if (!processedConfiguration.penaltyShootout?.players) {
        const playerNumbers = Array.from({ length: 21 }, (_, i) => i + 2) // 2..22
        const shuffled = playerNumbers.sort(() => Math.random() - 0.5).slice(0, 11)
        const goalPositions = Array.from({ length: 11 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, 7)
        processedConfiguration.penaltyShootout = {
          players: Array.from({ length: 11 }, (_, index) => ({
            id: `player-${index + 1}`,
            playerNumber: shuffled[index],
            hasGoal: goalPositions.includes(index),
            isRevealed: false,
            position: index,
            color: '#c00000',
            backgroundColor: '#ffffff'
          })),
          totalGoals: 7,
          playersToSelect: 5,
          theme: 'football',
          texts: {},
          colors: {},
          gameSettings: { totalPlayers: 11, penaltyShots: 5, successfulShots: 7, missedShots: 4 }
        }
      }
    }

    // QUIZZ defaults and validation
    if (type === 'QUIZZ') {
      const cfg = processedConfiguration.quizz || {}
      const rounds = Number(cfg.rounds ?? 5)
      const targetCorrect = Number(cfg.targetCorrect ?? 3)
      const questions = Array.isArray(cfg.questions) ? cfg.questions : []
      // Normalize questions to ensure exactly 3 answers each with isCorrect flag
      const normQuestions = questions.map((q: any, idx: number) => ({
        id: q?.id || `q-${idx + 1}`,
        text: String(q?.text || '').slice(0,300),
        answers: (Array.isArray(q?.answers) ? q.answers : []).slice(0,3).map((a: any) => ({
          text: String(a?.text || '').slice(0,200),
          isCorrect: !!a?.isCorrect
        }))
      })).filter((q: any) => q.text && Array.isArray(q.answers) && q.answers.length === 3)

      processedConfiguration.quizz = {
        mapName: cfg.mapName || '',
        activeCoords: Array.isArray(cfg.activeCoords) ? cfg.activeCoords : [],
        rounds,
        targetCorrect,
        theme: cfg.theme || 'default',
        texts: {
          questionCTA: cfg?.texts?.questionCTA || '',
          submitAnswer: cfg?.texts?.submitAnswer || 'Submit',
          correctFeedback: cfg?.texts?.correctFeedback || 'Correct!',
          wrongFeedback: cfg?.texts?.wrongFeedback || 'Try again'
        },
        questions: normQuestions
      }
    }

    // Ensure platform container exists for 4-page flow (texts/styles)
    processedConfiguration.platform = processedConfiguration.platform || { texts: {}, styles: {} }

    // Create game data following the existing schema
    const gameData = {
      title,
      description: description || '',
      type,
      status: isActive ? 'ACTIVE' : 'DRAFT',
      configuration: {
        ...processedConfiguration,
        maxAttemptsPerUser: Number(maxAttemptsPerUser ?? 3)
      },
      createdBy: 'admin', // Default creator
      totalParticipants: 0,
      totalPlays: 0,
      isPublic: false,
      // Traceability for support: creation correlation ID
      _creationRequestId: uuidv4()
    } as any

    // Create the game
    const game = new GameModel(gameData)
    const savedGame = await game.save()

    // Create associated rewards if provided
    let gameRewards = [] as any[]
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
    
    // Map validation errors to 400 where applicable
    if (error instanceof Error) {
      const message = error.message || 'Unknown validation error'
      const isValidation = /must|invalid|required|least|exceed|exactly|between/i.test(message)
return NextResponse.json(
        { 
          error: message || 'Failed to create game',
          message,
          details: (error as any).errors || null
        },
        { status: isValidation ? 400 : 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
