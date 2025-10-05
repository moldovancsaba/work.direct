'use client'

import { useState } from 'react'
import { logger } from '../../lib/logger'

/**
 * ShareButtons Component (v4.10.0)
 * 
 * WHAT: Social sharing buttons for referral links
 * WHY: Enable viral growth through easy sharing to multiple platforms
 * 
 * Supports: WhatsApp, Facebook, Twitter, Email, Copy Link
 */

interface ShareButtonsProps {
  referralUrl: string
  shareMessage?: string
  referralCode: string
  onShare?: (platform: string) => void
  className?: string
  vertical?: boolean
}

export default function ShareButtons({
  referralUrl,
  shareMessage = `Check out this awesome game!`,
  referralCode,
  onShare,
  className = '',
  vertical = false
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  // WHAT: Build platform-specific share URLs
  // WHY: Each social platform has different URL structures and parameters
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${referralUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralUrl)}`,
    email: `mailto:?subject=${encodeURIComponent('Join me on PlayMass!')}&body=${encodeURIComponent(`${shareMessage}\n\n${referralUrl}`)}`
  }

  /**
   * Handle share button click
   * WHAT: Open share URL and track the event
   * WHY: Attribution and analytics
   */
  const handleShare = async (platform: string, url: string) => {
    try {
      // Open share URL in new window
      const width = 600
      const height = 400
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2
      
      window.open(
        url,
        'share',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Track share event
      if (onShare) {
        onShare(platform)
      }
      
      // Track in backend (optional - for analytics)
      try {
        await fetch('/api/referrals/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referrerUuid: referralCode, // This should be the user's UUID in production
            source: platform
          })
        })
      } catch (err) {
        // Silent fail - don't block sharing
        logger.warn('Failed to track share event', { platform, error: err })
      }
      
      logger.info('Share button clicked', { platform, referralCode })
    } catch (error) {
      logger.error('Share error', { platform, error })
    }
  }

  /**
   * Handle copy to clipboard
   * WHAT: Copy referral URL to clipboard with visual feedback
   * WHY: Easy sharing without social platforms
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setCopyError(false)
      
      // Track copy event
      if (onShare) {
        onShare('copy')
      }
      
      logger.info('Referral link copied', { referralCode })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      setCopyError(true)
      logger.error('Copy to clipboard failed', { error })
      
      // Fallback: Select text for manual copy
      try {
        const tempInput = document.createElement('input')
        tempInput.value = referralUrl
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
        
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        setTimeout(() => setCopyError(false), 2000)
      }
    }
  }

  const buttonBaseClass = "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
  const containerClass = vertical ? "flex flex-col gap-3" : "flex flex-wrap gap-3"

  return (
    <div className={`${containerClass} ${className}`}>
      {/* WhatsApp Share */}
      <button
        onClick={() => handleShare('whatsapp', shareUrls.whatsapp)}
        className={`${buttonBaseClass} bg-[#25D366] text-white hover:bg-[#20BA5A]`}
        aria-label="Share on WhatsApp"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </button>

      {/* Facebook Share */}
      <button
        onClick={() => handleShare('facebook', shareUrls.facebook)}
        className={`${buttonBaseClass} bg-[#1877F2] text-white hover:bg-[#166FE5]`}
        aria-label="Share on Facebook"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>

      {/* Twitter/X Share */}
      <button
        onClick={() => handleShare('twitter', shareUrls.twitter)}
        className={`${buttonBaseClass} bg-[#1DA1F2] text-white hover:bg-[#1A91DA]`}
        aria-label="Share on Twitter"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        Twitter
      </button>

      {/* Email Share */}
      <button
        onClick={() => handleShare('email', shareUrls.email)}
        className={`${buttonBaseClass} bg-gray-700 text-white hover:bg-gray-600`}
        aria-label="Share via Email"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        className={`${buttonBaseClass} ${
          copied 
            ? 'bg-green-600 text-white' 
            : copyError
            ? 'bg-red-600 text-white'
            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
        }`}
        aria-label="Copy link to clipboard"
      >
        {copied ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : copyError ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </>
        )}
      </button>
    </div>
  )
}
