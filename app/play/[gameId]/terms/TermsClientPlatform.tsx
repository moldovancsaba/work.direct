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
      <HeroBlock backgroundClass={heroBg} title={title} />
      <MainBlock backgroundClass={mainBg}>
        <div className={styles?.main?.pClass || 'text-base'} style={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </div>
        <FooterLinks gameId={gameId} />
      </MainBlock>
    </div>
  )
}

