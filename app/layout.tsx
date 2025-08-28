import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PlayMass - Interactive Game Platform",
  description: "Create and distribute simple games like Lucky Wheel to target groups with rewards management. Built with Next.js and MongoDB.",
  keywords: ["games", "lucky wheel", "interactive", "rewards", "engagement", "marketing"],
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
    description: "Create and distribute simple games like Lucky Wheel to target groups with rewards management.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayMass - Interactive Game Platform",
    description: "Create and distribute simple games like Lucky Wheel to target groups with rewards management.",
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
