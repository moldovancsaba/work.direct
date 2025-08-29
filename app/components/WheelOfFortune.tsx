// components/WheelOfFortune.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";

type Segment = { label: string; color: string };

type Props = {
  segments: Segment[];
  size?: number;            // SVG size in px
  spins?: number;           // base number of full rotations
  durationMs?: number;      // animation duration
  pointerAt?: "top" | "right";
  onResult?: (label: string) => void;
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
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);    // current wheel rotation in degrees
  const [result, setResult] = useState<string | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);

  const wheelRef = useRef<SVGSVGElement>(null);

  const N = segments.length;
  const CX = size / 2;
  const CY = size / 2;
  const R = size * 0.48;    // outer radius
  const innerPadding = 8;   // gap from edge for labels

  // Angle per slice
  const sliceAngle = 360 / N;

  // Where the pointer sits in absolute degrees
  // "top" means pointer points straight up at 270 deg in SVG space (y increases downward)
  // "right" means pointer at 0 deg
  const pointerDeg = pointerAt === "top" ? 270 : 0;

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

  // Main spin function - calculates precise landing position
  // Choose a random winning index and compute the final rotation so that
  // the winner lands under the pointer.
  function spin() {
    if (spinning || N === 0) return;

    setResult(null);
    setWinnerIndex(null);

    // Pick a random target slice for fair gameplay
    const targetIndex = Math.floor(Math.random() * N);

    // The visual angle for the target slice center in wheel coordinates (0 to 360)
    const targetMid = slices[targetIndex].mid;

    // We want (rotationFinal + targetMid) % 360 == pointerDeg
    // So rotationFinal = spins*360 + (pointerDeg - targetMid) normalized
    const base = spins * 360;
    let offset = pointerDeg - targetMid;

    // Normalize offset to [0, 360) to ensure consistent behavior
    offset = ((offset % 360) + 360) % 360;

    const finalRotation = base + offset;

    // Trigger the spin with CSS transition on a wrapper
    setSpinning(true);
    setWinnerIndex(null);

    // Apply the rotation on the next tick to ensure transition runs smoothly
    // This prevents the browser from batching the state change with the transition
    requestAnimationFrame(() => {
      setRotation((prev) => prev + finalRotation);
    });

    // After animation ends, set the result and call callback
    // Extra 50ms buffer ensures the animation has fully completed
    window.setTimeout(() => {
      setSpinning(false);
      setWinnerIndex(targetIndex);
      const label = segments[targetIndex].label;
      setResult(label);
      onResult?.(label);
      // Normalize rotation to avoid number explosion over many spins
      // This prevents floating point precision issues
      setRotation((prev) => ((prev % 360) + 360) % 360);
    }, durationMs + 50);
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
            {spinning ? "Spinning..." : "Tap to Spin"}
          </text>

          {/* Invisible click area covering entire wheel */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="transparent"
            style={{ cursor: spinning ? "not-allowed" : "pointer" }}
            onClick={spin}
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
          <p className="text-neutral-300">Click the wheel to spin</p>
        )}
      </div>

      {/* Spin button for explicit interaction */}
      <button
        onClick={() => {
          if (!spinning) {
            setResult(null);
            setWinnerIndex(null);
            spin();
          }
        }}
        disabled={spinning}
        className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-semibold disabled:opacity-60 transition-all duration-200"
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>
    </div>
  );
}
