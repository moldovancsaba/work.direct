'use client'

import React, { useEffect } from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'
import TypedText, { resolveTextType, classFor } from '../../../components/play/TypedText'

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
      style={{ backgroundColor: '#000000FF', fontFamily: '"Noto Sans", sans-serif' }}
    >
      <HeroBlock
        backgroundCss={heroBg}
        title={title}
        useScoreboard={false}
        logoUrl={texts?.HERO_LOGO_URL}
        logoWidth={Number(texts?.HERO_LOGO_WIDTH) || 64}
        logoHeight={Number(texts?.HERO_LOGO_HEIGHT) || 64}
        fontUrl={styles?.hero?.fontUrl}
        fontStyle={styles?.hero?.fontStyle}
        titleClass={styles?.hero?.titleClass}
        titleColor={styles?.hero?.fontColor}
      />
      <MainBlock backgroundCss={mainBg} fonts={{ h1: { url: styles?.main?.h1FontUrl, style: styles?.main?.h1FontStyle }, h2: { url: styles?.main?.h2FontUrl, style: styles?.main?.h2FontStyle }, p: { url: styles?.main?.pFontUrl, style: styles?.main?.pFontStyle } }} fontUrl={styles?.main?.fontUrl} fontStyle={styles?.main?.fontStyle}>
        <div className="w-full h-full flex justify-center">
          <div className="h-full w-[80vw] min-w-[80vw] max-w-none space-y-4">
          <TypedText code="TEXT_21" texts={texts} styles={styles} defaultType="H2" />
          {(function(){
            const t = resolveTextType(styles,'TEXT_22','P')
            const cls = classFor(t, styles)
            const color = t==='H1'?styles?.main?.h1Color: t==='H2'?styles?.main?.h2Color: styles?.main?.pColor
            return (
              <div className={cls} style={{ color: (color || '').trim() || undefined }}>
                {rulesLines.length ? rulesLines.map((l: string, idx: number) => (<div key={idx} className="mb-1" style={{whiteSpace:'pre-wrap'}}>{l}</div>)) : <div>No rules provided.</div>}
              </div>
            )
          })()}

          <TypedText code="TEXT_23" texts={texts} styles={styles} defaultType="H2" />
          {(function(){
            const t = resolveTextType(styles,'TEXT_24','P')
            const cls = classFor(t, styles)
            const color = t==='H1'?styles?.main?.h1Color: t==='H2'?styles?.main?.h2Color: styles?.main?.pColor
            return (
              <div className={cls} style={{ color: (color || '').trim() || undefined }}>
                {winLines.length ? winLines.map((l: string, idx: number) => (<div key={idx} className="mb-1" style={{whiteSpace:'pre-wrap'}}>{l}</div>)) : <div>No win conditions provided.</div>}
              </div>
            )
          })()}

          <div className="pt-4">
            <button
              onClick={() => onNext(`/play/${gameId}/game`)}
              className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 rounded-lg'} text-2xl`}
              style={(function () {
                const css = (texts?.NEXT_PLAY_BG || texts?.TEXT_25_BG) as string | undefined
const base: any = { color: (texts?.NEXT_PLAY_FG || (texts as any)?.TEXT_25_FG || undefined) as any, minHeight: '48px', minWidth: '240px', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                if (!css) return base
                // Use the last background: declaration if present
                let last: string | undefined
                const re = /background\s*:\s*([^;]+);?/ig
                let m: RegExpExecArray | null
                while ((m = re.exec(css)) !== null) {
                  last = (m[1] || '').trim()
                }
                if (last) return { ...base, background: last }
                // Fallback: try to capture a full linear-gradient(...) block
                const low = css.toLowerCase()
                const idx = low.lastIndexOf('linear-gradient(')
                if (idx >= 0) {
                  let depth = 0
                  for (let i = idx; i < css.length; i++) {
                    const ch = css[i]
                    if (ch === '(') depth++
                    else if (ch === ')') { depth--; if (depth === 0) return { ...base, background: css.slice(idx, i + 1) } }
                  }
                }
                return base
              })()}
            >
              {texts?.TEXT_25 || 'Play'}
            </button>
          </div>
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

