"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'

export default function PrivacyClientPlatform({ gameId, texts, styles }: { gameId: string; texts: any; styles: any }) {
  const heroBg = styles?.hero?.background
  const mainBg = styles?.main?.background
  const title = texts?.PRIVACY_TITLE || 'Privacy Policy'
  const body = texts?.PRIVACY_BODY || ''
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundCss={heroBg} title={title} />
      <MainBlock backgroundCss={mainBg}>
        <div className={styles?.main?.pClass || 'text-base'} style={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </div>
      </MainBlock>
      {/* Footer links pinned to bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full">
        <FooterLinks gameId={gameId} />
      </div>
    </div>
  )
}

