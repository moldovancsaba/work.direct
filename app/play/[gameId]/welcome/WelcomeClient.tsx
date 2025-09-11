'use client'

// Legacy WelcomeClient has been deprecated in favor of the platformized WelcomeClientPlatform.
// This file is intentionally left as a no-op to avoid accidental usage and ensure the
// standardized 4-step flow is the only active code path.
export default function WelcomeClient() {
  if (process.env.NODE_ENV !== 'production') {
    // Provide a helpful console message in development
    console.warn('[Deprecated] app/play/[gameId]/welcome/WelcomeClient.tsx is no longer used. The platformized WelcomeClientPlatform is the single source of truth.')
  }
  return null
}

