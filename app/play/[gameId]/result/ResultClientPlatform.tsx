'use client'

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'

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

  const onInviteReferral = async () => {
    const base = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
    const shareRef = getReferralUuid()
    // Build query-style referral URL: /play/{gameId}?ref={uuid}
    const url = `${base}/play/${gameId}${shareRef ? `?ref=${encodeURIComponent(shareRef)}` : ''}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Invite Friend', text: texts?.TEXT_42 || 'Challenge your friends!', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Referral link copied!')
      }
    } catch {}
  }

return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}
    >
      <HeroBlock backgroundClass={heroBg} title={title} />
      <MainBlock backgroundClass={mainBg}>
        <div className="space-y-4 text-center">
          {texts?.TEXT_41 && <p className={styles?.main?.pClass || 'text-base'}>{texts.TEXT_41}</p>}
          <h1 className={styles?.main?.h1Class || 'text-3xl font-bold'}>{texts?.TEXT_42 || 'Share Your Result'}</h1>
          <p className={styles?.main?.pClass || 'text-base'}>{texts?.TEXT_43 || 'Copy or share your result with friends.'}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button onClick={onInviteReferral} className='px-6 py-3 bg-purple-600 text-white rounded-lg'>
              {texts?.TEXT_45 || 'Invite Friend'}
            </button>
            {/* CTA Action (TEXT_44) opens per-game URL if provided */}
            {texts?.TEXT_44_URL && texts.TEXT_44_URL.trim().length > 0 && (
              <button
                type="button"
                onClick={() => { window.location.href = texts.TEXT_44_URL }}
                className={styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-blue-600 text-white rounded-lg'}
                aria-label={texts?.TEXT_44 || 'Open CTA'}
              >
                {texts?.TEXT_44 || 'Open CTA'}
              </button>
            )}
            <button onClick={() => window.location.href = `/play/${gameId}`} className={styles?.main?.buttonPrimaryClass || 'px-6 py-3 bg-green-600 text-white rounded-lg'}>
              {texts?.TEXT_46 || 'Play Again'}
            </button>
          </div>
        </div>
      </MainBlock>
    </div>
  )
}

