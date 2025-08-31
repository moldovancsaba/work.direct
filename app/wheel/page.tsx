// app/wheel/page.tsx
"use client";

import WheelGamePlay from "../components/WheelGamePlay";
import { DEFAULT_SEGMENT_NAMES } from '../lib/wheelGenerator'

/**
 * Wheel of Fortune Test Page
 * 
 * This page demonstrates the simple wheel configuration system.
 * Just set 4 simple parameters and the wheels are automatically generated!
 */
export default function WheelPage() {
  // 🎮 SIMPLE CONFIGURATION - Just 4 parameters!
  const simpleWheelConfig = {
    segments: [], // Not used with simple config
    spins: 8,
    spinsPerGame: 2,
    durationMs: 4500,
    pointerAt: 'top' as const,
    size: 280,
    theme: 'default' as const,
    allowImmediateReplay: false,
    gameRule: {
      winCondition: 'jackpot_once' as const,
      jackpotLabel: '💰 Jackpot',
      collectionsNeeded: 3
    },
    // ✨ THE MAGIC - Simple Configuration!
    simpleConfig: {
      jackpotsCount: 1 as const,                // 🎯 1-6 jackpots across all wheels
      wheel1Segments: 5 as const,              // 🎰 3-8 segments on wheel 1
      wheel2Segments: 4 as const,              // 🎰 3-8 segments on wheel 2  
      wheel3Segments: 6 as const,              // 🎰 3-8 segments on wheel 3
      totalSegmentsToUse: 7 as const,          // 🎲 5-11 different segments (including jackpot)
      segmentNames: DEFAULT_SEGMENT_NAMES       // ⚽ List of sports names
    }
  };

  return (
    <div>
      {/* Demo of Simple Triple Wheel Configuration */}
      <WheelGamePlay
        gameId="demo-simple-wheel"
        configuration={simpleWheelConfig}
        onResult={(result) => {
          console.log("Simple wheel result:", result);
        }}
        isTrialMode={true}
      />
    </div>
  );
}
