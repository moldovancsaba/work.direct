'use client'

import React, { useState } from 'react'

export interface ParticipantData {
  name: string
  email?: string
  phone?: string
}

export interface UnifiedRegistrationProps {
  // Registration handling
  onRegister: (participant: ParticipantData) => Promise<void>
  onTrialMode: () => void
  
  // Game customization
  gameTitle?: string
  gameName?: string
  
  // Custom texts for platformized games
  customTexts?: {
    // Headings (H2) shown above the respective inputs
    nameHeading?: string
    emailHeading?: string
    phoneHeading?: string

    registrationSubtitle?: string
    namePlaceholder?: string
    emailPlaceholder?: string
    phonePlaceholder?: string
    contactRequiredError?: string
    startPlayingButton?: string
    registeringText?: string
    tryWithoutRegText?: string
    tryWithoutRegButton?: string
  }
  
  // State management
  isLoading?: boolean
  error?: string | null
  
  // Form customization
  requireEmail?: boolean
  requirePhone?: boolean
  showTrialOption?: boolean
  
  // Styling
  theme?: 'default' | 'light' | 'dark'
  className?: string
  // H2 headings style (platform main.h2Class)
  headingClass?: string
  
  // Custom button background CSS (multiline strings with full CSS supported)
  // What: apply admin-provided CSS backgrounds for Start and Trial buttons
  // Why: enable full control (e.g., gradients) beyond class utilities
  primaryButtonBgCss?: string
  trialButtonBgCss?: string
  
  // Layout control
  hideHeader?: boolean
  containerMode?: 'fullscreen' | 'embedded'

  // Optional extra primary action rendered next to the main submit button (same sizing)
  // What: Allows placing "Continue with Facebook" next to the primary Next button.
  // Why: Aligns UX and solves XFBML sizing inconsistencies.
  extraPrimaryAction?: { label: string; onClick: () => void; bgCss?: string }
  // Optional extra primary node (e.g., Facebook plugin) rendered next to the primary button
  // What: Place <div class="fb-login-button">...</div> in the same row
  extraPrimaryNode?: React.ReactNode
}

/**
 * UnifiedRegistration Component - Centralized participant registration for all games
 * 
 * This component extracts and standardizes participant registration logic that was
 * previously embedded in individual game pages. It provides:
 * 
 * Features:
 * - Consistent form fields (name, email, phone) with validation
 * - Trial mode functionality for non-registered users
 * - Customizable field requirements per game type
 * - Integrated error handling and loading states
 * - Responsive design matching game layout themes
 * - Data validation consistent with existing API endpoints
 * 
 * Why centralized:
 * - Ensures consistent user experience across all games
 * - Reduces code duplication between game components
 * - Provides single source for registration business logic
 * - Enables unified styling and UX improvements
 */
export default function UnifiedRegistration({
  onRegister,
  onTrialMode,
  gameTitle = 'Game',
  gameName = 'this game',
  customTexts,
  isLoading = false,
  error = null,
  requireEmail = false,
  requirePhone = false,
  showTrialOption = true,
  theme = 'default',
  className,
  headingClass,
  hideHeader = false,
  containerMode = 'fullscreen',
  primaryButtonBgCss,
  trialButtonBgCss,
  extraPrimaryAction,
  extraPrimaryNode
}: UnifiedRegistrationProps) {
  
  // Form state management
  const [participant, setParticipant] = useState<ParticipantData>({
    name: '',
    email: '',
    phone: ''
  })
  
  // Local validation state
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form validation
  const validateForm = (): boolean => {
    setValidationError(null)
    
    if (!participant.name.trim()) {
      setValidationError('Name is required')
      return false
    }
    
    if (requireEmail && !participant.email) {
      setValidationError('Email is required for this game')
      return false
    }
    
    if (requirePhone && !participant.phone) {
      setValidationError('Phone number is required for this game')
      return false
    }
    
    if (!requireEmail && !requirePhone && !participant.email && !participant.phone) {
      setValidationError('Either email or phone number is required')
      return false
    }
    
    // Basic email validation if provided
    if (participant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      setValidationError('Please enter a valid email address')
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setValidationError(null)
    
    try {
      await onRegister(participant)
    } catch (err) {
      // Error handling is managed by parent component
      console.error('Registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle trial mode
  const handleTrialMode = () => {
    setValidationError(null)
    onTrialMode()
  }
  
  // Theme-based styling
  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          container: 'bg-white border-gray-200',
          input: 'bg-white !text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 !caret-black',
          button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
          trialButton: 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
        }
      case 'dark':
        return {
          container: 'bg-gray-800 border-gray-600',
          input: 'bg-white !text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 !caret-black',
          button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
          trialButton: 'bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700'
        }
      default:
        return {
          container: 'bg-white border-gray-200',
          input: 'bg-white !text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 !caret-black',
          button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
          trialButton: 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
        }
    }
  }
  
  const themeClasses = getThemeClasses()
  const displayError = error || validationError
  
  // IMPORTANT: Avoid nested component definitions that change identity on every render
  // WHAT: Previously we defined a <Container> component inside this component.
  // WHY: Defining a component inline creates a new function identity each render.
  //      React treats that as a different component type, unmounting/remounting its subtree
  //      on every state update (e.g. each keystroke), which drops input focus.
  // FIX: Use a stable div wrapper with computed classes instead of an inline component.
  const containerClass = containerMode === 'embedded'
    ? `w-full ${className || ''}`
    : `h-screen w-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className || ''}`

  // Extract value from multiline CSS (supports 'background: ...; background: linear-gradient(...)')
  const extractBackgroundValue = (css?: string): string | undefined => {
    if (!css) return undefined
    const grad = css.match(/linear-gradient\([^\)]+\)/i)
    if (grad) return grad[0]
    const bg = css.match(/background:\s*([^;]+);?/i)
    if (bg && bg[1]) return bg[1].trim()
    return undefined
  }

  const primaryBg = extractBackgroundValue(primaryButtonBgCss)
  const trialBg = extractBackgroundValue(trialButtonBgCss)

  return (
    <div className={containerClass}>
      <div className="w-full mx-auto">
        <div className={`rounded-xl shadow-2xl p-6 md:p-8 border ${themeClasses.container}`}>
          
          {/* Registration header */}
          {!hideHeader && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {`Join ${gameTitle || 'the Game'}`}
              </h2>
              <p className="text-gray-600">
                {`Enter your details to play ${gameName}`}
              </p>
            </div>
          )}
          
          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Two-column rows: Question (H2) at left, Answer (Input) at right */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <h2 className={`${headingClass ? headingClass + ' ' : ''}text-xl font-semibold text-black text-right`}>
                {customTexts?.nameHeading || 'Your Name'}
              </h2>
              <div>
                <input
                  type="text"
                  value={participant.name}
                  onChange={(e) => setParticipant({ ...participant, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${themeClasses.input}`}
                  style={{ color: '#000000', backgroundColor: '#ffffff', caretColor: '#000000' }}
                  placeholder={customTexts?.namePlaceholder || "Enter your name"}
                  required
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <h2 className={`${headingClass ? headingClass + ' ' : ''}text-xl font-semibold text-black text-right`}>
                {customTexts?.emailHeading || 'Your Email'}
              </h2>
              <div>
                <input
                  type="email"
                  value={participant.email || ''}
                  onChange={(e) => setParticipant({ ...participant, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${themeClasses.input}`}
                  style={{ color: '#000000', backgroundColor: '#ffffff', caretColor: '#000000' }}
                  placeholder={customTexts?.emailPlaceholder || (requireEmail ? "your@email.com (required)" : "your@email.com")}
                  required={requireEmail}
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <h2 className={`${headingClass ? headingClass + ' ' : ''}text-xl font-semibold text-black text-right`}>
                {customTexts?.phoneHeading || 'Your Phone'}
              </h2>
              <div>
                <input
                  type="tel"
                  value={participant.phone || ''}
                  onChange={(e) => setParticipant({ ...participant, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${themeClasses.input}`}
                  style={{ color: '#000000', backgroundColor: '#ffffff', caretColor: '#000000' }}
                  placeholder={customTexts?.phonePlaceholder || (requirePhone ? "+1 (555) 123-4567 (required)" : "+1 (555) 123-4567")}
                  required={requirePhone}
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* Field requirements info */}
            {!requireEmail && !requirePhone && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  {customTexts?.contactRequiredError || "Please provide either email or phone number"}
                </p>
              </div>
            )}

            {/* Error display */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            )}

            {/* Submit + Extra Primary actions */}
            {(function() {
              const primaryButton = (
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className={`w-full text-white py-5 px-6 text-xl rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button}`}
                  style={primaryBg ? { background: primaryBg } : undefined}
                >
                  {isSubmitting ? 'Registering...' : (customTexts?.startPlayingButton || 'Start Playing')}
                </button>
              )
              if (extraPrimaryNode) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    {primaryButton}
                    <div className="w-full flex items-center justify-center">
                      {extraPrimaryNode}
                    </div>
                  </div>
                )
              }
              if (typeof (extraPrimaryAction as any) !== 'undefined' && extraPrimaryAction) {
                const extraBg = extractBackgroundValue(extraPrimaryAction.bgCss) || primaryBg
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {primaryButton}
                    <button
                      type="button"
                      onClick={extraPrimaryAction.onClick}
                      disabled={isLoading || isSubmitting}
                      className={`w-full text-white py-5 px-6 text-xl rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button}`}
                      style={extraBg ? { background: extraBg } : undefined}
                    >
                      {extraPrimaryAction.label}
                    </button>
                  </div>
                )
              }
              return primaryButton
            })()}
          </form>
          
          {/* Trial mode option */}
          {showTrialOption && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                {customTexts?.tryWithoutRegText || "Want to try without registration?"}
              </p>
              <button
                onClick={handleTrialMode}
                disabled={isLoading}
                className={`w-full text-white py-5 px-6 text-xl rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.trialButton}`}
                style={trialBg ? { background: trialBg } : undefined}
              >
                {customTexts?.tryWithoutRegButton || 'Try Without Registration'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
