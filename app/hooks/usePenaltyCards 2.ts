'use client'

import { useEffect, useRef } from 'react'

/**
 * usePenaltyCards Hook
 * 
 * WHAT: Provides the EXACT same functionality as PenaltyScoreboard for text display
 * WHY: Reuses the working DOM manipulation and animation code from PenaltyScoreboard
 * 
 * This hook contains the EXACT same functions and logic as PenaltyScoreboard
 */
export const usePenaltyCards = () => {
  const scoreRef = useRef<HTMLDivElement>(null)
  const boardWrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  // EXACT same DOM builder functions from PenaltyScoreboard
  const makeValSpan = (val: string): HTMLSpanElement => {
    const span = document.createElement('span')
    span.className = 'val'
    span.textContent = val
    return span
  }

  const makeHalf = (which: 'top' | 'bottom', val: string): HTMLDivElement => {
    const half = document.createElement('div')
    half.className = `half ${which}`
    half.appendChild(makeValSpan(val))
    return half
  }

  const setupDigit = (el: HTMLElement, value: string) => {
    el.innerHTML = ''
    el.dataset.value = value
    el.appendChild(makeHalf('top', value))
    el.appendChild(makeHalf('bottom', value))
  }

  const makeFlipPiece = (which: 'top' | 'bottom', val: string): HTMLDivElement => {
    const piece = document.createElement('div')
    piece.className = `flip ${which}`
    piece.appendChild(makeValSpan(val))
    return piece
  }

  // EXACT same flip animation function from PenaltyScoreboard
  const flipOnce = (el: HTMLElement, nextVal: string): Promise<void> => {
    return new Promise(resolve => {
      const topStatic = el.querySelector('.half.top .val') as HTMLElement
      const bottomStatic = el.querySelector('.half.bottom .val') as HTMLElement

      const curr = el.dataset.value || ''

      const topFlip = makeFlipPiece('top', curr)
      const bottomFlip = makeFlipPiece('bottom', nextVal)

      el.appendChild(topFlip)
      el.appendChild(bottomFlip)

      topFlip.addEventListener('animationend', () => {
        topStatic.textContent = nextVal
        topFlip.remove()
      }, { once: true })

      bottomFlip.addEventListener('animationend', () => {
        bottomStatic.textContent = nextVal
        bottomFlip.remove()
        el.dataset.value = nextVal
        resolve()
      }, { once: true })
    })
  }

  const cycleTo = async (el: HTMLElement, targetVal: string): Promise<void> => {
    const target = targetVal
    const current = el.dataset.value || ''
    
    if (target === current) return
    
    await flipOnce(el, target)
  }

  // EXACT same fitBoard function from PenaltyScoreboard
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

  // Initialize and update text
  const initializeCards = (text: string) => {
    if (!scoreRef.current) return
    
    const digits = Array.from(scoreRef.current.querySelectorAll('.digit')) as HTMLElement[]
    digits.forEach(d => setupDigit(d, ''))
    
    // Fit board initially
    setTimeout(fitBoard, 100)
  }

  const updateText = async (text: string) => {
    if (!scoreRef.current) return

    const digits = Array.from(scoreRef.current.querySelectorAll('.digit')) as HTMLElement[]
    const chars = text.split('')
    
    // Update all characters simultaneously like the scoreboard
    await Promise.all(
      chars.map((char, i) => {
        if (i < digits.length && char !== ' ') {
          return cycleTo(digits[i], char)
        }
        return Promise.resolve()
      })
    )
  }

  // EXACT same resize handling from PenaltyScoreboard
  useEffect(() => {
    const handleResize = () => fitBoard()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return {
    scoreRef,
    boardWrapRef,
    stageRef,
    initializeCards,
    updateText,
    fitBoard
  }
}
