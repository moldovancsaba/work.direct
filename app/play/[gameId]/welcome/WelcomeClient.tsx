'use client'

import { logger } from '../../../lib/logger'

// Legacy WelcomeClient has been deprecated in favor of the platformized WelcomeClientPlatform.
// This file is intentionally left as a no-op to avoid accidental usage and ensure the
// standardized 4-step flow is the only active code path.
export default function WelcomeClient() {
  if (process.env.NODE_ENV !== 'production') {
    // Provide a helpful warning in development
    logger.warn('[Deprecated] WelcomeClient.tsx is no longer used')
  }
  return null
}

