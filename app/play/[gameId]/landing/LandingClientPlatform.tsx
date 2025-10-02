'use client'

import React, { useEffect } from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'

interface LandingClientPlatformProps {
  gameId: string
  texts: any
  styles: any
  refCode?: string
}

export default function LandingClientPlatform({ gameId, texts, styles, refCode }: LandingClientPlatformProps) {
  const heroBg = styles?.hero?.background
  const mainBg = styles?.main?.background

  // Title and image fallback to empty when not provided (per product requirement)
  const title = (typeof texts?.LANDING_TITLE === 'string') ? texts.LANDING_TITLE : ''
  const imageUrl = (typeof texts?.LANDING_IMAGE_URL === 'string') ? texts.LANDING_IMAGE_URL : ''
  const ctaText = texts?.NEXT_WELCOME_TEXT || 'Enter'
  const action = (typeof texts?.NEXT_WELCOME_ACTION === 'string' && texts.NEXT_WELCOME_ACTION.trim()) ? texts.NEXT_WELCOME_ACTION.trim() : 'GO_TO_GAME'

  const extractBackgroundValue = (css?: string): string | undefined => {
    if (!css) return undefined
    // Grab the last background: ... value, respecting CSS precedence
    let last: string | undefined
    const re = /background\s*:\s*([^;]+);?/ig
    let m: RegExpExecArray | null
    while ((m = re.exec(css)) !== null) {
      last = (m[1] || '').trim()
    }
    if (last) return last
    // Fallback: attempt to extract a full linear-gradient(...) block
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

  const buildHrefForAction = (act: string): string => {
    switch (act) {
      case 'GO_TO_GAME':
      case 'GO_TO_WELCOME': // legacy value maps to Game now
      default:
        return `/play/${gameId}/game`
    }
  }

  const onNext = (href: string) => {
    const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
    window.location.href = `${href}${q}`
  }

  // Enforce no-scroll at the document level while on landing
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden" style={{ backgroundColor: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundCss={heroBg} title={title} titleClass={styles?.hero?.titleClass} titleColor={styles?.hero?.fontColor} useScoreboard={false} logoUrl={texts?.HERO_LOGO_URL} logoWidth={Number(texts?.HERO_LOGO_WIDTH) || 64} logoHeight={Number(texts?.HERO_LOGO_HEIGHT) || 64} fontUrl={styles?.hero?.fontUrl} fontStyle={styles?.hero?.fontStyle} isLanding={true} />
      <MainBlock backgroundCss={mainBg} isLanding={true} fonts={{ h1: { url: styles?.main?.h1FontUrl, style: styles?.main?.h1FontStyle }, h2: { url: styles?.main?.h2FontUrl, style: styles?.main?.h2FontStyle }, p: { url: styles?.main?.pFontUrl, style: styles?.main?.pFontStyle } }} fontUrl={styles?.main?.fontUrl} fontStyle={styles?.main?.fontStyle}>
        <div className="relative w-full h-full">
          {/* Background cover image */}
          {imageUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'none'
              }}
            />
          )}
          {/* Centered CTA Button */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <button
              onClick={() => onNext(buildHrefForAction(action))}
              className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 rounded-lg'} text-2xl`}
style={{ background: extractBackgroundValue(texts?.NEXT_WELCOME_BG) || '#000000FF', color: (texts?.NEXT_WELCOME_FG || '').trim() || undefined, minHeight: '48px', minWidth: '240px', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {ctaText}
            </button>
          </div>
        </div>
      </MainBlock>
      {/* Footer links pinned to bottom of screen */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full z-50">
        <FooterLinks gameId={gameId} />
      </div>
    </div>
  )
}
