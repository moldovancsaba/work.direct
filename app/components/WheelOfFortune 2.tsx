// components/WheelOfFortune.tsx
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";

type Segment = { label: string; color: string };

type Props = {
  segments: Segment[];
  size?: number;            // SVG size in px
  spins?: number;           // base number of full rotations
  durationMs?: number;      // animation duration
  pointerAt?: "top" | "right";
  onResult?: (label: string) => void;
  disabled?: boolean;       // prevent spinning when true
  triggerSpin?: number;     // external trigger - increment to trigger spin
  hideSpinButton?: boolean; // hide the built-in spin button
};

/**
 * WheelOfFortune Component - Pure React + SVG Spinning Wheel
 * 
 * Features:
 * - Pure React implementation with SVG rendering
 * - No external libraries required
 * - Configurable segments with custom colors and labels
 * - Smooth CSS transitions with cubic-bezier easing
 * - Pointer positioning at top or right
 * - Result callback for game integration
 * - Hardware-accelerated animations
 * 
 * Integration with PlayMass:
 * - Follows PlayMass component patterns and styling
 * - Compatible with game state management
 * - Ready for rewards system integration
 */
export default function WheelOfFortune({
  segments,
  size = 520,
  spins = 8,
  durationMs = 4500,
  pointerAt = "top",
  onResult,
  disabled = false,
  triggerSpin = 0,
  hideSpinButton = false,
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);    // current wheel rotation in degrees
  const [result, setResult] = useState<string | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const spinningRef = useRef(false); // Additional protection against double spins
  const previousTrigger = useRef(triggerSpin);

  const wheelRef = useRef<SVGSVGElement>(null);
  
  // Watch for external trigger changes
  useEffect(() => {
    if (triggerSpin > previousTrigger.current && !spinning && !disabled) {
      previousTrigger.current = triggerSpin;
      spin();
    }
  }, [triggerSpin, spinning, disabled]);

  const N = segments.length;
  const CX = size / 2;
  const CY = size / 2;
  const R = size * 0.48;    // outer radius
  const innerPadding = 8;   // gap from edge for labels

  // Angle per slice
  const sliceAngle = 360 / N;

  // Where the pointer sits in absolute degrees
  // Since slices are rotated by -90deg, the pointer at top should align with 0 degrees
  // "top" means pointer points at the top of the wheel (0 degrees after slice rotation)
  // "right" means pointer at 90 deg after slice rotation
  const pointerDeg = pointerAt === "top" ? 0 : 90;

  // Precompute slices: start angle, end angle, mid angle
  // This optimization ensures smooth performance during spinning
  const slices = useMemo(() => {
    return Array.from({ length: N }, (_, i) => {
      const start = i * sliceAngle;
      const end = start + sliceAngle;
      const mid = start + sliceAngle / 2;
      return { i, start, end, mid };
    });
  }, [N, sliceAngle]);

  // Compute path for an arc slice using SVG path commands
  // This creates the visual pie slice geometry
  function describeSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArcFlag = endDeg - startDeg <= 180 ? 0 : 1;

    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  }

  // Convert polar coordinates (angle, radius) to cartesian (x, y)
  // Essential for positioning elements along the wheel circumference
  function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  // Calculate which segment the pointer is pointing at based on current rotation
  function getCurrentSegment(currentRotation: number): number {
    // Normalize rotation to 0-360
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    
    // The pointer is at the top (0 degrees), so we need to find which segment
    // is currently at the top position
    // Since segments start from 0 degrees and go clockwise, and the wheel rotates,
    // we need to reverse the calculation
    const pointerPosition = (360 - normalizedRotation) % 360;
    
    // Find which segment this position falls into
    const segmentIndex = Math.floor(pointerPosition / sliceAngle) % N;
    return segmentIndex;
  }

  // Main spin function - single direction spin with accurate result reading
  function spin() {
    // Double protection against multiple spins and disabled state
    if (spinning || spinningRef.current || N === 0 || disabled) return;
    
    // Set both state and ref to prevent double spinning
    setSpinning(true);
    spinningRef.current = true;

    setResult(null);
    setWinnerIndex(null);

    // Calculate spin amount: base spins + random extra rotation
    const baseSpinDegrees = spins * 360;
    const extraSpin = Math.random() * 360;
    const totalSpinDegrees = baseSpinDegrees + extraSpin;

    // Calculate final rotation
    const newRotation = rotation + totalSpinDegrees;

    // Apply the rotation immediately
    setRotation(newRotation);

    // After animation completes, calculate result
    const timeoutId = setTimeout(() => {
      const winnerIndex = getCurrentSegment(newRotation);
      
      setSpinning(false);
      spinningRef.current = false;
      setWinnerIndex(winnerIndex);
      const label = segments[winnerIndex].label;
      setResult(label);
      onResult?.(label);
      
      // Keep the final rotation as is - no normalization to prevent second spin
    }, durationMs + 100);

    // Store timeout ID for potential cleanup
    return timeoutId;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          filter: spinning ? "saturate(1.15)" : "none", // Visual enhancement during spin
        }}
        className="select-none"
      >
        {/* Pointer - positioned based on pointerAt prop */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: pointerAt === "top" ? "50%" : undefined,
            top: pointerAt === "top" ? 0 : undefined,
            right: pointerAt === "right" ? 0 : undefined,
            bottom: pointerAt === "right" ? "50%" : undefined,
            transform:
              pointerAt === "top"
                ? "translate(-50%, -18%)"
                : "translate(18%, 50%) rotate(90deg)",
          }}
        >
          <svg width={48} height={48} viewBox="0 0 48 48">
            <polygon
              points="24,0 42,28 6,28"
              fill="#ffffff"
              stroke="#111"
              strokeWidth={2}
              style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.6))" }}
            />
          </svg>
        </div>

        {/* Main Wheel SVG */}
        <svg
          ref={wheelRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            transition: `transform ${durationMs}ms cubic-bezier(0.12, 0.65, 0, 1)`,
            transform: `rotate(${rotation}deg)`,
            // Hardware acceleration for smooth spinning
            willChange: spinning ? 'transform' : 'auto'
          }}
        >
          {/* Outer rim for visual definition */}
          <circle cx={CX} cy={CY} r={R} fill="#111214" stroke="#666" strokeWidth={2} />
          
          {/* Render each wheel segment */}
          {slices.map(({ i, start, end, mid }) => {
            const seg = segments[i];
            const d = describeSlice(CX, CY, R, start - 90, end - 90); // rotate so slice 0 starts at top visually
            
            // Label positioning: move inward from edge along mid angle
            const labelR = R - 42;
            const labelPos = polarToCartesian(CX, CY, labelR, mid - 90);
            const textRotate = mid; // rotate text so it faces center along the radius

            const isWinner = i === winnerIndex;

            return (
              <g key={i}>
                {/* Slice path with winner highlighting */}
                <path
                  d={d}
                  fill={seg.color}
                  stroke="#0a0a0a"
                  strokeWidth={1}
                  style={{
                    filter: isWinner ? "drop-shadow(0 0 16px rgba(255,255,255,0.65))" : "none",
                  }}
                />
                {/* Separator line between slices */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={polarToCartesian(CX, CY, R, start - 90).x}
                  y2={polarToCartesian(CX, CY, R, start - 90).y}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={1}
                />
                {/* Label text oriented toward center */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#fff"
                  fontSize={Math.max(12, size * 0.028)}
                  fontWeight={600}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotate}, ${labelPos.x}, ${labelPos.y})`}
                  style={{
                    paintOrder: "stroke",
                    stroke: "rgba(0,0,0,0.45)",
                    strokeWidth: 2,
                    letterSpacing: "0.2px",
                    userSelect: "none",
                  }}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Center cap with status text */}
          <circle cx={CX} cy={CY} r={52} fill="#0f0f10" stroke="#999" strokeWidth={2} />
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={18}
            fill="#eaeaea"
            style={{ userSelect: "none" }}
          >
            {spinning ? "Spinning..." : "Ready"}
          </text>

          {/* Invisible overlay - no click handler to prevent double spins */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="transparent"
            style={{ cursor: spinning || disabled ? "not-allowed" : "default" }}
          />
        </svg>
      </div>

      {/* Result display */}
      <div className="w-full text-center">
        {result ? (
          <p className="text-xl md:text-2xl font-semibold text-white">
            Result: <span className="text-emerald-300">{result}</span>
          </p>
        ) : (
          <p className="text-neutral-300">Click the button to spin</p>
        )}
      </div>

      {/* Spin button for explicit interaction - conditionally rendered */}
      {!hideSpinButton && (
        <button
          onClick={() => {
            if (!spinning && !disabled) {
              setResult(null);
              setWinnerIndex(null);
              spin();
            }
          }}
          disabled={spinning || disabled}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-semibold disabled:opacity-60 transition-all duration-200"
        >
          {disabled ? "Game Over" : spinning ? "Spinning…" : "Spin"}
        </button>
      )}
    </div>
  );
}
