'use client'

import React from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import UnifiedRegistration from '../../../components/game/UnifiedRegistration'

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
      <HeroBlock backgroundClass={heroBg} title={title} />
      <MainBlock backgroundClass={mainBg}>
        {description && <p className={styles?.main?.pClass || 'text-base mb-4'} style={{ color: '#FFFFFFFF' }}>{description}</p>}
        <div className="space-y-3">
          <h2 className={styles?.main?.h2Class || 'text-xl font-semibold'}>{texts?.TEXT_12 || 'Your Name'}</h2>
          <UnifiedRegistration
            onRegister={async (p) => { saveSession(p, false); onNext(`/play/${gameId}/rules`) }}
            onTrialMode={() => { saveSession({ name: 'Guest' }, true); onNext(`/play/${gameId}/rules`) }}
            gameTitle={title}
            gameName={title}
            showTrialOption={true}
            hideHeader={true}
            containerMode="embedded"
            customTexts={{
              startPlayingButton: btnLogin,
              tryWithoutRegText: '',
              tryWithoutRegButton: btnTrial,
              namePlaceholder: namePh,
              emailPlaceholder: emailPh,
              phonePlaceholder: phonePh
            }}
          />
        </div>
      </MainBlock>
    </div>
  )
}

