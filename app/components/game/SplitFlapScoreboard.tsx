'use client'

import React, { useEffect, useRef, useState } from 'react'

interface SplitFlapScoreboardProps {
  homeScore: number
  visitorScore: number
  className?: string
}

/**
 * SplitFlapScoreboard Component - Train-station style score display
 * 
 * Features:
 * - Authentic split-flap animation like old train station boards
 * - Hardware-accelerated CSS animations with 3D perspective
 * - Automatic cycling through digits for realistic effect
 * - Responsive scaling to fit available space
 * - Centered layout with equal space for HOME and VISITOR labels
 */
export default function SplitFlapScoreboard({ 
  homeScore, 
  visitorScore, 
  className = '' 
}: SplitFlapScoreboardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [displayScores, setDisplayScores] = useState({ home: 0, visitor: 0 })
  const [isAnimating, setIsAnimating] = useState(false)

  // Update scores with animation
  useEffect(() => {
    if (homeScore !== displayScores.home || visitorScore !== displayScores.visitor) {
      updateScoreDisplay(homeScore, visitorScore)
    }
  }, [homeScore, visitorScore])

  const updateScoreDisplay = async (home: number, visitor: number) => {
    if (!boardRef.current || isAnimating) return
    
    setIsAnimating(true)
    const digits = boardRef.current.querySelectorAll('.digit')
    
    // Format scores to 2 digits
    const homeStr = Math.min(99, Math.max(0, home)).toString().padStart(2, '0')
    const visitorStr = Math.min(99, Math.max(0, visitor)).toString().padStart(2, '0')
    const targetValues = [
      parseInt(homeStr[0]), parseInt(homeStr[1]), 
      parseInt(visitorStr[0]), parseInt(visitorStr[1])
    ]
    
    // Animate all digits simultaneously
    await Promise.all(
      Array.from(digits).map((digit, index) => 
        cycleTo(digit as HTMLElement, targetValues[index])
      )
    )
    
    setDisplayScores({ home, visitor })
    setIsAnimating(false)
  }

  // Create DOM elements for flip animation
  const makeValSpan = (val: number) => {
    const span = document.createElement('span')
    span.className = 'split-flap-val'
    span.textContent = val.toString()
    return span
  }

  const makeHalf = (which: 'top' | 'bottom', val: number) => {
    const half = document.createElement('div')
    half.className = `split-flap-half split-flap-half-${which}`
    half.appendChild(makeValSpan(val))
    return half
  }

  const setupDigit = (el: HTMLElement, value: number) => {
    el.innerHTML = ''
    el.dataset.value = value.toString()
    el.appendChild(makeHalf('top', value))
    el.appendChild(makeHalf('bottom', value))
  }

  const makeFlipPiece = (which: 'top' | 'bottom', val: number) => {
    const piece = document.createElement('div')
    piece.className = `split-flap-flip split-flap-flip-${which}`
    piece.appendChild(makeValSpan(val))
    return piece
  }

  // Single digit flip animation
  const flipOnce = (el: HTMLElement, nextVal: number): Promise<void> => {
    return new Promise(resolve => {
      const topStatic = el.querySelector('.split-flap-half-top .split-flap-val') as HTMLElement
      const bottomStatic = el.querySelector('.split-flap-half-bottom .split-flap-val') as HTMLElement
      
      const curr = parseInt(el.dataset.value || '0')
      
      const topFlip = makeFlipPiece('top', curr)
      const bottomFlip = makeFlipPiece('bottom', nextVal)
      
      el.appendChild(topFlip)
      el.appendChild(bottomFlip)
      
      let animationsComplete = 0
      const onAnimationComplete = () => {
        animationsComplete++
        if (animationsComplete === 2) {
          topStatic.textContent = nextVal.toString()
          bottomStatic.textContent = nextVal.toString()
          topFlip.remove()
          bottomFlip.remove()
          el.dataset.value = nextVal.toString()
          resolve()
        }
      }
      
      topFlip.addEventListener('animationend', onAnimationComplete, { once: true })
      bottomFlip.addEventListener('animationend', onAnimationComplete, { once: true })
    })
  }

  // Cycle through digits like a real split-flap display
  const cycleTo = async (el: HTMLElement, targetVal: number): Promise<void> => {
    const target = targetVal % 10
    let current = parseInt(el.dataset.value || '0') % 10
    const steps = (target - current + 10) % 10
    
    if (steps === 0) return
    
    for (let i = 1; i <= steps; i++) {
      const next = (current + i) % 10
      await flipOnce(el, next)
    }
  }

  // Initialize digits on mount
  useEffect(() => {
    if (!boardRef.current) return
    
    const digits = boardRef.current.querySelectorAll('.digit')
    digits.forEach(digit => setupDigit(digit as HTMLElement, 0))
    
    // Set initial scores after a short delay
    setTimeout(() => updateScoreDisplay(homeScore, visitorScore), 200)
  }, [])

  return (
    <>
      <style jsx global>{`
        .split-flap-scoreboard {
          --card-height: 90px;
          --card-width: calc(var(--card-height) * 0.73);
          --digit-font: calc(var(--card-height) * 0.65);
          --card-radius: calc(var(--card-height) * 0.09);
          --hinge-thickness: 2px;
          --perspective: 900px;
          --card-bg: #000000;
          --digit-color: #ffffff;
          --gap-small: calc(var(--card-width) * 0.18);
          --gap-colon: calc(var(--card-width) * 0.24);
          --gap-label: calc(var(--card-width) * 0.22);
          --label-font: calc(var(--card-height) * 0.28);
          --label-weight: 800;
          --label-track: 1px;
        }

        .split-flap-board-wrap {
          display: inline-block;
          transform-origin: center center;
          margin: 4px;
        }

        .split-flap-board {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          max-width: 100%;
          padding: 15px;
        }

        .split-flap-label {
          flex: 1 1 0;
          min-width: 0;
          font-size: var(--label-font);
          font-weight: var(--label-weight);
          letter-spacing: var(--label-track);
          font-family: 'Courier New', Courier, monospace;
          user-select: none;
          white-space: nowrap;
          line-height: 1;
          opacity: 0.98;
          color: white;
          overflow: visible;
        }

        .split-flap-label-home {
          text-align: right;
          padding-right: var(--gap-label);
        }

        .split-flap-label-visitor {
          text-align: left;
          padding-left: var(--gap-label);
        }

        .split-flap-score {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--gap-small);
        }

        .split-flap-colon {
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          font-size: calc(var(--digit-font) * 0.9);
          line-height: 1;
          letter-spacing: 2px;
          color: var(--digit-color);
          opacity: 0.9;
          transform: translateY(-2px);
          user-select: none;
          margin: 0 var(--gap-colon);
        }

        .split-flap-digit {
          position: relative;
          width: var(--card-width);
          height: var(--card-height);
          border-radius: var(--card-radius);
          background: var(--card-bg);
          color: var(--digit-color);
          perspective: var(--perspective);
          box-shadow:
            0 6px 16px rgba(0,0,0,0.45),
            inset 0 -1px 0 rgba(255,255,255,0.03),
            inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
          flex: 0 0 auto;
        }

        .split-flap-digit::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: calc(50% - var(--hinge-thickness)/2);
          height: var(--hinge-thickness);
          background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(0,0,0,0.35), rgba(255,255,255,0.08));
          pointer-events: none;
          z-index: 10;
        }

        .split-flap-half {
          position: absolute;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
          display: block;
          background: var(--card-bg);
        }

        .split-flap-half-top {
          top: 0;
          clip-path: inset(0 0 50% 0 round var(--card-radius) var(--card-radius) 0 0);
        }

        .split-flap-half-bottom {
          bottom: 0;
          clip-path: inset(50% 0 0 0 round 0 0 var(--card-radius) var(--card-radius));
        }

        .split-flap-val {
          height: var(--card-height);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: var(--digit-font);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          user-select: none;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
        }

        .split-flap-half-top .split-flap-val {
          transform: translateY(0);
        }

        .split-flap-half-bottom .split-flap-val {
          transform: translateY(-100%);
        }

        .split-flap-flip {
          position: absolute;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
          display: block;
          background: var(--card-bg);
          backface-visibility: hidden;
          transform-style: preserve-3d;
          color: var(--digit-color);
        }

        .split-flap-flip .split-flap-val {
          height: var(--card-height);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: var(--digit-font);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
        }

        .split-flap-flip-top {
          top: 0;
          transform-origin: center bottom;
          clip-path: inset(0 0 50% 0 round var(--card-radius) var(--card-radius) 0 0);
          animation: split-flap-flip-top 280ms ease-in forwards;
        }

        .split-flap-flip-top .split-flap-val {
          transform: translateY(0);
        }

        @keyframes split-flap-flip-top {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }

        .split-flap-flip-bottom {
          bottom: 0;
          transform-origin: center top;
          clip-path: inset(50% 0 0 0 round 0 0 var(--card-radius) var(--card-radius));
          transform: rotateX(90deg);
          animation: split-flap-flip-bottom 320ms ease-out forwards;
          animation-delay: 260ms;
        }

        .split-flap-flip-bottom .split-flap-val {
          transform: translateY(-100%);
        }

        @keyframes split-flap-flip-bottom {
          0% { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }

        @media (max-width: 768px) {
          .split-flap-scoreboard {
            --card-height: 70px;
          }
        }

        @media (max-width: 480px) {
          .split-flap-scoreboard {
            --card-height: 60px;
          }
        }
      `}</style>
      <div className={`split-flap-scoreboard ${className}`}>
        <div className="split-flap-board-wrap" ref={boardRef}>
          <div className="split-flap-board">
            <div className="split-flap-label split-flap-label-home">HOME</div>
            
            <div className="split-flap-score">
              <div className="digit split-flap-digit" data-value="0"></div>
              <div className="digit split-flap-digit" data-value="0"></div>
              <div className="split-flap-colon">:</div>
              <div className="digit split-flap-digit" data-value="0"></div>
              <div className="digit split-flap-digit" data-value="0"></div>
            </div>
            
            <div className="split-flap-label split-flap-label-visitor">VISITOR</div>
          </div>
        </div>
      </div>
    </>
  )
}
