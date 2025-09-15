"use client"

// WHAT: Client-only component to load and initialize Facebook SDK safely in App Router
// WHY: Avoid passing event handlers from Server Components and fix prerender errors

import Script from "next/script"

export default function FacebookSDK() {
  return (
    <>
      <Script
        id="fb-sdk"
        src={`https://connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v23.0&appId=${encodeURIComponent(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '804700345578279')}`}
        strategy="afterInteractive"
        onError={() => {
          try {
            ;(window as any).__fbError = 'LOAD_FAILED'
            window.dispatchEvent(new Event('fb-sdk-error'))
          } catch {}
        }}
      />
      <Script id="fb-sdk-init" strategy="afterInteractive">
        {`
          window.fbAsyncInit = function() {
            try {
              // When using the hash params (xfbml=1 & appId & version), SDK self-initializes.
              // We only set readiness flags and dispatch a custom event for the app to detect readiness.
              window.__fbReady = true;
              window.dispatchEvent(new Event('fb-sdk-ready'));
            } catch (e) {
              console.error('[FB SDK] Init failed:', e);
              window.__fbReady = false;
              window.__fbError = 'INIT_FAILED';
              window.dispatchEvent(new Event('fb-sdk-error'));
            }
          };
        `}
      </Script>
    </>
  )
}
