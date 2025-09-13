'use client'

import React from 'react'

interface UnifiedGamePageProps {
  hero: React.ReactNode
  main: React.ReactNode
  pageBgColor?: string
  heroBgColor?: string
  mainBgColor?: string
  fontFamily?: string
}

// UnifiedGamePage — Centralized layout for all play flow pages
// What: Enforces the global 2% / 18% / 2% / 76% / 2% vertical layout
// Why: Single source of truth for page structure and default styling
export default function UnifiedGamePage({
  hero,
  main,
  pageBgColor = '#000000FF',
  heroBgColor = '#000000FF',
  mainBgColor = '#444444FF',
  fontFamily = '"Noto Sans", system-ui, -apple-system, Arial, sans-serif'
}: UnifiedGamePageProps) {
  return (
    <div className="unified-game-page">
      <style jsx>{`
        .unified-game-page {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: ${pageBgColor}; /* Default page background */
          font-family: ${fontFamily};
          color: #FFFFFFFF; /* default text color */
        }
        .top-margin { height: 2%; flex-shrink: 0; }
        .hero { height: 18%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: ${heroBgColor}; }
        .middle-margin { height: 2%; flex-shrink: 0; }
        .main { height: 76%; flex-shrink: 0; background: ${mainBgColor}; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .bottom-margin { height: 2%; flex-shrink: 0; }

        /* Safe inner container for main scrollable content if needed */
        .main-inner { width: 100%; height: 100%; overflow-y: auto; }
      `}</style>

      <div className="top-margin" />

      <div className="hero">
        {hero}
      </div>

      <div className="middle-margin" />

      <div className="main">
        <div className="main-inner">
          {main}
        </div>
      </div>

      <div className="bottom-margin" />
    </div>
  )
}

