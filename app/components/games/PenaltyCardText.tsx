'use client'

import React, { useEffect } from 'react'
import { usePenaltyCards } from '../../hooks/usePenaltyCards 2'

interface PenaltyCardTextProps {
  text: string
  backgroundColor?: string
  className?: string
  // Variant to allow global sizing semantics for hero titles without touching scoreboards
  variant?: 'default' | 'title'
}

/**
 * PenaltyCardText Component
 * 
 * WHAT: Uses the EXACT same code, structure, and animations as PenaltyScoreboard
 * WHY: Provides identical split-flap display functionality for text
 * 
 * This component has the EXACT same structure as PenaltyScoreboard but for text instead of numbers
 */
export default function PenaltyCardText({ 
  text, 
  backgroundColor = '#C00000FF', 
  className = '',
  variant = 'title'
}: PenaltyCardTextProps) {
  const { scoreRef, boardWrapRef, stageRef, fitBoard } = usePenaltyCards()

  // Fit board on mount and text changes
  useEffect(() => {
    const timer = setTimeout(() => fitBoard(), 100)
    return () => clearTimeout(timer)
  }, [text, fitBoard])

  return (
    <div className={`penalty-scoreboard ${variant === 'title' ? 'title-mode' : ''} ${className}`}>
      {/* EXACT SAME CSS as PenaltyScoreboard */}
      <style jsx>{`
        .penalty-scoreboard {
          height: 100%;
          width: 100%;
          position: relative;
          background: transparent;
          overflow: hidden;
        }

        :global(.penalty-scoreboard) {
          --card-height: 110px;
          --max-chars: 20;
          --container-max-width: calc(100vw - 64px); /* Full width minus padding with extra margins */
          --card-width: min(
            calc(var(--container-max-width) / var(--max-chars)),
            calc(var(--card-height) * 0.73)
          ); /* Ensure cards don't exceed original aspect ratio */
          --digit-font: calc(var(--card-width) * 0.75);
          --card-radius: calc(var(--card-height) * 0.09);
          --hinge-thickness: 2px;
          --perspective: 900px;
          --digit-color: #ffffff;
          --gap-small: calc(var(--card-width) * 0.08);
          --gap-colon: calc(var(--card-width) * 0.1);
        }

        /* Title variant: globally smaller hero scale for titles with responsive sizing */
        :global(.penalty-scoreboard.title-mode) {
          --card-height: 88px;
        }
        @media (max-width: 1024px) {
          :global(.penalty-scoreboard.title-mode) {
            --card-height: 78px;
          }
        }
        @media (max-width: 768px) {
          :global(.penalty-scoreboard) {
            --container-max-width: calc(100vw - 32px);
          }
          :global(.penalty-scoreboard.title-mode) {
            --card-height: 68px;
          }
        }
        @media (max-width: 480px) {
          :global(.penalty-scoreboard) {
            --container-max-width: calc(100vw - 16px);
          }
          :global(.penalty-scoreboard.title-mode) {
            --card-height: 58px;
          }
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
          padding: 0 16px;
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
          max-width: var(--container-max-width);
          margin: 0 auto;
          flex-wrap: nowrap;
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

      {/* EXACT SAME structure as PenaltyScoreboard */}
      <div className="stage" ref={stageRef}>
        <div className="board-wrap" ref={boardWrapRef}>
          <div className="score" ref={scoreRef}>
            {text.replace(/\s+/g, ' ').trim().split('').map((char, index) => {
              if (char === ' ') {
                return (
                  <div
                    key={`space-${index}`}
                    className="space"
                    style={{ 
                      width: 'calc(var(--card-width) * 0.4)',
                      height: 'var(--card-height)',
                      flexShrink: 0
                    }}
                  >
                  </div>
                )
              }
              
              return (
                <div
                  key={`digit-${index}`}
                  className="digit"
                  data-value={char}
                  style={{ backgroundColor }}
                >
                  <div className="half top">
                    <span className="val">{char}</span>
                  </div>
                  <div className="half bottom">
                    <span className="val">{char}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
