"use client"

import React, { useEffect, useMemo } from 'react'
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
import Image from 'next/image'

function parseGoogleFont(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // Expecting fonts.google.com/specimen/<Family>
    if (!u.hostname.includes('fonts.google.com')) return null
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex(p => p.toLowerCase() === 'specimen')
    if (idx >= 0 && parts[idx + 1]) {
      return decodeURIComponent(parts[idx + 1]).replace(/\+/g, ' ')
    }
    return null
  } catch {
    return null
  }
}

function buildGoogleCssHref(family: string, weight: number): string {
  const fam = family.replace(/ /g, '+')
  const w = Math.min(900, Math.max(100, Math.round(weight / 100) * 100))
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}:wght@${w}&display=swap`
}

function extractWeight(style?: string): number | null {
  if (!style) return null
  const match = String(style).match(/(100|200|300|400|500|600|700|800|900)/)
  return match ? Number(match[1]) : null
}
function HeroBlockInner({ backgroundClass, backgroundCss, title, titleClass, scoreboard, isLanding = false, logoUrl, logoWidth = 64, logoHeight = 64, useScoreboard = true, fontUrl, fontStyle }: { backgroundClass?: string; backgroundCss?: string; title?: string; titleClass?: string; scoreboard?: { home: number; visitor: number; showLabels?: boolean; homeLabel?: string; visitorLabel?: string; homeBg?: string; visitorBg?: string; digitColor?: string }; isLanding?: boolean; logoUrl?: string; logoWidth?: number; logoHeight?: number; useScoreboard?: boolean; fontUrl?: string; fontStyle?: string }) {
  const bg = extractBackgroundValue(backgroundCss)
  const family = useMemo(() => parseGoogleFont(fontUrl || ''), [fontUrl])
  const weight = useMemo(() => extractWeight(fontStyle || '') || 400, [fontStyle])

  useEffect(() => {
    if (!family) return
    const id = `pm-font-hero-${family}-${weight}`
    if (document.getElementById(id)) return
    const href = buildGoogleCssHref(family, weight)
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [family, weight])

  return (
    <div
      className={`w-full ${backgroundClass || ''} ${isLanding ? '' : 'px-4'} text-center`}
      style={{
        marginTop: '0',
        marginBottom: '0',
        height: '10vh',
        // Apply configured CSS background when provided; fallback to default color
        background: bg || undefined,
        backgroundColor: bg ? undefined : '#000000FF',
        color: '#FFFFFFFF',
        fontFamily: family ? `"${family}", "Noto Sans", sans-serif` : '"Noto Sans", sans-serif',
        fontWeight: family ? (weight as any) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Left logo (optional) */}
      {logoUrl && (
        <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2">
          <Image src={logoUrl} alt="logo" width={logoWidth} height={logoHeight} className="object-contain" unoptimized />
        </div>
      )}
      <div className="flex justify-center w-full">
        {useScoreboard ? (
          title && title.trim().length > 0 ? (
            <SplitFlapScoreboard
              mode="title"
              titleText={title}
              className={titleClass || 'scale-75 md:scale-90'}
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
              className={titleClass || 'scale-75 md:scale-90'}
            />
          )
        ) : (
          <div className={titleClass || 'text-xl md:text-2xl font-semibold'}>
            {title && title.trim().length > 0
              ? title
              : `${(scoreboard?.homeLabel || 'HOME')}: ${scoreboard?.home ?? 0}  -  ${(scoreboard?.visitorLabel || 'VISITOR')}: ${scoreboard?.visitor ?? 0}`}
          </div>
        )}
      </div>
    </div>
  )
}

export const HeroBlock = React.memo(HeroBlockInner)
HeroBlock.displayName = 'HeroBlock'

function MainBlockInner({ backgroundCss, children, isLanding = false, isGame = false, fontUrl, fontStyle }: { backgroundCss?: string; children: React.ReactNode; isLanding?: boolean; isGame?: boolean; fontUrl?: string; fontStyle?: string }) {
  const bg = extractBackgroundValue(backgroundCss)
  const family = useMemo(() => parseGoogleFont(fontUrl || ''), [fontUrl])
  const weight = useMemo(() => extractWeight(fontStyle || '') || 400, [fontStyle])

  useEffect(() => {
    if (!family) return
    const id = `pm-font-main-${family}-${weight}`
    if (document.getElementById(id)) return
    const href = buildGoogleCssHref(family, weight)
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [family, weight])

  return (
    <div
      className={`w-full`}
      style={{
        width: '100vw',
        height: isLanding ? '90vh' : '86vh',
        marginBottom: '0',
        background: bg || undefined,
        backgroundColor: bg ? undefined : '#444444FF',
        color: '#FFFFFFFF',
        fontFamily: family ? `"${family}", "Noto Sans", sans-serif` : '"Noto Sans", sans-serif',
        fontWeight: family ? (weight as any) : undefined,
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

