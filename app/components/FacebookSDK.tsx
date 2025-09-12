"use client"

// WHAT: Client-only component to load and initialize Facebook SDK safely in App Router
// WHY: Avoid passing event handlers from Server Components and fix prerender errors

import Script from "next/script"

export default function FacebookSDK() {
  return (
    <>
      <Script
        id="fb-sdk"
        src="https://connect.facebook.net/en_GB/sdk.js"
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
              var appId = '${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''}';
              if (!appId || !String(appId).trim()) {
                console.error('[FB SDK] Missing NEXT_PUBLIC_FACEBOOK_APP_ID');
                window.__fbReady = false;
                window.__fbError = 'MISSING_APP_ID';
                window.dispatchEvent(new Event('fb-sdk-error'));
                return;
              }
              FB.init({
                appId: appId,
                cookie: true,
                xfbml: true,
                version: 'v23.0'
              });
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
