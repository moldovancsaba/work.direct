// app/lib/hex/geometry.ts
// WHAT: Shared hex grid geometry utilities for flat-top hexagons, reused across UI components and Mongoose models.
// WHY: Single source of truth for layout math (axial→pixel, vertices, rotation) and validation (hexDistance),
//      ensuring identical behavior in StarsHexa, PenaltyHexa, QuizzHexa, and HexMap model validation.

export type Point = { x: number; y: number }

// Public constant reused by UI for size calculations
export const SQRT3 = Math.sqrt(3) // ≈ 1.7320508075688772

// Internal rotation constants for the standard 30° rotation used by our UI
const DEG30 = Math.PI / 6
const COS30 = Math.cos(DEG30)
const SIN30 = Math.sin(DEG30)

/**
 * axialToPixel
 * WHAT: Convert flat-top axial hex coordinates (q,r) to pixel center using size s (visual width W = 2*s).
 * WHY: Keep layout math centralized and consistent with our reference (elements/hexagon.html).
 *
 * Formulas (flat-top, before rotation):
 *   W = 2*s
 *   x = 1.5 * s * q        // (= 0.75 * W * q)
 *   y = (SQRT3/2) * s * q + SQRT3 * s * r  // (= (√3/4 * W) * q + (√3/2 * W) * r)
 */
export function axialToPixel(q: number, r: number, s: number): Point {
  const x = 1.5 * s * q
  const y = (SQRT3 / 2) * s * q + (SQRT3 * s) * r
  return { x, y }
}

/**
 * rotatePoint
 * WHAT: Rotate a point (x,y) around the origin by deg degrees (default 30°).
 * WHY: Our UI renders a 30°-rotated grid for the “flower” layout; rotation must be consistent everywhere.
 */
export function rotatePoint(x: number, y: number, deg: number = 30): Point {
  if (deg === 30) {
    // Hot path for the common 30° rotation used across the app
    return { x: x * COS30 - y * SIN30, y: x * SIN30 + y * COS30 }
  }
  const rad = (deg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return { x: x * c - y * s, y: x * s + y * c }
}

/**
 * hexVertices
 * WHAT: Return the 6 vertex positions (before rotation) for a flat-top hex centered at (cx,cy) and size s.
 * WHY: Used by SVG/Canvas renderers to draw the polygon; kept unrotated so callers can apply rotatePoint as needed.
 *
 * Derived from reference offsets in elements/hexagon.html with W = 2*s and H = (√3/2)*W = SQRT3*s:
 *   V0: (-0.25W, -0.50H)  V1: ( 0.25W, -0.50H)
 *   V2: ( 0.50W,  0.00H)  V3: ( 0.25W,  0.50H)
 *   V4: (-0.25W,  0.50H)  V5: (-0.50W,  0.00H)
 */
export function hexVertices(cx: number, cy: number, s: number): Point[] {
  const W = 2 * s
  const H = SQRT3 * s // = (√3/2) * W
  const offsets: Point[] = [
    { x: -0.25 * W, y: -0.5 * H },
    { x:  0.25 * W, y: -0.5 * H },
    { x:  0.50 * W, y:  0.0 * H },
    { x:  0.25 * W, y:  0.5 * H },
    { x: -0.25 * W, y:  0.5 * H },
    { x: -0.50 * W, y:  0.0 * H }
  ]
  return offsets.map(o => ({ x: cx + o.x, y: cy + o.y }))
}

/**
 * polygonPointsString
 * WHAT: Serialize points into an SVG-compatible "x,y x,y ..." string.
 * WHY: Shared helper to avoid duplicating formatting logic in components.
 */
export function polygonPointsString(points: Point[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

/**
 * hexDistance
 * WHAT: Compute axial distance between two hex cells (q,r) using cube-coordinates equivalence.
 * WHY: Used by HexMap validation and any radius-based constraints.
 */
export function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const dx = a.q - b.q
  const dz = a.r - b.r
  const dy = -dx - dz
  return (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2
}
