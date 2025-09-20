// app/lib/square/geometry.ts
// WHAT: Shared square grid geometry utilities (Cartesian), reused across UI components and SquareMap model.
// WHY: Single source of truth for cell layout and Chebyshev distance validation.

export type Point = { x: number; y: number }

/**
 * cellToPixel
 * WHAT: Convert integer cell coordinate (x,y) to pixel center given size s (cell width = 2*s; height = 2*s).
 * WHY: Square games use the same sizing convention as hex (s as half-width for parity of APIs).
 */
export function cellToPixel(x: number, y: number, s: number): Point {
  const W = 2 * s
  const H = 2 * s
  return { x: x * W, y: y * H }
}

/**
 * squareVertices
 * WHAT: Return the 4 corners of a square centered at (cx,cy) with half-size s.
 * WHY: Used for SVG polygon drawing and label placement.
 */
export function squareVertices(cx: number, cy: number, s: number): Point[] {
  const W = 2 * s
  const H = 2 * s
  const halfW = W / 2
  const halfH = H / 2
  return [
    { x: cx - halfW, y: cy - halfH },
    { x: cx + halfW, y: cy - halfH },
    { x: cx + halfW, y: cy + halfH },
    { x: cx - halfW, y: cy + halfH }
  ]
}

/**
 * polygonPointsString
 * WHAT: Serialize points into an SVG-compatible "x,y x,y ..." string.
 */
export function polygonPointsString(points: Point[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

/**
 * chebyshevDistance
 * WHAT: Chebyshev distance on a grid between two integer coordinates.
 * WHY: Used to validate SquareMap radius constraints.
 */
export function chebyshevDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}
