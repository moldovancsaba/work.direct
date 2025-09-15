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
  const action = (typeof texts?.NEXT_WELCOME_ACTION === 'string' && texts.NEXT_WELCOME_ACTION.trim()) ? texts.NEXT_WELCOME_ACTION.trim() : 'GO_TO_WELCOME'

  const extractBackgroundValue = (css?: string): string | undefined => {
    if (!css) return undefined
    const grad = css.match(/linear-gradient\([^\)]+\)/i)
    if (grad) return grad[0]
    const bg = css.match(/background:\s*([^;]+);?/i)
    if (bg && bg[1]) return bg[1].trim()
    return undefined
  }

  const buildHrefForAction = (act: string): string => {
    switch (act) {
      case 'GO_TO_WELCOME':
      default:
        return `/play/${gameId}/welcome`
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
    <div className="fixed inset-0 w-screen h-screen overflow-hidden" style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundCss={heroBg} title={title} scoreboard={{ home: 0, visitor: 0, homeBg: styles?.scoreboard?.homeBg || '#C00000FF', digitColor: styles?.scoreboard?.digitColor || '#FFFFFFFF' }} isLanding={true} />
      <MainBlock backgroundCss={mainBg} isLanding={true}>
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
              className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 text-white rounded-lg'} text-2xl`}
style={{ background: extractBackgroundValue(texts?.NEXT_WELCOME_BG), minHeight: '48px', minWidth: '240px', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
