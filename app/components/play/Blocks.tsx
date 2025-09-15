"use client"

import React from 'react'
import SplitFlapScoreboard from '../game/SplitFlapScoreboard'

// HeroBlock — unified hero section used across play flow pages
// What: Renders the exact same SplitFlapScoreboard module used on the Game page.
// Why: Product requirement — identical layout/module across Welcome, Rules, Game, Result.
function extractBackgroundValue(css?: string): string | undefined {
  if (!css) return undefined
  const grad = css.match(/linear-gradient\([^\)]+\)/i)
  if (grad) return grad[0]
  const bg = css.match(/background:\s*([^;]+);?/i)
  if (bg && bg[1]) return bg[1].trim()
  return undefined
}

// HeroBlock — unified hero section used across play flow pages
// What: Renders the exact same SplitFlapScoreboard module used on the Game page and applies configurable background CSS.
// Why: Product requirement — identical layout/module and ensure "Hero Background (CSS)" is actually used.
function HeroBlockInner({ backgroundClass, backgroundCss, title, scoreboard, isLanding = false }: { backgroundClass?: string; backgroundCss?: string; title?: string; scoreboard?: { home: number; visitor: number; showLabels?: boolean; homeLabel?: string; visitorLabel?: string; homeBg?: string; visitorBg?: string; digitColor?: string }; isLanding?: boolean }) {
  const bg = extractBackgroundValue(backgroundCss)
  return (
    <div
      className={`w-full ${backgroundClass || ''} ${isLanding ? '' : 'px-4'} text-center`}
      style={{
        marginTop: '0',
        marginBottom: '0',
        height: '20vh',
        // Apply configured CSS background when provided; fallback to default color
        background: bg || undefined,
        backgroundColor: bg ? undefined : '#000000FF',
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

function MainBlockInner({ backgroundCss, children, isLanding = false, isGame = false }: { backgroundCss?: string; children: React.ReactNode; isLanding?: boolean; isGame?: boolean }) {
  const bg = extractBackgroundValue(backgroundCss)
  return (
    <div
      className={`w-full`}
      style={{
        width: '100vw',
        height: isLanding ? '80vh' : '76vh',
        marginBottom: '0',
        background: bg || undefined,
        backgroundColor: bg ? undefined : '#444444FF',
        color: '#FFFFFFFF',
        fontFamily: '"Noto Sans", sans-serif',
        padding: (isLanding || isGame) ? '0' : '24px',
        paddingBottom: (isLanding || isGame) ? '0' : '96px',
        overflow: (isLanding || isGame) ? 'hidden' : 'auto',
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

