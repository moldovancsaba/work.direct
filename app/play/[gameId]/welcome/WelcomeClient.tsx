"use client"

import { useRouter } from 'next/navigation'
import UnifiedRegistration from '../../../components/game/UnifiedRegistration'
import { HeroBlock } from '../../../components/play/Blocks'

interface WelcomeClientProps {
  gameId: string
  title: string
  subtitle?: string
  ctaLabel?: string
  refCode?: string
}

// Welcome step client — collects participant data and creates a lightweight client session
// What: Save participant + session in localStorage and advance to Rules.
// Why: Keep MVP frictionless while backend play endpoint creates/updates participants on first play.
export default function WelcomeClient({ gameId, title, subtitle, ctaLabel = 'Start', refCode }: WelcomeClientProps) {
  const router = useRouter()

  const saveSession = (participant: { name: string; email?: string; phone?: string }, trial = false) => {
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    const payload = { participant, trial, sessionId, ref: refCode || null }
    try {
      localStorage.setItem(`playmass:session:${gameId}`, JSON.stringify(payload))
    } catch {}
  }

  return (
    <div className="min-h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <HeroBlock backgroundClass={undefined} scoreboard={{ home: 0, visitor: 0 }} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-xl shadow-2xl p-6 md:p-8 border bg-white border-gray-200">
            <UnifiedRegistration
              onRegister={async (p) => {
                saveSession(p, false)
                const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
                router.push(`/play/${gameId}/rules${q}`)
              }}
              onTrialMode={() => {
                saveSession({ name: 'Guest' }, true)
                const q = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
                router.push(`/play/${gameId}/rules${q}`)
              }}
              gameTitle={title}
              gameName={title}
              showTrialOption={true}
              hideHeader={true}
              containerMode="embedded"
              customTexts={{
                startPlayingButton: ctaLabel,
                tryWithoutRegText: 'Want to try without registration?',
                tryWithoutRegButton: 'Try Without Registration'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

