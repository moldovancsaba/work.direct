// app/wheel/page.tsx
"use client";

import WheelOfFortune from "../components/WheelOfFortune";

/**
 * Wheel of Fortune Test Page
 * 
 * This page demonstrates the WheelOfFortune component integration
 * with sample segments for testing and development purposes.
 * 
 * Integration Notes:
 * - Uses PlayMass color scheme and styling patterns
 * - Ready for backend game configuration integration
 * - Compatible with existing reward system architecture
 */
export default function WheelPage() {
  // Sample segments — customize freely
  // These represent different prize categories that can be configured
  // through the admin interface in the full PlayMass system
  const segments = [
    { label: "💰 Jackpot", color: "#F94144" },
    { label: "🔥 Bonus", color: "#F3722C" },
    { label: "🌪️ Tornado", color: "#F8961E" },
    { label: "⭐ Extra Spin", color: "#F9844A" },
    { label: "🎁 Mystery", color: "#F9C74F" },
    { label: "🍀 Lucky 7", color: "#90BE6D" },
    { label: "🧠 Quiz", color: "#43AA8B" },
    { label: "🧩 Puzzle", color: "#4D908E" },
    { label: "⚡ Turbo", color: "#577590" },
    { label: "🎯 Double", color: "#277DA1" },
    { label: "💎 Gem", color: "#9B5DE5" },
    { label: "🎉 Win", color: "#B5179E" },
  ];

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-[720px] bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎰 Wheel of Fortune</h1>
          <p className="text-gray-600">Spin the wheel to win amazing prizes!</p>
        </div>
        
        <div style={{ 
          background: 'radial-gradient(1200px 800px at 50% 45%, #0a1224 0%, #070d1b 50%, #04070f 100%)',
          borderRadius: '1rem',
          padding: '2rem'
        }}>
          <WheelOfFortune
            segments={segments}
            spins={8}                 // base full rotations before stopping
            durationMs={4500}         // spin animation duration
            pointerAt="top"           // "top" or "right" pointer
            size={520}                // SVG size in px
            onResult={(label) => {
              // Optional hook for integration, analytics, or socket emit
              console.log("Spin result:", label);
              
              // Future integration points:
              // - Send result to backend for tracking
              // - Trigger reward distribution
              // - Update user statistics
              // - Emit to Socket.IO for real-time updates
            }}
          />
        </div>
        
        {/* Integration Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🎮 Part of the PlayMass Interactive Game Platform</p>
          <p>Ready for rewards system and admin configuration integration</p>
        </div>
      </div>
    </main>
  );
}
