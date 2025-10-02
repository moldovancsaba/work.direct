import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '../../../types'
import { connectDB } from '../../../lib/mongodb'
import GameModel from '../../../lib/models/Game'
import PlaymassDefaultsModel from '../../../lib/models/PlaymassDefaults'
import { deepMerge, resolveConfig } from '../../../modules/core/config'
import { GameType } from '../../../types'
import mongoose from 'mongoose'

// Purpose: Update configuration at either playmass-level or per-game-level.
// Why: Centralized admin surface to mutate config with clear scope.

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    const { gameId, patch, scope, gameType } = body || {}

    if (!patch || typeof patch !== 'object') {
      return NextResponse.json({
        success: false,
        message: 'Invalid patch payload',
        error: { code: 'VALIDATION_ERROR', message: 'patch must be an object' }
      }, { status: 400 })
    }

    if (scope !== 'game' && scope !== 'playmass') {
      return NextResponse.json({
        success: false,
        message: 'Invalid scope. Must be "game" or "playmass"',
        error: { code: 'VALIDATION_ERROR', message: 'Invalid scope value' }
      }, { status: 400 })
    }

    await connectDB()

    if (scope === 'game') {
      if (!gameId || !mongoose.Types.ObjectId.isValid(gameId)) {
        return NextResponse.json({
          success: false,
          message: 'Invalid or missing gameId',
          error: { code: 'VALIDATION_ERROR', message: 'Provide a valid gameId' }
        }, { status: 400 })
      }

      const game = await GameModel.findById(gameId)
      if (!game) {
        return NextResponse.json({
          success: false,
          message: 'Game not found',
          error: { code: 'NOT_FOUND', message: `No game with id ${gameId}` }
        }, { status: 404 })
      }

      // Merge into existing configuration (backward-compatible)
      const nextConfig = deepMerge(game.configuration || {}, patch || {})
      game.configuration = nextConfig as any
      const saved = await game.save()

      // Return resolved config to show final effect
      const resolved = await resolveConfig(saved._id.toString())
      return NextResponse.json({
        success: true,
        data: { gameId: saved._id.toString(), resolved },
        message: 'Game configuration updated'
      })
    }

    // scope === 'playmass'
    // Determine module id: prefer provided gameType; else infer from gameId
    let moduleId: GameType | null = null
if (gameType && gameType === 'QUIZZZ') {
      moduleId = gameType
    } else if (gameId && mongoose.Types.ObjectId.isValid(gameId)) {
      const game = await GameModel.findById(gameId)
      if (!game) {
        return NextResponse.json({ success: false, message: 'Game not found', error: { code: 'NOT_FOUND', message: `No game with id ${gameId}` } }, { status: 404 })
      }
      moduleId = game.type as GameType
    }

    if (!moduleId) {
      return NextResponse.json({
        success: false,
        message: 'Missing module identifier',
        error: { code: 'VALIDATION_ERROR', message: 'Provide gameType or a valid gameId' }
      }, { status: 400 })
    }

    const updated = await (PlaymassDefaultsModel as any).updateDefaults(moduleId, patch, request.headers.get('x-user-id') || 'admin')

    return NextResponse.json({
      success: true,
      data: { moduleId, defaults: updated.defaults },
      message: 'PlayMass defaults updated'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to update configuration',
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 })
  }
}
