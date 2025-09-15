"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'

export default function DeletionClientPlatform({ gameId, texts, styles }: { gameId: string; texts: any; styles: any }) {
  const heroBg = styles?.hero?.background
  const mainBg = styles?.main?.background
  const title = texts?.DELETION_TITLE || 'User Data Deletion'
  const body = texts?.DELETION_BODY || ''
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock backgroundCss={heroBg} title={title} />
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

