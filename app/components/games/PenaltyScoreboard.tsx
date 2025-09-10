'use client'

import React, { useEffect, useRef, useState } from 'react'

interface PenaltyScoreboardProps {
  homeScore: number
  visitorScore: number
  homeScoreCardColor?: string
  visitorScoreCardColor?: string
}

/**
 * PenaltyScoreboard Component - Split-flap style scoreboard for penalty shootout
 * 
 * Features animated split-flap digits that cycle through numbers to show the score.
 * Positioned at top 10% of screen with proper margins as specified.
 */
export default function PenaltyScoreboard({ homeScore, visitorScore, homeScoreCardColor, visitorScoreCardColor }: PenaltyScoreboardProps) {
  const scoreRef = useRef<HTMLDivElement>(null)
  const boardWrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  // Convert scores to 2-digit format
  const homeDigits = [Math.floor(homeScore / 10) % 10, homeScore % 10]
  const visitorDigits = [Math.floor(visitorScore / 10) % 10, visitorScore % 10]

  // DOM builder functions
  const makeValSpan = (val: number): HTMLSpanElement => {
    const span = document.createElement('span')
    span.className = 'val'
    span.textContent = val.toString()
    return span
  }

  const makeHalf = (which: 'top' | 'bottom', val: number): HTMLDivElement => {
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

  const makeFlipPiece = (which: 'top' | 'bottom', val: number): HTMLDivElement => {
    const piece = document.createElement('div')
    piece.className = `flip ${which}`
    piece.appendChild(makeValSpan(val))
    return piece
  }

  // Flip animation function
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

  // Update scores with animation
  const updateScore = async (newHomeScore: number, newVisitorScore: number) => {
    if (!scoreRef.current) return

    const digits = Array.from(scoreRef.current.querySelectorAll('.digit')) as HTMLElement[]
    const newHomeDigits = [Math.floor(newHomeScore / 10) % 10, newHomeScore % 10]
    const newVisitorDigits = [Math.floor(newVisitorScore / 10) % 10, newVisitorScore % 10]
    
    const allDigits = [...newHomeDigits, ...newVisitorDigits]
    
    await Promise.all(allDigits.map((val, i) => cycleTo(digits[i], val)))
  }

  // Fit board to viewport
  const fitBoard = () => {
    if (!stageRef.current || !boardWrapRef.current) return

    // Reset any previous scale
    boardWrapRef.current.style.transform = 'scale(1)'

    const availW = stageRef.current.clientWidth
    const availH = stageRef.current.clientHeight

    // Natural size of the board content
    const rect = boardWrapRef.current.getBoundingClientRect()
    const naturalW = rect.width
    const naturalH = rect.height

    // Compute scale to fit within both width and height
    const scale = Math.max(0.1, Math.min(
      (availW - 16) / naturalW,
      (availH - 16) / naturalH
    ))

    boardWrapRef.current.style.transform = `scale(${scale})`
  }

  // Initialize digits on mount
  useEffect(() => {
    if (!scoreRef.current) return

    const digits = Array.from(scoreRef.current.querySelectorAll('.digit')) as HTMLElement[]
    digits.forEach(d => setupDigit(d, 0))

    // Fit board initially
    setTimeout(fitBoard, 100)
  }, [])

  // Update scores when props change
  useEffect(() => {
    updateScore(homeScore, visitorScore)
  }, [homeScore, visitorScore])

  // Handle resize
  useEffect(() => {
    const handleResize = () => fitBoard()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return (
    <div className="penalty-scoreboard">
      {/* CSS styles */}
      <style jsx>{`
        .penalty-scoreboard {
          height: 100%;
          width: 100%;
          position: relative;
          background: #444444;
          overflow: hidden;
        }

        :global(.penalty-scoreboard) {
          --card-height: 130px;
          --card-width: calc(var(--card-height) * 0.73);
          --digit-font: calc(var(--card-height) * 0.65);
          --card-radius: calc(var(--card-height) * 0.09);
          --hinge-thickness: 2px;
          --perspective: 900px;
          --digit-color: #ffffff;
          --gap-small: calc(var(--card-width) * 0.18);
          --gap-colon: calc(var(--card-width) * 0.24);
        }

        .stage {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
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

        :global(.penalty-scoreboard .digit) {
          position: relative;
          width: var(--card-width);
          height: var(--card-height);
          border-radius: var(--card-radius);
          color: var(--digit-color);
          perspective: var(--perspective);
          box-shadow:
            0 6px 16px rgba(0,0,0,0.45),
            inset 0 -1px 0 rgba(255,255,255,0.03),
            inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
          flex: 0 0 auto;
        }

        :global(.penalty-scoreboard .digit::after) {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: calc(50% - var(--hinge-thickness)/2);
          height: var(--hinge-thickness);
          background: linear-gradient(90deg, rgba(255,255,255,0.08), rgba(0,0,0,0.35), rgba(255,255,255,0.08));
          pointer-events: none;
        }

        :global(.penalty-scoreboard .half) {
          position: absolute;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
          display: block;
          background: inherit;
        }

        :global(.penalty-scoreboard .half.top) {
          top: 0;
          clip-path: inset(0 0 0 0 round var(--card-radius) var(--card-radius) 0 0);
        }

        :global(.penalty-scoreboard .half.bottom) {
          bottom: 0;
          clip-path: inset(0 0 0 0 round 0 0 var(--card-radius) var(--card-radius));
        }

        :global(.penalty-scoreboard .val) {
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

        :global(.penalty-scoreboard .half.top .val) {
          transform: translateY(0);
        }

        :global(.penalty-scoreboard .half.bottom .val) {
          transform: translateY(-50%);
        }

        :global(.penalty-scoreboard .flip) {
          position: absolute;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
          display: block;
          background: inherit;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          color: var(--digit-color);
        }

        :global(.penalty-scoreboard .flip .val) {
          height: var(--card-height);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: var(--digit-font);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        :global(.penalty-scoreboard .flip.top) {
          top: 0;
          transform-origin: center bottom;
          clip-path: inset(0 0 0 0 round var(--card-radius) var(--card-radius) 0 0);
          animation: flip-top 280ms ease-in forwards;
        }

        :global(.penalty-scoreboard .flip.top .val) {
          transform: translateY(0);
        }

        @keyframes flip-top {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }

        :global(.penalty-scoreboard .flip.bottom) {
          bottom: 0;
          transform-origin: center top;
          clip-path: inset(0 0 0 0 round 0 0 var(--card-radius) var(--card-radius));
          transform: rotateX(90deg);
          animation: flip-bottom 320ms ease-out forwards;
          animation-delay: 260ms;
        }

        :global(.penalty-scoreboard .flip.bottom .val) {
          transform: translateY(-50%);
        }

        @keyframes flip-bottom {
          0% { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>

      {/* Fullscreen score area */}
      <div className="stage" ref={stageRef}>
        <div className="board-wrap" ref={boardWrapRef}>
          <div className="score" ref={scoreRef}>
            <div className="digit home-digit" data-value="0" style={{ backgroundColor: homeScoreCardColor || '#000000' }}></div>
            <div className="digit home-digit" data-value="0" style={{ backgroundColor: homeScoreCardColor || '#000000' }}></div>
            <div className="colon" aria-hidden="true">:</div>
            <div className="digit visitor-digit" data-value="0" style={{ backgroundColor: visitorScoreCardColor || '#000000' }}></div>
            <div className="digit visitor-digit" data-value="0" style={{ backgroundColor: visitorScoreCardColor || '#000000' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
