'use client'

import React, { useEffect, useRef, useState } from 'react'

interface SplitFlapScoreboardProps {
  homeScore: number
  visitorScore: number
  className?: string
}

/**
 * SplitFlapScoreboard Component - Train-station style score display
 * Implements the exact DOM manipulation approach from the sample code
 */
export default function SplitFlapScoreboard({ 
  homeScore, 
  visitorScore, 
  className = '' 
}: SplitFlapScoreboardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // DOM builders - identical to sample code
  const makeValSpan = (val: number) => {
    const span = document.createElement('span')
    span.className = 'val'
    span.textContent = val.toString()
    return span
  }

  const makeHalf = (which: 'top' | 'bottom', val: number) => {
    const half = document.createElement('div')
    half.className = `half ${which}`
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
    piece.className = `flip ${which}`
    piece.appendChild(makeValSpan(val))
    return piece
  }

  // Flip animations - identical to sample code
  const flipOnce = (el: HTMLElement, nextVal: number): Promise<void> => {
    return new Promise(resolve => {
      const topStatic = el.querySelector('.half.top .val') as HTMLElement
      const bottomStatic = el.querySelector('.half.bottom .val') as HTMLElement
      
      const curr = parseInt(el.dataset.value || '0')
      
      const topFlip = makeFlipPiece('top', curr)
      const bottomFlip = makeFlipPiece('bottom', nextVal)
      
      el.appendChild(topFlip)
      el.appendChild(bottomFlip)
      
      topFlip.addEventListener('animationend', () => {
        topStatic.textContent = nextVal.toString()
        topFlip.remove()
      }, { once: true })
      
      bottomFlip.addEventListener('animationend', () => {
        bottomStatic.textContent = nextVal.toString()
        bottomFlip.remove()
        el.dataset.value = nextVal.toString()
        resolve()
      }, { once: true })
    })
  }

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

  // Update the score display with animation
  const updateScore = async (home: number, visitor: number) => {
    if (!boardRef.current || isAnimating) return
    
    setIsAnimating(true)
    
    // Format scores to 2 digits
    const homeStr = Math.min(99, Math.max(0, home)).toString().padStart(2, '0')
    const visitorStr = Math.min(99, Math.max(0, visitor)).toString().padStart(2, '0')
    
    const targetValues = [
      parseInt(homeStr[0]), parseInt(homeStr[1]),  // Home score
      parseInt(visitorStr[0]), parseInt(visitorStr[1])  // Visitor score
    ]
    
    const digits = boardRef.current.querySelectorAll('.digit')
    
    try {
      // Animate all digits simultaneously (like in sample code)
      await Promise.all(
        Array.from(digits).map((digit, index) => 
          cycleTo(digit as HTMLElement, targetValues[index])
        )
      )
    } finally {
      setIsAnimating(false)
    }
  }

  // Initialize digits on mount
  useEffect(() => {
    if (!boardRef.current) return
    
    const digits = boardRef.current.querySelectorAll('.digit')
    digits.forEach(digit => setupDigit(digit as HTMLElement, 0))
  }, [])

  // Update when score changes
  useEffect(() => {
    updateScore(homeScore, visitorScore)
  }, [homeScore, visitorScore])

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
        }

        .board-wrap {
          display: inline-block;
          transform-origin: center center;
          margin: 4px;
        }

        .score {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--gap-small);
          padding: 15px;
        }

        .colon {
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

        /* ---------- SPLIT-FLAP DIGIT STYLES ---------- */
        .digit {
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
        .digit::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: calc(50% - var(--hinge-thickness)/2);
          height: var(--hinge-thickness);
          background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(0,0,0,0.35), rgba(255,255,255,0.08));
          pointer-events: none;
          z-index: 1;
        }

        .half {
          position: absolute;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
          display: block;
          background: var(--card-bg);
        }
        .half.top {
          top: 0;
          clip-path: inset(0 0 0 0 round var(--card-radius) var(--card-radius) 0 0);
        }
        .half.bottom {
          bottom: 0;
          clip-path: inset(0 0 0 0 round 0 0 var(--card-radius) var(--card-radius));
        }

        .val {
          height: var(--card-height);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: var(--digit-font);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          user-select: none;
        }
        .half.top .val { transform: translateY(0); }
        .half.bottom .val { transform: translateY(-50%); }

        .flip {
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
        .flip .val {
          height: var(--card-height);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: var(--digit-font);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .flip.top {
          top: 0;
          transform-origin: center bottom;
          clip-path: inset(0 0 0 0 round var(--card-radius) var(--card-radius) 0 0);
          animation: flip-top 280ms ease-in forwards;
        }
        .flip.top .val { transform: translateY(0); }
        @keyframes flip-top { 0% { transform: rotateX(0deg); } 100% { transform: rotateX(-90deg); } }

        .flip.bottom {
          bottom: 0;
          transform-origin: center top;
          clip-path: inset(0 0 0 0 round 0 0 var(--card-radius) var(--card-radius));
          transform: rotateX(90deg);
          animation: flip-bottom 320ms ease-out forwards;
          animation-delay: 260ms;
        }
        .flip.bottom .val { transform: translateY(-50%); }
        @keyframes flip-bottom { 0% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }

        /* Labels and layout */
        .split-flap-board {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 15px;
        }

        .split-flap-label {
          flex: 1 1 0;
          font-size: var(--label-font);
          font-weight: 800;
          letter-spacing: 1px;
          font-family: 'Courier New', Courier, monospace;
          user-select: none;
          white-space: nowrap;
          line-height: 1;
          color: white;
        }

        .split-flap-label-home {
          text-align: right;
          padding-right: var(--gap-label);
        }

        .split-flap-label-visitor {
          text-align: left;
          padding-left: var(--gap-label);
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
        <div className="split-flap-board">
          <div className="split-flap-label split-flap-label-home">HOME</div>
          
          <div className="board-wrap" ref={boardRef}>
            <div className="score">
              <div className="digit" data-value="0"></div>
              <div className="digit" data-value="0"></div>
              <div className="colon">:</div>
              <div className="digit" data-value="0"></div>
              <div className="digit" data-value="0"></div>
            </div>
          </div>
          
          <div className="split-flap-label split-flap-label-visitor">VISITOR</div>
        </div>
      </div>
    </>
  )
}
