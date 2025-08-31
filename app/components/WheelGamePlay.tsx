'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WheelOfFortune from './WheelOfFortune'
import { WheelOfFortuneConfiguration, GameOutcome } from '../types'
import { generateWheelConfiguration } from '../lib/wheelGenerator'

interface WheelGamePlayProps {
  gameId: string
  configuration: WheelOfFortuneConfiguration
  onResult?: (result: GameOutcome) => void
  isTrialMode?: boolean
}

interface GameState {
  spinsUsed: number
  allResults: string[] // All results from all wheels across all spins
  resultsByWheel: string[][] // Results grouped by wheel [wheel1Results, wheel2Results, wheel3Results]
  isGameComplete: boolean
  isSpinning: boolean
  finalResult: GameOutcome | null
}

/**
 * WheelGamePlay Component
 * 
 * Enhanced wrapper for WheelOfFortune that implements proper game rules:
 * - Tracks spins used vs spinsPerGame limit
 * - Counts collected segments for win condition checking
 * - Implements game end logic with redirect to results
 * - Supports both collect-three-same and jackpot-once win conditions
 */
export default function WheelGamePlay({ 
  gameId, 
  configuration, 
  onResult, 
  isTrialMode = false 
}: WheelGamePlayProps) {
  const router = useRouter()
  const [finalConfiguration, setFinalConfiguration] = useState<WheelOfFortuneConfiguration | null>(null)
  
  // Generate configuration from simple config on client-side only
  useEffect(() => {
    const config = configuration.simpleConfig 
      ? generateWheelConfiguration(configuration.simpleConfig)
      : configuration
      
    console.log('🎮 Using final configuration:', config)
    setFinalConfiguration(config)
  }, [configuration])
  
  const [gameState, setGameState] = useState<GameState>({
    spinsUsed: 0,
    allResults: [],
    resultsByWheel: [[], [], []], // 3 wheels
    isGameComplete: false,
    isSpinning: false,
    finalResult: null
  })

  // Extract game rules from final configuration  
  const spinsPerGame = 2 // Fixed to 2 spins
  const gameRule = finalConfiguration?.gameRule || {
    winCondition: 'triple_wheel_jackpot' as const,
    jackpotLabel: '💰 Jackpot',
    collectionsNeeded: 3
  }
  const spinsRemaining = spinsPerGame - gameState.spinsUsed

  // Check triple wheel win conditions from all collected results
  const checkTripleWheelWinCondition = (allResults: string[]): { hasWon: boolean, winType: string, winningValue: string } => {
    // Count all results
    const resultCounts: Record<string, number> = {}
    allResults.forEach(result => {
      resultCounts[result] = (resultCounts[result] || 0) + 1
    })

    console.log('All results:', allResults)
    console.log('Result counts:', resultCounts)
    console.log('Jackpot label:', gameRule.jackpotLabel)

    // Win condition 1: Any jackpot result
    if (resultCounts[gameRule.jackpotLabel] && resultCounts[gameRule.jackpotLabel] >= 1) {
      return { hasWon: true, winType: 'JACKPOT', winningValue: gameRule.jackpotLabel }
    }

    // Win condition 2: 3 or more of the same result
    for (const [result, count] of Object.entries(resultCounts)) {
      if (count >= 3) {
        return { hasWon: true, winType: 'THREE_SAME', winningValue: result }
      }
    }

    return { hasWon: false, winType: 'NONE', winningValue: '' }
  }

  // Track results from triple wheel spins
  const [pendingResults, setPendingResults] = useState<{ wheelIndex: number, result: string }[]>([])

  // Handle results from individual wheels during a triple spin
  const handleSingleWheelResult = (wheelIndex: number, segmentLabel: string) => {
    if (gameState.isGameComplete) {
      console.log('Game already complete, ignoring result')
      return
    }
    
    console.log(`=== WHEEL ${wheelIndex + 1} RESULT: ${segmentLabel} ===`)
    console.log('Game state:', {
      isSpinning: gameState.isSpinning,
      isGameComplete: gameState.isGameComplete,
      spinsUsed: gameState.spinsUsed,
      allResults: gameState.allResults
    })
    
    setPendingResults(prev => {
      const newResults = [...prev, { wheelIndex, result: segmentLabel }]
      console.log(`Pending results updated: ${newResults.length}/3`, newResults.map(r => r.result))
      
      // If we have all 3 results, process them immediately
      if (newResults.length === 3) {
        console.log('🎰 ALL 3 RESULTS COLLECTED - PROCESSING NOW!')
        const orderedResults = [0, 1, 2].map(index => 
          newResults.find(r => r.wheelIndex === index)?.result || 'ERROR'
        )
        console.log('Ordered results:', orderedResults)
        
        // Process results immediately (no timeout)
        processTripleSpinResults(orderedResults)
        return []
      }
      
      return newResults
    })
  }

  // Process complete triple spin results
  const processTripleSpinResults = (spinResults: string[]) => {
    if (gameState.isGameComplete) return

    const newSpinsUsed = gameState.spinsUsed + 1
    const newAllResults = [...gameState.allResults, ...spinResults]
    const newResultsByWheel = gameState.resultsByWheel.map((wheelResults, index) => [
      ...wheelResults, 
      spinResults[index]
    ])

    console.log('Triple spin results:', spinResults)
    console.log('All results so far:', newAllResults)

    // Check win conditions after collecting all results
    const { hasWon, winType, winningValue } = checkTripleWheelWinCondition(newAllResults)
    
    // Game is complete if won or used all spins
    const isGameComplete = hasWon || newSpinsUsed >= spinsPerGame
    
    let outcomeType: 'WIN' | 'NO_REWARD' = hasWon ? 'WIN' : 'NO_REWARD'
    let message = ''

    if (hasWon) {
      if (winType === 'JACKPOT') {
        message = `🎰💰 JACKPOT! You hit the ${winningValue}!`
      } else if (winType === 'THREE_SAME') {
        message = `🎯🎉 WINNER! You got 3+ "${winningValue}" results!`
      }
    } else if (isGameComplete) {
      message = `🎲💔 Game Over! You used all ${spinsPerGame} spins but didn't win.`
    } else {
      message = `Spin ${newSpinsUsed}: Got ${spinResults.join(', ')}. ${spinsPerGame - newSpinsUsed} spins left!`
    }

    // Create final result
    const result: GameOutcome = {
      type: outcomeType,
      segmentLabel: spinResults.join(', '),
      value: hasWon ? winningValue : 'No win',
      rewardIds: hasWon ? [] : [], 
      message: message,
      // Triple wheel specific fields
      spinsUsed: newSpinsUsed,
      spinsRemaining: spinsPerGame - newSpinsUsed,
      allResults: newAllResults,
      isGameComplete: isGameComplete,
      winType: winType,
      // Compatibility fields
      starsFound: 0,
      totalStarsInGame: 0,
      foundAllStars: hasWon
    }

    console.log('Game result:', result)

    // Update state
    setGameState({
      spinsUsed: newSpinsUsed,
      allResults: newAllResults,
      resultsByWheel: newResultsByWheel,
      isGameComplete: isGameComplete,
      isSpinning: false,
      finalResult: result
    })

    // Call result handler
    setTimeout(() => {
      onResult?.(result)
    }, 0)

    // Handle redirect if game is complete
    if (isGameComplete) {
      const redirectData = {
        outcome: outcomeType,
        message: message,
        spinsUsed: newSpinsUsed.toString(),
        gameType: '💰🌪️🍀',
        won: hasWon ? 'true' : 'false',
        winType: winType,
        allResults: newAllResults.join(','),
        ...(hasWon && { winningValue })
      }
      
      setTimeout(() => {
        const resultParams = new URLSearchParams(redirectData)
        router.push(`/play/${gameId}/result?${resultParams.toString()}`)
      }, 3000) // 3 second delay to show final result
    }
  }

  // External trigger state for spinning all wheels
  const [spinTrigger, setSpinTrigger] = useState(0)
  
  // Start triple wheel spin
  const handleTripleWheelSpin = () => {
    if (gameState.isGameComplete || gameState.isSpinning || spinsRemaining <= 0) return
    
    console.log('Starting triple wheel spin...')
    setGameState(prev => ({ ...prev, isSpinning: true }))
    setPendingResults([])
    
    // Increment trigger to spin all wheels
    setSpinTrigger(prev => prev + 1)
  }

  // Calculate result statistics from all collected results
  const getResultStats = () => {
    const resultCounts: Record<string, number> = {}
    gameState.allResults.forEach(result => {
      resultCounts[result] = (resultCounts[result] || 0) + 1
    })

    const totalResults = gameState.allResults.length
    const maxSameResults = Math.max(0, ...Object.values(resultCounts))
    const hasJackpot = resultCounts[gameRule.jackpotLabel] > 0
    
    return {
      resultCounts,
      totalResults,
      maxSameResults,
      hasJackpot
    }
  }

  const resultStats = getResultStats()

  // Show loading state while configuration is being generated
  if (!finalConfiguration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">🎰 Generating wheel configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            🎰🎰🎰 Triple Wheel Fortune
          </h1>
          <p className="text-xl text-gray-200">
            Spin 3 wheels simultaneously! Win with ANY jackpot or 3+ matching results!
          </p>
        </div>

        {/* Triple Wheel Component - Moved up after header */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {[0, 1, 2].map(wheelIndex => {
              // Get segments for this specific wheel or fall back to default
              let wheelSegments = finalConfiguration.segments // Default segments
              
              if (wheelIndex === 0 && finalConfiguration.wheel1Segments) {
                wheelSegments = finalConfiguration.wheel1Segments
              } else if (wheelIndex === 1 && finalConfiguration.wheel2Segments) {
                wheelSegments = finalConfiguration.wheel2Segments
              } else if (wheelIndex === 2 && finalConfiguration.wheel3Segments) {
                wheelSegments = finalConfiguration.wheel3Segments
              }
              
              return (
                <div key={wheelIndex} className="flex flex-col items-center">
                  <h3 className="text-white font-semibold mb-4">Wheel {wheelIndex + 1}</h3>
                  <WheelOfFortune
                    segments={wheelSegments}
                    spins={finalConfiguration.spins || 8}
                    durationMs={finalConfiguration.durationMs || 4500}
                    size={280}
                    pointerAt="top"
                    onResult={(result) => handleSingleWheelResult(wheelIndex, result)}
                    disabled={gameState.isGameComplete || spinsRemaining <= 0}
                    triggerSpin={spinTrigger}
                    hideSpinButton={true}
                  />
                </div>
              )
            })}
          </div>
          
          {/* Central Spin Button */}
          <div className="text-center mt-8">
            <button
              onClick={handleTripleWheelSpin}
              disabled={gameState.isGameComplete || gameState.isSpinning || spinsRemaining <= 0}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {gameState.isSpinning ? '🌀 Spinning All Wheels...' : 
               gameState.isGameComplete ? '🎲 Game Over' : 
               `🎰 SPIN ALL 3 WHEELS (${spinsRemaining} left)`}
            </button>
          </div>
        </div>

        {/* Game Status - Moved below wheels */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{spinsRemaining}</p>
              <p className="text-gray-300">Triple Spins Left</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resultStats.totalResults}</p>
              <p className="text-gray-300">Total Results</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resultStats.maxSameResults}</p>
              <p className="text-gray-300">Max Same Results</p>
            </div>
          </div>

          {/* Win Conditions Display */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className={`p-3 rounded-lg ${resultStats.hasJackpot ? 'bg-green-500/20 border border-green-400' : 'bg-white/10'}`}>
              <p className="text-white font-semibold">💰 Jackpot Condition</p>
              <p className={`text-sm ${resultStats.hasJackpot ? 'text-green-300' : 'text-gray-300'}`}>
                {resultStats.hasJackpot ? '✓ JACKPOT FOUND!' : 'Need ANY jackpot'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${resultStats.maxSameResults >= 3 ? 'bg-green-500/20 border border-green-400' : 'bg-white/10'}`}>
              <p className="text-white font-semibold">🎯 Triple Match</p>
              <p className={`text-sm ${resultStats.maxSameResults >= 3 ? 'text-green-300' : 'text-gray-300'}`}>
                {resultStats.maxSameResults >= 3 ? `✓ ${resultStats.maxSameResults} MATCHES!` : `Need 3+ same (have ${resultStats.maxSameResults})`}
              </p>
            </div>
          </div>
        </div>

        {/* Results Display - Moved below wheels */}
        {resultStats.totalResults > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">All Results ({resultStats.totalResults}/6):</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {gameState.allResults.map((result, index) => {
                const count = resultStats.resultCounts[result] || 0
                const isWinning = result === gameRule.jackpotLabel || count >= 3
                
                return (
                  <div 
                    key={index}
                    className={`rounded-lg p-3 text-center ${
                      isWinning ? 'bg-green-500/20 border border-green-400' : 'bg-white/20'
                    }`}
                  >
                    <p className="text-white font-medium text-xs truncate">{result}</p>
                    <p className="text-lg font-bold text-white">#{index + 1}</p>
                  </div>
                )
              })}
            </div>
            
            {/* Result counts summary */}
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-2">Result Counts:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(resultStats.resultCounts).map(([result, count]) => (
                  <div key={result} className={`bg-white/20 rounded p-2 text-center ${
                    count >= 3 || result === gameRule.jackpotLabel ? 'border border-yellow-400' : ''
                  }`}>
                    <p className="text-white text-xs truncate">{result}</p>
                    <p className="text-white font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Complete Message */}
        {gameState.isGameComplete && gameState.finalResult && (
          <div className="mt-8 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
              <p className="text-2xl font-bold text-white mb-2">
                {gameState.finalResult.type === 'WIN' ? '🎉 Congratulations!' : '😔 Game Over'}
              </p>
              <p className="text-lg text-gray-200">
                {gameState.finalResult.message}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Redirecting to results...
              </p>
            </div>
          </div>
        )}

        {/* Game Rules Reminder */}
        {!gameState.isGameComplete && (
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-gray-300">
                🎰 Win with ANY jackpot or get 3+ matching results across ${spinsPerGame} spins! You have {spinsRemaining} triple spins left.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
