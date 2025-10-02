'use client'

/**
 * Global Error Boundary Component
 * 
 * What: Catches unhandled errors at the root level of the application
 * Why: Prevents complete app crashes and provides user-friendly error UI
 * 
 * This is a Next.js 15 App Router global error boundary that catches errors
 * in the root layout and provides a fallback UI. It's only rendered in production
 * builds and wraps the entire application.
 * 
 * Note: In development mode, Next.js shows its own error overlay instead.
 */

import { useEffect } from 'react'
import Link from 'next/link'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // Log error details (in production, this would go to an error tracking service)
  // What: Track errors for debugging and monitoring
  // Why: Errors need to be logged for investigation, but not exposed to users
  useEffect(() => {
    // Only log in development or send to error tracking service
    // Note: Console logging here is acceptable for error boundary debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error caught:', error)
    }
    // TODO: In Phase 4, send to Sentry or error tracking service
  }, [error])

  return (
    <html>
      <body>
        {/* Error fallback UI */}
        {/* What: User-friendly error display with recovery option */}
        {/* Why: Users need clear feedback when something goes wrong and a way to recover */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '3rem 2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Error icon */}
            <div style={{
              fontSize: '4rem',
              marginBottom: '1.5rem'
            }}>
              ⚠️
            </div>

            {/* Error heading */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1a1a1a'
            }}>
              Something went wrong
            </h1>

            {/* Error message */}
            <p style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              We apologize for the inconvenience. An unexpected error has occurred.
              Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Error digest (if available) */}
            {error.digest && (
              <p style={{
                fontSize: '0.875rem',
                color: '#999',
                marginBottom: '2rem',
                fontFamily: 'monospace'
              }}>
                Error ID: {error.digest}
              </p>
            )}

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Reset button */}
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: '#0070f3',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
              >
                Try Again
              </button>

              {/* Home button */}
              <Link
                href="/"
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0070f3',
                  backgroundColor: 'transparent',
                  border: '2px solid #0070f3',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.2s'
                }}
              >
                Go Home
              </Link>
            </div>
          </div>

          {/* Development mode error details */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              maxWidth: '600px',
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#856404'
              }}>
                Development Error Details:
              </h3>
              <pre style={{
                fontSize: '0.875rem',
                color: '#856404',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0
              }}>
                {error.message}
              </pre>
            </div>
          )}
        </div>
      </body>
    </html>
  )
}
