import { useRef, useCallback } from 'react'

/**
 * usePenaltyCards
 *
 * WHAT: Shared hook that exposes DOM refs and a viewport-fit scaler for split-flap style
 *        score/text boards used by penalty components.
 * WHY:  Centralizes the sizing logic so both PenaltyScoreboard and PenaltyCardText can
 *       compute the proper scale based on available width/height without duplicating code.
 *
 * The scaler mirrors the logic previously embedded in PenaltyScoreboard 2.tsx: it measures the
 * natural size of the board, computes a scale that fits within the stage container with a small
 * margin, and applies it to the wrapper. Keeping this logic in a hook improves reuse and
 * maintainability across components.
 */
export function usePenaltyCards() {
  // Expose the same three refs used by components to build and scale the board
  const scoreRef = useRef<HTMLDivElement | null>(null)
  const boardWrapRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  // Fit the board (wrapper) within the stage while preserving aspect ratio
  const fitBoard = useCallback(() => {
    const stage = stageRef.current
    const wrap = boardWrapRef.current
    if (!stage || !wrap) return

    // Reset prior scale to measure natural size
    wrap.style.transform = 'scale(1)'

    const availW = stage.clientWidth
    const availH = stage.clientHeight

    // Measure current natural dimensions of the board content
    const rect = wrap.getBoundingClientRect()
    const naturalW = rect.width
    const naturalH = rect.height

    // Choose the smaller scale to ensure the content fits both width and height.
    // Leave a small margin (16px) similar to the original implementation.
    const scale = Math.max(0.1, Math.min(
      (availW - 16) / naturalW,
      (availH - 16) / naturalH
    ))

    wrap.style.transform = `scale(${scale})`
  }, [])

  return { scoreRef, boardWrapRef, stageRef, fitBoard }
}
