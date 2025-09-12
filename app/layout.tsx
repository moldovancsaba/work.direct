import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import Script from "next/script";

// Fonts: prefer Noto Sans (broad unicode coverage incl. latin-ext), Inter secondary
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "PlayMass - Interactive Game Platform",
  description: "Create and distribute Stars Hexa games to target groups with rewards management. Built with Next.js and MongoDB.",
  keywords: ["games", "stars hexa", "interactive", "rewards", "engagement", "marketing"],
  authors: [{ name: "Narimato" }],
  creator: "Narimato",
  publisher: "PlayMass",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "PlayMass",
    title: "PlayMass - Interactive Game Platform",
    description: "Create and distribute Stars Hexa games to target groups with rewards management.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayMass - Interactive Game Platform",
    description: "Create and distribute Stars Hexa games to target groups with rewards management.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${notoSans.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Required root container for Facebook SDK */}
        <div id="fb-root" />
        {/* Load Facebook SDK globally once. Why: single init across app; enables FB.login popup and XFBML plugin parsing. */}
        <Script
          id="fb-sdk"
          src="https://connect.facebook.net/en_GB/sdk.js"
          strategy="afterInteractive"
          onError={() => {
            // WHAT: Surface SDK load errors to client state
            // WHY: Provide actionable feedback when network blockers prevent SDK usage
            try {
              (window as any).__fbError = 'LOAD_FAILED'
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
                  xfbml: true, // enable XFBML parsing for fb-login-button plugin
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
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
