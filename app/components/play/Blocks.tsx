"use client"

import React from 'react'
import SplitFlapScoreboard from '../game/SplitFlapScoreboard'

// HeroBlock — unified hero section used across play flow pages
// What: Renders the exact same SplitFlapScoreboard module used on the Game page.
// Why: Product requirement — identical layout/module across Welcome, Rules, Game, Result.
function HeroBlockInner({ backgroundClass, title, scoreboard, isLanding = false }: { backgroundClass?: string; title?: string; scoreboard?: { home: number; visitor: number; showLabels?: boolean; homeLabel?: string; visitorLabel?: string; homeBg?: string; visitorBg?: string; digitColor?: string }; isLanding?: boolean }) {
  return (
    <div
className={`w-full ${backgroundClass || ''} ${isLanding ? '' : 'px-4'} text-center`}
      style={{
        marginTop: isLanding ? '0' : '2vh',
        marginBottom: isLanding ? '0' : '2vh',
        height: isLanding ? '20vh' : '18vh',
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
            homeCardBg={scoreboard?.homeBg || '#C00000FF'}
            digitColor={scoreboard?.digitColor || '#FFFFFFFF'}
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

function MainBlockInner({ backgroundClass, children, isLanding = false }: { backgroundClass?: string; children: React.ReactNode; isLanding?: boolean }) {
  return (
    <div
      className={`w-full ${backgroundClass || ''}`}
      style={{
        width: '100vw',
        height: isLanding ? '80vh' : '76vh',
        marginBottom: isLanding ? '0' : '2vh',
        backgroundColor: '#444444FF',
        color: '#FFFFFFFF',
        fontFamily: '"Noto Sans", sans-serif',
padding: isLanding ? '0' : '24px',
        overflow: isLanding ? 'hidden' : 'auto',
        borderRadius: 0,
        textAlign: 'center'
      }}
    >
      {children}
    </div>
  )
}

export const MainBlock = React.memo(MainBlockInner)
MainBlock.displayName = 'MainBlock'

