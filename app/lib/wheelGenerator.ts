import { WheelSegment, SimpleWheelConfiguration, WheelOfFortuneConfiguration } from '../types'

// Default sports segment names
export const DEFAULT_SEGMENT_NAMES = [
  'soccer',
  'volleyball', 
  'handball',
  'swimming',
  'wrestling',
  'boxing',
  'running',
  'skiing',
  'waterpolo',
  'basketball'
]

// Color palette for segments
const SEGMENT_COLORS = [
  '#F94144', // Red
  '#F3722C', // Orange  
  '#F8961E', // Amber
  '#F9844A', // Light Orange
  '#F9C74F', // Yellow
  '#90BE6D', // Green
  '#43AA8B', // Teal
  '#4D908E', // Blue-Green
  '#577590', // Blue-Gray
  '#277DA1', // Blue
  '#9B5DE5', // Purple
  '#B5179E', // Magenta
  '#06FFA5', // Mint
  '#FFE66D', // Light Yellow
  '#FF8066', // Coral
  '#845EC2', // Violet
  '#FFC75F', // Gold
  '#C34A36', // Dark Red
  '#008F7A', // Dark Teal
  '#A8E6CF'  // Light Green
]

/**
 * Generates wheel configurations from simple parameters
 * 
 * @param simpleConfig - Simple configuration parameters
 * @returns Complete WheelOfFortuneConfiguration
 */
export function generateWheelConfiguration(simpleConfig: SimpleWheelConfiguration): WheelOfFortuneConfiguration {
  if (typeof window !== 'undefined') {
    console.log('🎰 Generating wheel configuration:', simpleConfig)
  }

  const {
    jackpotsCount,
    wheel1Segments,
    wheel2Segments, 
    wheel3Segments,
    totalSegmentsToUse,
    segmentNames
  } = simpleConfig

  // Validate segment names
  if (segmentNames.length < totalSegmentsToUse - 1) {
    throw new Error(`Need at least ${totalSegmentsToUse - 1} segment names for ${totalSegmentsToUse} total segments`)
  }

  // Select segment names to use (excluding jackpot)
  const selectedSegmentNames = segmentNames.slice(0, totalSegmentsToUse - 1)
  
  // Create jackpot segment
  const jackpotSegment: WheelSegment = {
    id: 'jackpot',
    label: '💰 Jackpot',
    color: '#FFD700', // Gold color for jackpot
    isActive: true
  }

  // Create regular segments from names
  const regularSegments: WheelSegment[] = selectedSegmentNames.map((name, index) => ({
    id: `segment-${index}`,
    label: name,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    isActive: true
  }))

  // All available segments (jackpot + regular)
  const allSegments = [jackpotSegment, ...regularSegments]

  if (typeof window !== 'undefined') {
    console.log('📋 Available segments:', allSegments.map(s => s.label))
  }

  /**
   * Distributes jackpots across wheels
   * Returns array indicating which wheels should have jackpots
   */
  function distributeJackpots(count: number): boolean[] {
    const distribution = [false, false, false] // Start with no jackpots
    
    if (count === 1) {
      distribution[Math.floor(Math.random() * 3)] = true // Random wheel gets jackpot
    } else if (count === 2) {
      distribution[0] = true
      distribution[2] = true // First and last wheel
    } else if (count >= 3) {
      distribution.fill(true) // All wheels get jackpots
    }
    
    // For counts 4, 5, 6 - distribute additional jackpots by allowing multiple per wheel
    return distribution
  }

  /**
   * Fills a wheel with segments ensuring variety and proper jackpot distribution
   */
  function fillWheel(
    segmentCount: number, 
    shouldHaveJackpot: boolean,
    wheelIndex: number
  ): WheelSegment[] {
    const wheelSegments: WheelSegment[] = []
    
    // Add jackpot if this wheel should have it
    if (shouldHaveJackpot) {
      wheelSegments.push({
        ...jackpotSegment,
        id: `${jackpotSegment.id}-wheel${wheelIndex + 1}`
      })
    }

    // Fill remaining slots with regular segments
    const remainingSlots = segmentCount - (shouldHaveJackpot ? 1 : 0)
    const shuffledSegments = [...regularSegments].sort(() => Math.random() - 0.5)
    
    // Fill slots, allowing repeats if necessary
    for (let i = 0; i < remainingSlots; i++) {
      const segment = shuffledSegments[i % shuffledSegments.length]
      wheelSegments.push({
        ...segment,
        id: `${segment.id}-wheel${wheelIndex + 1}-${i}`
      })
    }

    return wheelSegments.sort(() => Math.random() - 0.5) // Final shuffle
  }

  // Distribute jackpots across wheels
  const jackpotDistribution = distributeJackpots(jackpotsCount)
  
  // Handle special cases for higher jackpot counts
  let totalJackpotsToPlace = jackpotsCount
  const wheelConfigs = [
    { segmentCount: wheel1Segments, hasJackpot: jackpotDistribution[0] },
    { segmentCount: wheel2Segments, hasJackpot: jackpotDistribution[1] },
    { segmentCount: wheel3Segments, hasJackpot: jackpotDistribution[2] }
  ]

  // For jackpot counts > 3, add extra jackpots to random wheels
  if (jackpotsCount > 3) {
    const extraJackpots = jackpotsCount - 3
    for (let i = 0; i < extraJackpots; i++) {
      const randomWheel = Math.floor(Math.random() * 3)
      wheelConfigs[randomWheel].hasJackpot = true
    }
  }

  // Generate individual wheel segments
  const wheel1SegmentsGenerated = fillWheel(wheel1Segments, wheelConfigs[0].hasJackpot, 0)
  const wheel2SegmentsGenerated = fillWheel(wheel2Segments, wheelConfigs[1].hasJackpot, 1)
  const wheel3SegmentsGenerated = fillWheel(wheel3Segments, wheelConfigs[2].hasJackpot, 2)

  if (typeof window !== 'undefined') {
    console.log('🎰 Generated wheels:')
    console.log('Wheel 1:', wheel1SegmentsGenerated.map(s => s.label))
    console.log('Wheel 2:', wheel2SegmentsGenerated.map(s => s.label))
    console.log('Wheel 3:', wheel3SegmentsGenerated.map(s => s.label))
  }

  // Create final configuration
  const configuration: WheelOfFortuneConfiguration = {
    segments: allSegments, // Fallback segments
    wheel1Segments: wheel1SegmentsGenerated,
    wheel2Segments: wheel2SegmentsGenerated,
    wheel3Segments: wheel3SegmentsGenerated,
    spins: 8,
    spinsPerGame: 2,
    durationMs: 4500,
    pointerAt: 'top',
    size: 280,
    theme: 'default',
    allowImmediateReplay: false,
    gameRule: {
      winCondition: 'jackpot_once',
      jackpotLabel: '💰 Jackpot',
      collectionsNeeded: 3
    },
    simpleConfig: simpleConfig
  }

  return configuration
}

/**
 * Creates a simple configuration for testing
 */
export function createSimpleTestConfiguration(): SimpleWheelConfiguration {
  return {
    jackpotsCount: 1,
    wheel1Segments: 5,
    wheel2Segments: 4,
    wheel3Segments: 6,
    totalSegmentsToUse: 6,
    segmentNames: DEFAULT_SEGMENT_NAMES
  }
}

/**
 * Validates simple wheel configuration
 */
export function validateSimpleConfiguration(config: SimpleWheelConfiguration): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  // Check segment names count
  if (config.segmentNames.length < config.totalSegmentsToUse - 1) {
    errors.push(`Need at least ${config.totalSegmentsToUse - 1} segment names for ${config.totalSegmentsToUse} total segments`)
  }

  // Check if wheels can accommodate segments
  const minWheelSize = Math.min(config.wheel1Segments, config.wheel2Segments, config.wheel3Segments)
  if (config.jackpotsCount > 0 && minWheelSize < 2) {
    errors.push('Wheels must have at least 2 segments when jackpots are enabled')
  }

  // Warn if jackpot distribution might be challenging
  if (config.jackpotsCount > 6) {
    errors.push('More than 6 jackpots might make the game too easy')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
