// app/lib/hex/geometry.ts
// WHAT: Shared, pure hex-grid geometry utilities extracted from the Penalty honeycomb implementation.
// WHY: Single source of truth for axial <-> pixel conversions, rotation, vertices, and distance math
//      so editor and all hex-based games render consistent coordinates and visuals.

// √3 constant used throughout axial math
export const SQRT3 = Math.sqrt(3)

// 30 degrees in radians — we match the Penalty visual by rotating +30°
const DEG = Math.PI / 180
const ROT_30 = 30 * DEG
const cosR = Math.cos(ROT_30)
const sinR = Math.sin(ROT_30)

export type Point = { x: number; y: number }
export type Axial = { q: number; r: number }

/**
 * axialToPixel
 * Converts axial hex coordinates (q, r) to pixel center BEFORE rotation (flat-top base),
 * using the same formula as the Penalty honeycomb.
 *
 * WHAT: x = s * (1.5 * q)
 *       y = s * ((√3/2) * q + √3 * r)
 * WHY: This preserves the established spacing and proportions already used by Penalty.
 */
export function axialToPixel(q: number, r: number, s: number): Point {
  const x = s * (1.5 * q)
  const y = s * ((SQRT3 / 2) * q + SQRT3 * r)
  return { x, y }
}

/**
 * rotatePoint
 * Rotates a point (x, y) by +30° about the origin. Used to achieve the Penalty visual.
 */
export function rotatePoint(x: number, y: number): Point {
  return { x: x * cosR - y * sinR, y: x * sinR + y * cosR }
}

/**
 * hexVertices
 * Returns 6 vertex positions (flat-top orientation) around a center (cx, cy)
 * BEFORE rotation. The caller may rotate each vertex by +30° using rotatePoint.
 *
 * WHAT: vertices at angles 0, 60, 120, 180, 240, 300 degrees.
 * WHY: Matches existing implementation; we keep rotation separate for clarity and reuse.
 */
export function hexVertices(cx: number, cy: number, s: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 // 0,60,...,300 (flat-top base)
    pts.push({ x: cx + s * Math.cos(a), y: cy + s * Math.sin(a) })
  }
  return pts
}

/**
 * hexDistance
 * Axial distance between two hexes (q1,r1) and (q2,r2).
 * WHY: Editor uses this to constrain interactivity within the map radius (ring distance from origin).
 */
export function hexDistance(a: Axial, b: Axial): number {
  // Convert axial to cube: x=q, z=r, y=-x-z
  const ax = a.q, az = a.r, ay = -ax - az
  const bx = b.q, bz = b.r, by = -bx - bz
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz))
}

/**
 * polygonPointsString
 * Convenience: converts a list of points to the SVG "x,y x,y ..." format.
 */
export function polygonPointsString(points: Point[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}
