'use client'

import React from 'react'
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

  const title = texts?.LANDING_TITLE || texts?.TEXT_30 || 'Welcome'
  const imageUrl = texts?.LANDING_IMAGE_URL || ''
  const ctaText = texts?.LANDING_CTA_TEXT || 'Enter'

  const onNext = (href: string) => {
    const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
    window.location.href = `${href}${q}`
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundClass={heroBg} title={title} scoreboard={{ home: 0, visitor: 0, homeBg: styles?.scoreboard?.homeBg || '#C00000FF', digitColor: styles?.scoreboard?.digitColor || '#FFFFFFFF' }} />
      <MainBlock backgroundClass={mainBg}>
        <div className="flex flex-col items-center justify-center gap-4">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="max-w-xs rounded-md shadow" />
          ) : (
            <div className="w-64 h-40 bg-gray-700 rounded-md flex items-center justify-center text-gray-300">Image</div>
          )}
          <button
            onClick={() => onNext(`/play/${gameId}/welcome`)}
            className={styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'}
          >
            {ctaText}
          </button>
        </div>
        <FooterLinks gameId={gameId} />
      </MainBlock>
    </div>
  )
}