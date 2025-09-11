'use client'

import React, { useEffect, useRef, useState, CSSProperties } from 'react'

interface SplitFlapScoreboardProps {
  // Score mode props
  homeScore?: number
  visitorScore?: number
  className?: string
  showLabels?: boolean
  homeCardBg?: string
  visitorCardBg?: string
  digitColor?: string
  homeLabel?: string
  visitorLabel?: string

  // Title mode props (when mode === 'title')
  mode?: 'score' | 'title'
  titleText?: string
  titleAlign?: 'center' | 'left' | 'right'
  titleClassName?: string
}

/**
 * SplitFlapScoreboard Component - Train-station style score display
 * Implements the exact DOM manipulation approach from the sample code
 */
export default function SplitFlapScoreboard({ 
  homeScore = 0, 
  visitorScore = 0, 
  className = '',
  showLabels = false,
  // Defaults per centralized spec
  homeCardBg = '#C00000FF',
  visitorCardBg = '#C00000FF',
  digitColor = '#FFFFFFFF',
  homeLabel = 'HOME',
  visitorLabel = 'VISITOR',
  mode = 'score',
  titleText = '',
  titleAlign = 'center',
  titleClassName = ''
}: SplitFlapScoreboardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const scoreContainerRef = useRef<HTMLDivElement>(null)

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
    // Guard: in title mode there are no digits to initialize
    if (mode !== 'score') return
    if (!boardRef.current) return
    
    const digits = boardRef.current.querySelectorAll('.digit')
    digits.forEach(digit => setupDigit(digit as HTMLElement, 0))
  }, [mode])

  // Update when score changes
  useEffect(() => {
    if (mode !== 'score') return
    updateScore(homeScore, visitorScore)
  }, [homeScore, visitorScore, mode])

  // ---------- TITLE MODE (LETTERS) IMPLEMENTATION ----------
  // Base charset includes space, digits, A-Z, and Hungarian uppercase diacritics for scoreboard titles
  const BASE_CHARSET = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÖŐÚÜŰ'

  const makeValSpanChar = (ch: string) => {
    const span = document.createElement('span')
    span.className = 'val'
    span.textContent = ch
    return span
  }

  const makeHalfChar = (which: 'top' | 'bottom', ch: string): HTMLDivElement => {
    const half = document.createElement('div')
    half.className = `half ${which}`
    half.appendChild(makeValSpanChar(ch))
    return half
  }

  const setupCharDigit = (el: HTMLElement, index: number, charset: string) => {
    el.innerHTML = ''
    el.dataset.value = index.toString()
    const ch = charset[index]
    el.appendChild(makeHalfChar('top', ch))
    el.appendChild(makeHalfChar('bottom', ch))
  }

  const flipOnceChar = (el: HTMLElement, nextIndex: number, charset: string): Promise<void> => {
    return new Promise(resolve => {
      const topStatic = el.querySelector('.half.top .val') as HTMLElement
      const bottomStatic = el.querySelector('.half.bottom .val') as HTMLElement

      const currIndex = parseInt(el.dataset.value || '0')
      const currChar = charset[currIndex]
      const nextChar = charset[nextIndex]

      const topFlip = document.createElement('div')
      topFlip.className = 'flip top'
      topFlip.appendChild(makeValSpanChar(currChar))

      const bottomFlip = document.createElement('div')
      bottomFlip.className = 'flip bottom'
      bottomFlip.appendChild(makeValSpanChar(nextChar))

      el.appendChild(topFlip)
      el.appendChild(bottomFlip)

      topFlip.addEventListener('animationend', () => {
        topStatic.textContent = nextChar
        topFlip.remove()
      }, { once: true })

      bottomFlip.addEventListener('animationend', () => {
        bottomStatic.textContent = nextChar
        bottomFlip.remove()
        el.dataset.value = nextIndex.toString()
        resolve()
      }, { once: true })
    })
  }

  const animateTitle = async (text: string) => {
    if (!boardRef.current) return
    // Clear existing
    boardRef.current.innerHTML = ''

    const score = document.createElement('div')
    score.className = 'score'
    boardRef.current.appendChild(score)

    // Use locale-aware uppercase for Hungarian
    const target = (text || '').toLocaleUpperCase('hu-HU')

    // Build a runtime charset that includes all characters used in target
    let charset = BASE_CHARSET
    for (const ch of target) {
      if (!charset.includes(ch)) {
        charset += ch
      }
    }

    const indices = Array.from(target).map(ch => {
      const idx = charset.indexOf(ch)
      // Default to space (index 0) for unsupported characters
      return idx >= 0 ? idx : 0
    })

    const digits: HTMLElement[] = []
    indices.forEach((targetIndex) => {
      const digit = document.createElement('div')
      digit.className = 'digit'
      const steps = Math.floor(Math.random() * 5) + 1 // 1..5
      const startIndex = (targetIndex - steps + charset.length) % charset.length
      setupCharDigit(digit, startIndex, charset)
      score.appendChild(digit)
      digits.push(digit)
    })

    await Promise.all(digits.map((digit, i) => {
      const targetIndex = indices[i]
      let currIndex = parseInt(digit.dataset.value || '0')
      let steps = (targetIndex - currIndex + charset.length) % charset.length
      const flips: Promise<void>[] = []
      for (let s = 1; s <= steps; s++) {
        const nextIndex = (currIndex + 1) % charset.length
        flips.push(flipOnceChar(digit, nextIndex, charset))
        currIndex = nextIndex
      }
      return flips.reduce((p, fn) => p.then(() => fn), Promise.resolve())
    }))
  }

  const didInitTitle = React.useRef(false)
  const lastTitle = React.useRef<string | undefined>(undefined)
  useEffect(() => {
    if (mode !== 'title') return
    // Only animate on initial mount or when title actually changes
    if (!didInitTitle.current || lastTitle.current !== (titleText || '')) {
      animateTitle(titleText || '')
      didInitTitle.current = true
      lastTitle.current = titleText || ''
    }
  }, [mode, titleText])

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
        .team {
          display: inline-flex;
          align-items: center;
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
          font-family: 'Noto Sans', sans-serif;
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
font-family: 'Noto Sans', sans-serif;
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
      
{mode === 'title' ? (
        // What: Render split-flap characters that flip from random previous letters to target title
        <div className={`split-flap-scoreboard ${className}`} style={{ ['--card-bg' as any]: homeCardBg, ['--digit-color' as any]: digitColor }}>
          <div className="split-flap-board">
            <div className="board-wrap" ref={boardRef}>
              {/* score container built dynamically in animateTitle */}
            </div>
          </div>
        </div>
      ) : (
        <div className={`split-flap-scoreboard ${className}`}>
          <div className="split-flap-board">
{showLabels && (<div className="split-flap-label split-flap-label-home">{homeLabel}</div>)}
            
            <div className="board-wrap" ref={boardRef}>
              <div className="score">
                <div className="team team-home" style={{ ['--card-bg' as any]: homeCardBg, ['--digit-color' as any]: digitColor } as CSSProperties}>
                  <div className="digit" data-value="0"></div>
                  <div className="digit" data-value="0"></div>
                </div>
                <div className="colon">:</div>
                <div className="team team-visitor" style={{ ['--card-bg' as any]: visitorCardBg, ['--digit-color' as any]: digitColor } as CSSProperties}>
                  <div className="digit" data-value="0"></div>
                  <div className="digit" data-value="0"></div>
                </div>
              </div>
            </div>
            
{showLabels && (<div className="split-flap-label split-flap-label-visitor">{visitorLabel}</div>)}
          </div>
        </div>
      )}
    </>
  )
}
