'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { HeroBlock, MainBlock } from '../../../components/play/Blocks'
import UnifiedRegistration from '../../../components/game/UnifiedRegistration'
import FooterLinks from '../../../components/play/FooterLinks'

interface WelcomeClientPlatformProps {
  gameId: string
  texts: any
  styles: any
  refCode?: string
}

// Minimal window typing to access FB safely; full types are declared in app/types if present.
declare global {
  interface Window { FB?: any; __fbReady?: boolean }
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

  const [fbReady, setFbReady] = useState<boolean>(typeof window !== 'undefined' ? !!window.__fbReady && !!window.FB : false)
  const [fbError, setFbError] = useState<string | null>(null)
  const [fbLoading, setFbLoading] = useState<boolean>(false)

  // Build-time app ID presence (NEXT_PUBLIC_ variables are inlined at build)
  const buildAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
  const hasAppId = useMemo(() => !!String(buildAppId).trim(), [buildAppId])

  // Ref to container where fb-login-button markup will be placed for XFBML parsing
  const fbPluginContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onReady = () => {
      setFbReady(!!window.FB)
      try {
        if (window.FB && fbPluginContainerRef.current) {
          // Parse XFBML inside our container to render the plugin
          window.FB.XFBML.parse(fbPluginContainerRef.current)
        }
      } catch {}
      try {
        // Subscribe to login status changes to capture token from plugin login
        window.FB?.Event?.subscribe('auth.statusChange', async (response: any) => {
          if (response?.status === 'connected' && response.authResponse?.accessToken) {
            try {
              const res = await fetch('/api/auth/facebook/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ accessToken: response.authResponse.accessToken })
              })
              const data = await res.json().catch(() => ({}))
              if (res.ok && data?.success) {
                const name = data?.user?.name || 'Facebook User'
                const email = data?.user?.email
                saveSession({ name, email }, false)
                onNext(`/play/${gameId}/rules`)
              } else {
                setFbError(data?.error || 'Facebook login failed. Please try again.')
              }
            } catch {
              setFbError('Unexpected error during Facebook login. Please try again.')
            }
          }
        })
      } catch {}
    }
    const onError = () => setFbError(prev => prev || (typeof (window as any).__fbError === 'string' ? (window as any).__fbError : 'SDK_ERROR'))
    if (typeof window !== 'undefined') {
      if (window.__fbReady && window.FB) onReady()
      else window.addEventListener('fb-sdk-ready', onReady, { once: true })
      window.addEventListener('fb-sdk-error', onError as any, { once: true })
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('fb-sdk-ready', onReady as any)
        window.removeEventListener('fb-sdk-error', onError as any)
        try { window.FB?.Event?.unsubscribe?.('auth.statusChange'); } catch {}
      }
    }
  }, [gameId])

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

  // Facebook login handler using JS SDK popup
  const handleFacebookLogin = async () => {
    setFbError(null)
    if (!hasAppId) {
      setFbError('Facebook App ID is not configured for this build.')
      return
    }
    if (!window.FB) {
      setFbError('Facebook SDK is not ready. Please try again shortly.')
      return
    }
    setFbLoading(true)
    try {
      // FB.login presents the popup; request minimal scope for name+email
      window.FB.login(async (response: any) => {
        try {
          if (response && response.status === 'connected' && response.authResponse?.accessToken) {
            const accessToken = response.authResponse.accessToken as string
            // Verify on server and set httpOnly session cookie; never store token client-side
            const res = await fetch('/api/auth/facebook/client', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ accessToken })
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok && data?.success) {
              // Save local session details for gameplay continuity
              const name = data?.user?.name || 'Facebook User'
              const email = data?.user?.email
              saveSession({ name, email }, false)
              onNext(`/play/${gameId}/rules`)
              return
            }
            setFbError(data?.error || 'Facebook login failed. Please try again.')
          } else if (response && response.status === 'not_authorized') {
            setFbError('Facebook login was not authorized.')
          } else {
            // User cancelled or closed popup
            setFbError('Facebook login was cancelled.')
          }
        } catch (e) {
          setFbError('Unexpected error during Facebook login. Please try again.')
        } finally {
          setFbLoading(false)
        }
      }, { scope: 'public_profile,email', return_scopes: true })
    } catch (e) {
      setFbLoading(false)
      console.error('FB.login initiation error:', e)
      setFbError('Unable to initiate Facebook login. Please check SDK readiness and App ID.')
    }
  }

  // Auto-continue if a server-side user session already exists (httpOnly cookie)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const name = data?.user?.name || 'User'
        const email = data?.user?.email
        saveSession({ name, email }, false)
        onNext(`/play/${gameId}/rules`)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [gameId])

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
          {/* Facebook Login Plugin (XFBML) */}
          <div className="text-center" ref={fbPluginContainerRef}>
            <div
              className="fb-login-button"
              data-width=""
              data-size="large"
              data-button-type="continue_with"
              data-layout="default"
              data-auto-logout-link="false"
              data-use-continue-as="true"
              data-scope="public_profile,email"
            />
            {!hasAppId && (
              <p className="text-sm text-red-300 mt-2">Facebook App ID is not configured. Please set NEXT_PUBLIC_FACEBOOK_APP_ID and restart.</p>
            )}
            {hasAppId && !fbReady && (
              <p className="text-sm text-gray-300 mt-2">Facebook login is initializing…</p>
            )}
            {fbError && (
              <p className="text-sm text-red-300 mt-2">{fbError}</p>
            )}
          </div>

          <UnifiedRegistration
            onRegister={async (p) => {
              try {
                // Create/refresh 24h end-user session for cross-game persistence (POC)
                await fetch('/api/auth/session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ provider: 'email', name: p.name, email: p.email || undefined })
                })
              } catch {}
              saveSession(p, false)
              onNext(`/play/${gameId}/rules`)
            }}
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

