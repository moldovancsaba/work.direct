'use client'

import React, { useEffect } from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import FooterLinks from '../../../components/play/FooterLinks'

interface ResultClientPlatformProps {
  gameId: string
  texts: any
  styles: any
  won?: boolean
  refCode?: string
}

export default function ResultClientPlatform({ gameId, texts, styles, won, refCode }: ResultClientPlatformProps) {
  const heroBg = styles?.hero?.background
  const heroTitleClass = styles?.hero?.titleClass
  const mainBg = styles?.main?.background

  const title = texts?.TEXT_40 || (won ? 'Victory!' : 'Result')

  const extractBackgroundValue = (css?: string): string | undefined => {
    if (!css) return undefined
    const grad = css.match(/linear-gradient\([^\)]+\)/i)
    if (grad) return grad[0]
    const bg = css.match(/background:\s*([^;]+);?/i)
    if (bg && bg[1]) return bg[1].trim()
    return undefined
  }

  const getReferralUuid = (): string | undefined => {
    try {
      const raw = localStorage.getItem(`playmass:session:${gameId}`)
      if (raw) {
        const session = JSON.parse(raw)
        return session?.participant?.uuid || undefined
      }
    } catch {}
    return refCode
  }

  // Removed generic share/copy actions per product decision
  // WHAT: We no longer provide standalone "Copy Link" or "Share" buttons on the result page.
  // WHY: Simplify the CTA surface area and avoid redundant share patterns;
  //      keep "Invite Friend" (referral share) and "Play Again" only.

  const navigateWithRef = (path: string) => {
    const ref = getReferralUuid()
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : ''
    window.location.href = `${path}${q}`
  }

  const onInviteLanding = () => {
    navigateWithRef(`/play/${gameId}/landing`)
  }

  // Enforce no-scroll at the document level while on result
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
        <div className="space-y-6 text-center flex flex-col items-center justify-center">
          {/* Participated note (Markdown-like, multiline) */}
          {texts?.TEXT_41 && (
            <p className={styles?.main?.pClass || 'text-base'} style={{ whiteSpace: 'pre-wrap' }}>{texts.TEXT_41}</p>
          )}
          {/* Result headline based on win/lose */}
          {typeof won !== 'undefined' && (
            <h1 className={styles?.main?.h1Class || 'text-3xl font-bold'} style={{ whiteSpace: 'pre-wrap' }}>
              {won ? (texts?.WON_TEXT || 'Congratulations!') : (texts?.LOST_TEXT || 'Game Over')}
            </h1>
          )}
          <h1 className={styles?.main?.h1Class || 'text-3xl font-bold'}>{texts?.CTA_TITLE || texts?.TEXT_42 || 'Share Your Result'}</h1>
          <p className={styles?.main?.pClass || 'text-base'}>{texts?.CTA_DESCRIPTION || texts?.TEXT_43 || 'Copy or share your result with friends.'}</p>

          <div className="w-full max-w-sm flex flex-col gap-3 pt-2">
            {/* CTA Buttons (vertical stack) */}
            {Array.isArray(texts?.CTA_BUTTONS) && texts.CTA_BUTTONS.length > 0 ? (
              texts.CTA_BUTTONS
                .filter((btn: any) => (btn?.text || '').trim() && (btn?.url || '').trim())
                .map((btn: any, idx: number) => (
                  <a
                    key={idx}
                    href={btn.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseDown={(e) => {
                      if (styles?.main?.buttonSecondaryClass) {
                        (e.currentTarget as HTMLAnchorElement).className = styles.main.buttonSecondaryClass
                      }
                    }}
                    onMouseUp={(e) => {
                      if (styles?.main?.buttonPrimaryClass) {
                        (e.currentTarget as HTMLAnchorElement).className = styles.main.buttonPrimaryClass
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (styles?.main?.buttonPrimaryClass) {
                        (e.currentTarget as HTMLAnchorElement).className = styles.main.buttonPrimaryClass
                      }
                    }}
                    className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'} text-2xl px-9 py-5`}
                    style={{ background: extractBackgroundValue(btn?.bg) || extractBackgroundValue(texts?.CTA1_BG) }}
                  >
                    {btn.text}
                  </a>
                ))
            ) : (
              // Back-compat single CTA
              (texts?.TEXT_44_URL && texts.TEXT_44_URL.trim().length > 0 && (
                <a
                  href={texts.TEXT_44_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={(e) => {
                    if (styles?.main?.buttonSecondaryClass) {
                      (e.currentTarget as HTMLAnchorElement).className = styles.main.buttonSecondaryClass
                    }
                  }}
                  onMouseUp={(e) => {
                    if (styles?.main?.buttonPrimaryClass) {
                      (e.currentTarget as HTMLAnchorElement).className = styles.main.buttonPrimaryClass
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (styles?.main?.buttonPrimaryClass) {
                      (e.currentTarget as HTMLAnchorElement).className = styles.main.buttonPrimaryClass
                    }
                  }}
                  className={styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'}
                  style={{ background: extractBackgroundValue(texts?.CTA1_BG) }}
                >
                  {texts?.TEXT_44 || 'Open CTA'}
                </a>
              ))
            )}

            {/* Invite Friend → Landing */}
            <button
              onClick={onInviteLanding}
              className='px-6 py-3 text-white rounded-lg text-2xl px-9 py-5'
              style={{ background: extractBackgroundValue(texts?.TEXT_45_BG) }}
            >
              {texts?.TEXT_45 || 'Invite Friend'}
            </button>
            {/* Play Again → Welcome */}
            <button
              onClick={() => navigateWithRef(`/play/${gameId}/welcome`)}
              className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 text-white rounded-lg'} text-2xl px-9 py-5`}
              style={{ background: extractBackgroundValue(texts?.TEXT_46_BG) }}
            >
              {texts?.TEXT_46 || 'Play Again'}
            </button>
          </div>
        </div>
        <FooterLinks gameId={gameId} />
      </MainBlock>
    </div>
  )
}

