"use client"

import React, { useEffect, useMemo } from 'react'
import SplitFlapScoreboard from '../game/SplitFlapScoreboard'
import { parseGoogleFont, extractWeight, buildGoogleCssHref, familyAndWeightFrom } from './fontUtils'

// HeroBlock — unified hero section used across play flow pages
// What: Renders the exact same SplitFlapScoreboard module used on the Game page.
// Why: Product requirement — identical layout/module across Welcome, Rules, Game, Result.
function extractBackgroundValue(css?: string): string | undefined {
  if (!css) return undefined
  // Prefer the last background: declaration
  let last: string | undefined
  const re = /background\s*:\s*([^;]+);?/ig
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    last = (m[1] || '').trim()
  }
  if (last) return last
  // Fallback: capture full linear-gradient(...) with balanced parentheses
  const low = css.toLowerCase()
  const idx = low.lastIndexOf('linear-gradient(')
  if (idx >= 0) {
    let depth = 0
    for (let i = idx; i < css.length; i++) {
      const ch = css[i]
      if (ch === '(') depth++
      else if (ch === ')') { depth--; if (depth === 0) return css.slice(idx, i + 1) }
    }
  }
  return undefined
}

// HeroBlock — unified hero section used across play flow pages
// What: Renders the exact same SplitFlapScoreboard module used on the Game page and applies configurable background CSS.
// Why: Product requirement — identical layout/module and ensure "Hero Background (CSS)" is actually used.
import Image from 'next/image'

// Sanitize CSS color: accept #RRGGBB[AA], rgb/rgba/hsl/hsla(), var(), named colors; add leading # when missing for hex
function sanitizeCssColor(input?: string): string | undefined {
  if (!input) return undefined
  const v = String(input).trim()
  if (!v) return undefined
  if (/^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v)) return v.startsWith('#') ? v : `#${v}`
  if (/^(?:rgb|rgba|hsl|hsla)\(/i.test(v)) return v
  if (/^var\(/i.test(v)) return v
  if (/^(?:currentColor|transparent|inherit)$/i.test(v)) return v
  if (/^[a-zA-Z]+$/.test(v)) return v
  return v
}

// Remove Tailwind text color utilities (including important prefix !) from a class list
function stripTailwindTextColorClasses(cls?: string): string {
  if (!cls) return ''
  return cls
    .split(/\s+/)
    .filter(tok => tok && !/^!?text-(?:\[[^\]]+\]|[a-zA-Z]+(?:-\d{1,3})?|inherit|current|transparent)$/.test(tok))
    .filter(tok => !/^\[color:.*\]$/.test(tok))
    .join(' ')
}

function HeroBlockInner({ backgroundClass, backgroundCss, title, titleClass, titleColor, scoreboard, isLanding = false, logoUrl, logoWidth = 64, logoHeight = 64, useScoreboard = false, fontUrl, fontStyle }: { backgroundClass?: string; backgroundCss?: string; title?: string; titleClass?: string; titleColor?: string; scoreboard?: { home: number; visitor: number; homeBg?: string; visitorBg?: string; digitColor?: string }; isLanding?: boolean; logoUrl?: string; logoWidth?: number; logoHeight?: number; useScoreboard?: boolean; fontUrl?: string; fontStyle?: string }) {
  const bg = extractBackgroundValue(backgroundCss)
  const family = useMemo(() => parseGoogleFont(fontUrl || ''), [fontUrl])
  const weight = useMemo(() => extractWeight(fontStyle || '') || 400, [fontStyle])

  // Inline font loading to avoid late reflow: inject preconnect + stylesheet during SSR
  const fontLinks = family ? (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={buildGoogleCssHref(family, weight)} />
    </>
  ) : null

  const cleanedTitleClass = useMemo(() => stripTailwindTextColorClasses(titleClass), [titleClass])
  const resolvedTitleColor = useMemo(() => sanitizeCssColor(titleColor), [titleColor])

  return (
    <div
      className={`w-full ${backgroundClass || ''} ${isLanding ? '' : 'px-4'} text-center`}
      style={{
        marginTop: '0',
        marginBottom: '0',
        height: '10vh',
        // Apply configured CSS background when provided; fallback to default color
        background: bg || undefined,
        backgroundColor: bg ? undefined : '#FFFFFFFF',
        fontFamily: family ? `"${family}", "Noto Sans", sans-serif` : '"Noto Sans", sans-serif',
        fontWeight: family ? (weight as any) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {fontLinks}
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
              className={cleanedTitleClass || 'scale-75 md:scale-90'}
              homeCardBg={scoreboard?.homeBg || '#C00000FF'}
              digitColor={scoreboard?.digitColor || '#FFFFFFFF'}
            />
          ) : (
            <SplitFlapScoreboard
              homeScore={scoreboard?.home ?? 0}
              visitorScore={scoreboard?.visitor ?? 0}
              homeCardBg={scoreboard?.homeBg || '#C00000FF'}
              visitorCardBg={scoreboard?.visitorBg || '#C00000FF'}
              digitColor={scoreboard?.digitColor || '#FFFFFFFF'}
              className={cleanedTitleClass || 'scale-75 md:scale-90'}
            />
          )
        ) : (
          <div className={cleanedTitleClass || 'text-xl md:text-2xl font-semibold'} style={{ color: resolvedTitleColor || undefined }}>
            {title && title.trim().length > 0
              ? title
              : `${scoreboard?.home ?? 0} - ${scoreboard?.visitor ?? 0}`}
          </div>
        )}
      </div>
    </div>
  )
}

export const HeroBlock = React.memo(HeroBlockInner)
HeroBlock.displayName = 'HeroBlock'

function MainBlockInner({ backgroundCss, children, isLanding = false, isGame = false, fonts, fontUrl, fontStyle }: { backgroundCss?: string; children: React.ReactNode; isLanding?: boolean; isGame?: boolean; fonts?: { h1?: { url?: string; style?: string }; h2?: { url?: string; style?: string }; p?: { url?: string; style?: string } }; fontUrl?: string; fontStyle?: string }) {
  const bg = extractBackgroundValue(backgroundCss)
  // Prepare font specs (family+weight) for H1/H2/P or fall back to single fontUrl/fontStyle
  const fontSpecs = useMemo(() => {
    const specs: Array<{ family: string; weight: number }> = []
    const add = (url?: string, style?: string) => {
      const { family, weight } = familyAndWeightFrom(url, style)
      if (family && weight) specs.push({ family, weight })
    }
    if (fonts) {
      add(fonts.h1?.url, fonts.h1?.style)
      add(fonts.h2?.url, fonts.h2?.style)
      add(fonts.p?.url, fonts.p?.style)
    } else {
      const fam = parseGoogleFont(fontUrl || '')
      const wt = extractWeight(fontStyle || '') || 400
      if (fam) specs.push({ family: fam, weight: wt })
    }
    // Dedupe by family-weight key
    const seen = new Set<string>()
    return specs.filter(s => {
      const key = `${s.family}-${s.weight}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [fonts, fontUrl, fontStyle])

  // Inline font loading for Main: preconnect + required families
  const fontLinks = fontSpecs.length ? (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {fontSpecs.map(({ family, weight }) => (
        <link key={`${family}-${weight}`} rel="stylesheet" href={buildGoogleCssHref(family, weight)} />
      ))}
    </>
  ) : null

  return (
    <div
      className={`w-full`}
      style={{
        width: '100vw',
        height: isLanding ? '90vh' : '86vh',
        marginBottom: '0',
        background: bg || undefined,
        backgroundColor: bg ? undefined : '#FFFFFFFF',
        padding: (isLanding || isGame) ? '0' : '24px',
        paddingBottom: (isLanding || isGame) ? '0' : '96px',
        overflow: (isLanding || isGame) ? 'hidden' : 'auto',
        borderRadius: 0,
        textAlign: 'center'
      }}
    >
      {fontLinks}
      {children}
    </div>
  )
}

export const MainBlock = React.memo(MainBlockInner)
MainBlock.displayName = 'MainBlock'

