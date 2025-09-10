"use client"

import React from 'react'
import SplitFlapScoreboard from '../game/SplitFlapScoreboard'

// HeroBlock — unified hero section used across play flow pages
// What: Renders the exact same SplitFlapScoreboard module used on the Game page.
// Why: Product requirement — identical layout/module across Welcome, Rules, Game, Result.
function HeroBlockInner({ backgroundClass, title, scoreboard }: { backgroundClass?: string; title?: string; scoreboard?: { home: number; visitor: number; showLabels?: boolean; homeLabel?: string; visitorLabel?: string; homeBg?: string; visitorBg?: string; digitColor?: string } }) {
  return (
    <div
      className={`w-full ${backgroundClass || ''} px-4 text-center`}
      style={{
        marginTop: '2vh',
        marginBottom: '2vh',
        height: '18vh',
        backgroundColor: '#000000FF',
        color: '#FFFFFFFF',
        fontFamily: '"Noto Sans", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="flex justify-center w-full">
        {title && title.trim().length > 0 ? (
          <SplitFlapScoreboard
            mode="title"
            titleText={title}
            className="scale-75 md:scale-90"
          />
        ) : (
          <SplitFlapScoreboard
            homeScore={scoreboard?.home ?? 0}
            visitorScore={scoreboard?.visitor ?? 0}
            showLabels={scoreboard?.showLabels ?? false}
            homeLabel={scoreboard?.homeLabel}
            visitorLabel={scoreboard?.visitorLabel}
            homeCardBg={scoreboard?.homeBg || '#C00000FF'}
            visitorCardBg={scoreboard?.visitorBg || '#C00000FF'}
            digitColor={scoreboard?.digitColor || '#FFFFFFFF'}
            className="scale-75 md:scale-90"
          />
        )}
      </div>
    </div>
  )
}

export const HeroBlock = React.memo(HeroBlockInner)
HeroBlock.displayName = 'HeroBlock'

function MainBlockInner({ backgroundClass, children }: { backgroundClass?: string; children: React.ReactNode }) {
  return (
    <div
      className={`w-full ${backgroundClass || ''} max-w-4xl mx-auto`}
      style={{
        height: '76vh',
        marginBottom: '2vh',
        backgroundColor: '#444444FF',
        color: '#FFFFFFFF',
        fontFamily: '"Noto Sans", sans-serif',
        padding: '24px',
        overflow: 'auto',
        borderRadius: 0
      }}
    >
      {children}
    </div>
  )
}

export const MainBlock = React.memo(MainBlockInner)
MainBlock.displayName = 'MainBlock'

