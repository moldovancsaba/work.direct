'use client'

import React, { useEffect } from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'

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

  // Enforce no-scroll at the document level while on rules
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
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}
    >
      <HeroBlock
        backgroundClass={heroBg}
        title={title}
        scoreboard={{
          home: 0,
          visitor: 0,
          homeBg: styles?.scoreboard?.homeBg || '#C00000FF',
          digitColor: styles?.scoreboard?.digitColor || '#FFFFFFFF'
        }}
      />
      <MainBlock backgroundClass={mainBg}>
        <div className="w-full h-full flex justify-center">
          <div className="h-full w-[80vw] min-w-[80vw] max-w-none space-y-4">
          <h2 className={styles?.main?.h2Class || 'text-xl font-semibold'}>{texts?.TEXT_21 || 'Rules'}</h2>
          <div className={styles?.main?.pClass || 'text-base'}>
            {rulesLines.length ? rulesLines.map((l: string, idx: number) => (<p key={idx} className="mb-1">{l}</p>)) : <p>No rules provided.</p>}
          </div>

          <h2 className={styles?.main?.h2Class || 'text-xl font-semibold'}>{texts?.TEXT_23 || 'Win Conditions'}</h2>
          <div className={styles?.main?.pClass || 'text-base'}>
            {winLines.length ? winLines.map((l: string, idx: number) => (<p key={idx} className="mb-1">{l}</p>)) : <p>No win conditions provided.</p>}
          </div>

          <div className="pt-4">
            <button
              onClick={() => onNext(`/play/${gameId}/game`)}
              className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'} text-2xl px-9 py-5`}
              style={(function () {
                const css = texts?.TEXT_25_BG as string | undefined
                if (!css) return undefined
                const grad = css.match(/linear-gradient\([^\)]+\)/i)
                if (grad) return { background: grad[0] }
                const bg = css.match(/background:\s*([^;]+);?/i)
                if (bg && bg[1]) return { background: bg[1].trim() }
                return undefined
              })()}
            >
              {texts?.TEXT_25 || 'Play'}
            </button>
          </div>
          </div>
        </div>
        <FooterLinks gameId={gameId} />
      </MainBlock>
    </div>
  )
}

