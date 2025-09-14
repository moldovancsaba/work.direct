'use client'

import { useState, useRef, useEffect } from 'react'
import { WheelSegment, GameOutcome } from '../types'

interface LuckyWheelProps {
  segments: WheelSegment[]
  onSpin?: () => Promise<GameOutcome>
  onResult?: (result: GameOutcome) => void
  disabled?: boolean
  size?: number
  theme?: 'default' | 'colorful' | 'minimal'
  spinDuration?: number
  rotations?: number
}

/**
 * LuckyWheel Component
 * 
 * Interactive SVG-based spinning wheel with configurable segments.
 * Features smooth CSS animations, probability-based results, and mobile touch support.
 * 
 * The wheel calculates rotation angles based on segment probabilities and 
 * displays results with visual feedback.
 */
export default function LuckyWheel({
  segments,
  onSpin,
  onResult,
  disabled = false,
  size = 400,
  theme = 'default',
  spinDuration = 3000,
  rotations = 4
}: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [result, setResult] = useState<GameOutcome | null>(null)
  const wheelRef = useRef<SVGGElement>(null)
  
  // Calculate segment angles based on probabilities
  const segmentAngles = calculateSegmentAngles(segments)
  
  // Generate colors for segments based on theme
  const segmentColors = generateSegmentColors(segments, theme)
  
  useEffect(() => {
    // Reset result when segments change
    setResult(null)
  }, [segments])
  
  const handleSpin = async () => {
    if (isSpinning || disabled || !onSpin) return
    
    setIsSpinning(true)
    setResult(null)
    
    try {
      // Call the onSpin callback to get the result
      const gameResult = await onSpin()
      
      // Find the segment that matches the result
      const winningSegment = segments.find(segment => segment.id === gameResult.segmentId)
      if (!winningSegment) {
        console.error('Winning segment not found:', gameResult.segmentId)
        return
      }
      
      // Calculate the target angle for the winning segment
      const segmentIndex = segments.findIndex(segment => segment.id === gameResult.segmentId)
      const targetAngle = calculateTargetAngle(segmentIndex, segmentAngles)
      
      // Calculate total rotation (base rotations + target position)
      const baseRotation = 360 * rotations
      const finalRotation = currentRotation + baseRotation + targetAngle
      
      // Apply rotation to wheel
      if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.23, 1, 0.320, 1)`
        wheelRef.current.style.transform = `rotate(${finalRotation}deg)`
      }
      
      setCurrentRotation(finalRotation)
      
      // Wait for animation to complete
      setTimeout(() => {
        setIsSpinning(false)
        setResult(gameResult)
        if (onResult) {
          onResult(gameResult)
        }
      }, spinDuration)
      
    } catch (error) {
      console.error('Spin error:', error)
      setIsSpinning(false)
    }
  }
  
  const radius = size / 2 - 20 // Account for padding
  const centerX = size / 2
  const centerY = size / 2
  
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Wheel Container */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Wheel SVG */}
        <svg
          width={size}
          height={size}
          className="drop-shadow-lg"
          style={{ transform: 'rotate(-90deg)' }} // Start at top
        >
          {/* Wheel Background Circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth={3}
          />
          
          {/* Wheel Segments */}
          <g ref={wheelRef} style={{ transformOrigin: `${centerX}px ${centerY}px` }} data-role="wheel-rotor">
            {segments.map((segment, index) => {
              const startAngle = segmentAngles[index].start
              const endAngle = segmentAngles[index].end
              const color = segmentColors[index]
              
              return (
                <WheelSegmentComponent
                  key={segment.id}
                  segment={segment}
                  startAngle={startAngle}
                  endAngle={endAngle}
                  radius={radius}
                  centerX={centerX}
                  centerY={centerY}
                  color={color}
                />
              )
            })}
          </g>
          
          {/* Center Circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={30}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth={2}
          />
          
          {/* Center Circle Inner */}
          <circle
            cx={centerX}
            cy={centerY}
            r={20}
            fill="#334155"
          />
        </svg>
        
        {/* Pointer */}
        <div 
          className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10"
          style={{ width: 0, height: 0 }}
        >
          <div 
            className="border-l-[15px] border-r-[15px] border-b-[25px] border-l-transparent border-r-transparent border-b-red-500 drop-shadow-md"
          />
        </div>
      </div>
      
      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || disabled || !onSpin}
        className={`
          px-8 py-4 rounded-full font-bold text-lg transition-all duration-200 min-w-[200px]
          ${isSpinning 
            ? 'bg-gray-400 cursor-not-allowed animate-pulse' 
            : disabled || !onSpin
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }
        `}
      >
        {isSpinning ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Spinning...</span>
          </div>
        ) : (
          'SPIN THE WHEEL!'
        )}
      </button>
      
      {/* Result Display */}
      {result && !isSpinning && (
        <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-yellow-400 animate-bounce-in max-w-md w-full text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {result.type === 'WIN' ? '🎉 Congratulations!' : '😊 Try Again!'}
          </div>
          <div className="text-lg text-gray-600 mb-4">
            {result.message}
          </div>
          {result.type === 'WIN' && result.rewardIds && result.rewardIds.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                You've won a reward! Check your prizes.
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Segment Legend (for smaller screens) */}
      <div className="md:hidden w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Wheel Segments</h3>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div key={segment.id} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: segmentColors[index] }}
                />
                <span className="text-sm text-gray-700 flex-1">
                  {segment.label}
                </span>
                <span className="text-xs text-gray-500">
                  {segment.probability}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Individual wheel segment component
 */
function WheelSegmentComponent({
  segment,
  startAngle,
  endAngle,
  radius,
  centerX,
  centerY,
  color
}: {
  segment: WheelSegment
  startAngle: number
  endAngle: number
  radius: number
  centerX: number
  centerY: number
  color: string
}) {
  const startAngleRad = (startAngle * Math.PI) / 180
  const endAngleRad = (endAngle * Math.PI) / 180
  
  // Calculate arc path
  const x1 = centerX + radius * Math.cos(startAngleRad)
  const y1 = centerY + radius * Math.sin(startAngleRad)
  const x2 = centerX + radius * Math.cos(endAngleRad)
  const y2 = centerY + radius * Math.sin(endAngleRad)
  
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  
  const pathData = [
    `M ${centerX} ${centerY}`,
    `L ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    'Z'
  ].join(' ')
  
  // Calculate text position
  const textAngle = (startAngle + endAngle) / 2
  const textAngleRad = (textAngle * Math.PI) / 180
  const textRadius = radius * 0.75
  const textX = centerX + textRadius * Math.cos(textAngleRad)
  const textY = centerY + textRadius * Math.sin(textAngleRad)
  
  return (
    <g>
      {/* Segment Path */}
      <path
        d={pathData}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
        className="transition-all duration-200 hover:brightness-110"
      />
      
      {/* Segment Text */}
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={Math.min(12, radius / 10)}
        fontWeight="bold"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={0.5}
        transform={`rotate(${textAngle + 90} ${textX} ${textY})`}
      >
        {segment.label.length > 15 ? segment.label.substring(0, 12) + '...' : segment.label}
      </text>
    </g>
  )
}

/**
 * Calculate segment angles based on probabilities
 */
function calculateSegmentAngles(segments: WheelSegment[]) {
  const angles: { start: number; end: number }[] = []
  let currentAngle = 0
  
  const defaultProb = segments.length > 0 ? 100 / segments.length : 0
  segments.forEach(segment => {
    const p = (segment.probability ?? defaultProb)
    const segmentAngle = (p / 100) * 360
    angles.push({
      start: currentAngle,
      end: currentAngle + segmentAngle
    })
    currentAngle += segmentAngle
  })
  
  return angles
}

/**
 * Generate colors for segments based on theme
 */
function generateSegmentColors(segments: WheelSegment[], theme: string) {
  if (theme === 'colorful') {
    const colors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E',
      '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
      '#F59E0B', '#10B981', '#6366F1', '#8B5CF6'
    ]
    return segments.map((_, index) => colors[index % colors.length])
  }
  
  if (theme === 'minimal') {
    return segments.map((_, index) => 
      index % 2 === 0 ? '#6B7280' : '#9CA3AF'
    )
  }
  
  // Default theme
  return segments.map(segment => 
    segment.backgroundColor || '#3B82F6'
  )
}

/**
 * Calculate target angle for winning segment
 */
function calculateTargetAngle(segmentIndex: number, segmentAngles: { start: number; end: number }[]) {
  const segment = segmentAngles[segmentIndex]
  const segmentCenter = (segment.start + segment.end) / 2

  // Point the segment center to the top (pointer position).
  // IMPORTANT: The entire <svg> is rotated by -90deg to visually start at the top.
  // Therefore, to bring the chosen segment to the pointer at top, we rotate the <g>
  // so that its center aligns with 0deg in the original coordinate system (not 90deg).
  // This means we must rotate by -segmentCenter (not 90 - segmentCenter).
  const baseAngle = -segmentCenter

  // Add some randomness within the segment to avoid landing exactly on center.
  // Keep offset within the segment bounds (60% of segment width) to avoid crossing into neighbors.
  const segmentWidth = segment.end - segment.start
  const randomOffset = (Math.random() - 0.5) * segmentWidth * 0.6

  return baseAngle + randomOffset
}
