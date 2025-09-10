'use client'

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'

interface RulesClientPlatformProps {
  gameId: string
  texts: any
  styles: any
  refCode?: string
}

export default function RulesClientPlatform({ gameId, texts, styles, refCode }: RulesClientPlatformProps) {
  const heroBg = styles?.hero?.background
  const heroTitleClass = styles?.hero?.titleClass
  const mainBg = styles?.main?.background

  const title = texts?.TEXT_20 || 'Game Rules'

  const onNext = (href: string) => {
    const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
    window.location.href = `${href}${q}`
  }

  const rulesLines = (texts?.TEXT_22 || '').split('\n').filter(Boolean)
  const winLines = (texts?.TEXT_24 || '').split('\n').filter(Boolean)

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}
    >
      <HeroBlock backgroundClass={heroBg} title={title} />
      <MainBlock backgroundClass={mainBg}>
        <div className="space-y-4">
          <h2 className={styles?.main?.h2Class || 'text-xl font-semibold'}>{texts?.TEXT_21 || 'Rules'}</h2>
          <div className={styles?.main?.pClass || 'text-base'}>
            {rulesLines.length ? rulesLines.map((l: string, idx: number) => (<p key={idx} className="mb-1">{l}</p>)) : <p>No rules provided.</p>}
          </div>

          <h2 className={styles?.main?.h2Class || 'text-xl font-semibold'}>{texts?.TEXT_23 || 'Win Conditions'}</h2>
          <div className={styles?.main?.pClass || 'text-base'}>
            {winLines.length ? winLines.map((l: string, idx: number) => (<p key={idx} className="mb-1">{l}</p>)) : <p>No win conditions provided.</p>}
          </div>

          <div className="pt-4">
            <button onClick={() => onNext(`/play/${gameId}/game`)} className={styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'}>
              {texts?.TEXT_25 || 'Play'}
            </button>
          </div>
        </div>
      </MainBlock>
    </div>
  )
}

