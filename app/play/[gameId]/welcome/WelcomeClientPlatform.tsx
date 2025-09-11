'use client'

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import UnifiedRegistration from '../../../components/game/UnifiedRegistration'
import FooterLinks from '../../../components/play/FooterLinks'

interface WelcomeClientPlatformProps {
  gameId: string
  texts: any
  styles: any
  refCode?: string
}

export default function WelcomeClientPlatform({ gameId, texts, styles, refCode }: WelcomeClientPlatformProps) {
  const heroBg = styles?.hero?.background
  const heroTitleClass = styles?.hero?.titleClass
  const mainBg = styles?.main?.background

  const title = texts?.TEXT_10 || 'Welcome'

  const namePh = texts?.TEXT_13 || 'Enter your name'
  const emailPh = texts?.TEXT_15 || 'your@email.com'
  const phonePh = texts?.TEXT_17 || '+1 (555) 123-4567'
  const btnLogin = texts?.TEXT_18 || 'Start'
  const btnTrial = texts?.TEXT_19 || 'Try Without Registration'
  const description = texts?.TEXT_11 || ''

  const generateUuid = (): string => {
    try {
      if (typeof (globalThis as any).crypto !== 'undefined' && (globalThis as any).crypto.randomUUID) {
        return (globalThis as any).crypto.randomUUID()
      }
    } catch {}
    return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }

  const saveSession = (participant: any, trial = false) => {
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    const payload = {
      participant: { ...participant, uuid: participant?.uuid || generateUuid() },
      trial,
      sessionId,
      ref: refCode || null
    }
    try {
      localStorage.setItem(`playmass:session:${gameId}`, JSON.stringify(payload))
    } catch {}
  }

  const onNext = (href: string) => {
    const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
    window.location.href = `${href}${q}`
  }

  return (
    <div
      className="min-h-screen w-full"
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
        {description && (
          <p
            className={(styles?.main?.pClass || 'text-base mb-4') + ' text-center'}
            style={{ color: '#FFFFFFFF', whiteSpace: 'pre-wrap' }}
          >
            {description}
          </p>
        )}
        <div className="space-y-3">
          {/* Alternative login with Facebook */}
          <div className="text-center">
            <a
              href="/api/auth/facebook/start"
              className={styles?.main?.buttonSecondaryClass || 'px-6 py-3 bg-[#1877F2] text-white rounded-lg inline-block'}
            >
              Continue with Facebook
            </a>
          </div>

          <UnifiedRegistration
            onRegister={async (p) => { saveSession(p, false); onNext(`/play/${gameId}/rules`) }}
            onTrialMode={() => { saveSession({ name: 'Guest' }, true); onNext(`/play/${gameId}/rules`) }}
            gameTitle={title}
            gameName={title}
            showTrialOption={true}
            hideHeader={true}
            containerMode="embedded"
            headingClass={styles?.main?.h2Class || 'text-xl font-semibold'}
            primaryButtonBgCss={texts?.TEXT_18_BG}
            trialButtonBgCss={texts?.TEXT_19_BG}
            customTexts={{
              // Headings (H2)
              nameHeading: texts?.TEXT_12 || 'Your Name',
              emailHeading: texts?.TEXT_14 || 'Your Email',
              phoneHeading: texts?.TEXT_16 || 'Your Phone',
              // Placeholders and buttons
              startPlayingButton: btnLogin,
              tryWithoutRegButton: btnTrial,
              namePlaceholder: namePh,
              emailPlaceholder: emailPh,
              phonePlaceholder: phonePh,
              // Helper texts
              contactRequiredError: texts?.TEXT_26 || 'Please provide either email or phone number',
              tryWithoutRegText: texts?.TEXT_27 || 'Want to try without registration?'
            }}
          />
        </div>
        <FooterLinks gameId={gameId} />
      </MainBlock>
    </div>
  )
}

