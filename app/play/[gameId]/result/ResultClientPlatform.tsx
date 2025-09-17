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

  // Share/copy invite instead of navigating back to Welcome/Landing
  // What: Use Web Share API with clipboard fallback and include participant uuid as ref.
  // Why: "Invite Friends" should share a link, not navigate away.
  const onInviteShare = async () => {
    const ref = getReferralUuid()
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '')
    const url = `${origin}/play/${gameId}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`
    try {
      if (navigator.share) {
        await navigator.share({ title: texts?.CTA_TITLE || 'PlayMass', text: texts?.TEXT_42 || 'Join me in this game!', url })
        return
      }
    } catch (e) {
      // fall back to clipboard
    }
    try {
      await navigator.clipboard.writeText(url)
      alert('Invite link copied to clipboard!')
    } catch {
      alert(`Invite link: ${url}`)
    }
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
        backgroundCss={heroBg}
        title={title}
        useScoreboard={styles?.hero?.useScoreboard !== false}
        logoUrl={texts?.HERO_LOGO_URL}
        logoWidth={Number(texts?.HERO_LOGO_WIDTH) || 64}
        logoHeight={Number(texts?.HERO_LOGO_HEIGHT) || 64}
        fontUrl={styles?.hero?.fontUrl}
        fontStyle={styles?.hero?.fontStyle}
        scoreboard={{
          home: 0,
          visitor: 0,
          homeBg: styles?.scoreboard?.homeBg || '#C00000FF',
          digitColor: styles?.scoreboard?.digitColor || '#FFFFFFFF'
        }}
      />
      <MainBlock backgroundCss={mainBg} fontUrl={styles?.main?.fontUrl} fontStyle={styles?.main?.fontStyle}>
        <div className="w-full h-full flex justify-center">
          <div className="h-full w-[80vw] min-w-[80vw] max-w-none space-y-6 text-center flex flex-col items-center justify-center">
          {/* Result headline based on win/lose */}
          {typeof won !== 'undefined' && (
            <h1 className={styles?.main?.h1Class || 'text-3xl font-bold'} style={{ whiteSpace: 'pre-wrap' }}>
              {won ? (texts?.WON_TEXT || 'Congratulations!') : (texts?.LOST_TEXT || 'Game Over')}
            </h1>
          )}
          <h1 className={styles?.main?.h1Class || 'text-3xl font-bold'}>{texts?.CTA_TITLE || texts?.TEXT_42 || 'Share Your Result'}</h1>

          {/* Primary CTA (always render first if provided) */}
          {(function () {
            const primaryText = (texts?.CTA1_TEXT || '').trim() || (texts?.TEXT_44 || '').trim()
            const primaryUrl = (texts?.CTA1_URL || '').trim() || (texts?.TEXT_44_URL || '').trim()
            if (primaryText && primaryUrl) {
              return (
                <div className="w-full pt-2 pb-1">
                  <a
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'} text-2xl text-center block`}
                    style={{ background: extractBackgroundValue(texts?.CTA1_BG), minHeight: '56px', minWidth: '260px', maxWidth: '520px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {primaryText}
                  </a>
                </div>
              )
            }
            return null
          })()}

          {/* Additional CTA Buttons Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
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
                    className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'} text-2xl text-center block`}
                    style={{ background: extractBackgroundValue(btn?.bg) || extractBackgroundValue(texts?.CTA1_BG), minHeight: '48px', minWidth: '240px', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {btn.text}
                  </a>
                ))
            ) : null}
          </div>

          {/* Secondary Actions Grid: Invite + Play Again */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <button
              onClick={onInviteShare}
              className='px-6 py-3 text-white rounded-lg text-2xl block'
              style={{ background: extractBackgroundValue(texts?.TEXT_45_BG), minHeight: '48px', minWidth: '240px', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {texts?.TEXT_45 || 'Invite Friend'}
            </button>
            <button
              onClick={() => navigateWithRef(`/play/${gameId}/welcome`)}
              className={`${styles?.main?.buttonPrimaryClass || 'px-6 py-3 text-white rounded-lg'} text-2xl block`}
              style={{ background: extractBackgroundValue(texts?.TEXT_46_BG), minHeight: '48px', minWidth: '240px', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {texts?.TEXT_46 || 'Play Again'}
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

