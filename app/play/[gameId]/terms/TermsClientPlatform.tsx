"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'

export default function TermsClientPlatform({ gameId, texts, styles }: { gameId: string; texts: any; styles: any }) {
  const heroBg = styles?.hero?.background
  const mainBg = styles?.main?.background
  const title = texts?.TERMS_TITLE || 'General Terms & Conditions'
  const body = texts?.TERMS_BODY || ''
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundCss={heroBg} title={title} useScoreboard={styles?.hero?.useScoreboard !== false} logoUrl={texts?.HERO_LOGO_URL} logoWidth={Number(texts?.HERO_LOGO_WIDTH) || 64} logoHeight={Number(texts?.HERO_LOGO_HEIGHT) || 64} />
      <MainBlock backgroundCss={mainBg}>
        <div className={styles?.main?.pClass || 'text-base'} style={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </div>
      </MainBlock>
      {/* Footer links pinned to bottom of screen */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full z-50">
        <FooterLinks gameId={gameId} />
      </div>
    </div>
  )
}

