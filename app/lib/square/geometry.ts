// app/lib/square/geometry.ts
// WHAT: Geometry utilities for square grid coordinate systems (both Chebyshev and Manhattan radius)
// WHY: Provides consistent pixel positioning, vertex calculation, and distance-based masking for
//      Square Creator (Chebyshev) and Diamond Creator (Manhattan) while reusing existing patterns.

import { polygonPointsString } from '../hex/geometry'

export type Point = { x: number; y: number }
export type SquareCoord = { x: number; y: number }

/**
 * cellToPixel
 * Converts grid coordinates (x, y) to pixel center position for axis-aligned square tiles.
 * 
 * WHAT: Simple linear mapping where each unit step = `size` pixels in both x and y directions
 * WHY: Grid is integer lattice with no rotation, so pixel positioning is straightforward
 */
export function cellToPixel(x: number, y: number, size: number): Point {
  return { x: x * size, y: y * size }
}

/**
 * squareVertices
 * Returns 4 corner vertices for an axis-aligned square centered at (cx, cy) with side length = size.
 * 
 * WHAT: Vertices in clockwise order: top-left, top-right, bottom-right, bottom-left
 * WHY: Consistent with SVG polygon rendering; matches hex vertex generation pattern
 */
export function squareVertices(cx: number, cy: number, size: number): Point[] {
  const halfSize = size / 2
  return [
    { x: cx - halfSize, y: cy - halfSize }, // top-left
    { x: cx + halfSize, y: cy - halfSize }, // top-right
    { x: cx + halfSize, y: cy + halfSize }, // bottom-right
    { x: cx - halfSize, y: cy + halfSize }  // bottom-left
  ]
}

/**
 * chebyshevWithin
 * Tests if coordinate (x, y) is within Chebyshev distance of origin.
 * 
 * WHAT: Chebyshev distance = max(|x|, |y|) - creates square-shaped selection boundary
 * WHY: Used by Square Creator to determine which cells are selectable within radius
 */
export function chebyshevWithin(x: number, y: number, radius: number): boolean {
  return Math.max(Math.abs(x), Math.abs(y)) <= radius
}

/**
 * manhattanWithin  
 * Tests if coordinate (x, y) is within Manhattan distance of origin.
 * 
 * WHAT: Manhattan distance = |x| + |y| - creates diamond-shaped selection boundary
 * WHY: Used by Diamond Creator to determine which cells are selectable within radius.
 *      Same square tiles but different selection mask produces diamond-shaped play areas.
 */
export function manhattanWithin(x: number, y: number, radius: number): boolean {
  return Math.abs(x) + Math.abs(y) <= radius
}

/**
 * chebyshevDistance
 * Calculates Chebyshev distance between two coordinates.
 * 
 * WHAT: Maximum of absolute differences in x and y directions
 * WHY: Used for validation and distance-based filtering in SquareMap operations
 */
export function chebyshevDistance(a: SquareCoord, b: SquareCoord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}

/**
 * manhattanDistance
 * Calculates Manhattan distance between two coordinates.
 * 
 * WHAT: Sum of absolute differences in x and y directions  
 * WHY: Used for validation and distance-based filtering in DiamondMap operations
 */
export function manhattanDistance(a: SquareCoord, b: SquareCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

// Re-export polygonPointsString from hex geometry to avoid duplication
// WHAT: Converts array of points to SVG polygon points string format
// WHY: Reuse existing utility rather than duplicating string formatting logic
export { polygonPointsString }