// Minimal global declarations for Facebook SDK to avoid TS errors in client components.
// WHAT: Declare window.FB and fb readiness flag used by the layout and welcome page.
// WHY: The SDK provides globals at runtime; TypeScript needs awareness for safe access.
export {}

declare global {
  interface Window {
    FB?: any
    fbAsyncInit?: () => void
    __fbReady?: boolean
  }
}
