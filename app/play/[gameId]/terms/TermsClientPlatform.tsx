"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'
import { familyAndWeightFrom } from '../../../components/play/fontUtils'

export default function TermsClientPlatform({ gameId, texts, styles }: { gameId: string; texts: any; styles: any }) {
  const heroBg = styles?.hero?.background
  const mainBg = styles?.main?.background
  const title = texts?.TERMS_TITLE || 'General Terms & Conditions'
  const body = texts?.TERMS_BODY || ''
  const { family: pFamily, weight: pWeight } = familyAndWeightFrom(styles?.main?.pFontUrl, styles?.main?.pFontStyle)
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundCss={heroBg} title={title} titleClass={styles?.hero?.titleClass} titleColor={styles?.hero?.fontColor} useScoreboard={false} logoUrl={texts?.HERO_LOGO_URL} logoWidth={Number(texts?.HERO_LOGO_WIDTH) || 64} logoHeight={Number(texts?.HERO_LOGO_HEIGHT) || 64} fontUrl={styles?.hero?.fontUrl} fontStyle={styles?.hero?.fontStyle} />
      <MainBlock backgroundCss={mainBg} fonts={{ h1: { url: styles?.main?.h1FontUrl, style: styles?.main?.h1FontStyle }, h2: { url: styles?.main?.h2FontUrl, style: styles?.main?.h2FontStyle }, p: { url: styles?.main?.pFontUrl, style: styles?.main?.pFontStyle } }} fontUrl={styles?.main?.fontUrl} fontStyle={styles?.main?.fontStyle}>
        <div className={styles?.main?.pClass || 'text-base'} style={{ whiteSpace: 'pre-wrap', ...(pFamily ? { fontFamily: `"${pFamily}", "Noto Sans", sans-serif` } : {}), ...(pWeight != null ? { fontWeight: pWeight as any } : {}) }}>
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

