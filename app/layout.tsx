import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import FacebookSDK from "./components/FacebookSDK";
import PWAInstaller from "./components/PWAInstaller";

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
  description: "Create and distribute Hexa games to target groups with rewards management. Built with Next.js and MongoDB.",
  keywords: ["games", "hexa", "interactive", "rewards", "engagement", "marketing"],
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
    description: "Create and distribute Hexa games to target groups with rewards management.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayMass - Interactive Game Platform",
    description: "Create and distribute Hexa games to target groups with rewards management.",
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
        {/* Load Facebook SDK via client component to avoid passing event handlers from Server Component */}
        <FacebookSDK />
        {/* PWA Service Worker Registration - WHY: Enables offline functionality and caching */}
        <PWAInstaller />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
