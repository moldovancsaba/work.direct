// app/lib/grid/fit.ts
// WHAT: Runtime fit helpers to scale/center grids to any viewport.
// WHY: Ensure the intended field (mask or extents) is fully visible across aspect ratios.

import { axialToPixel, hexVertices, rotatePoint, hexDistance } from '@/lib/hex/geometry'
import { cellToPixel, squareVertices, chebyshevDistance } from '@/lib/square/geometry'

export type HexCoord = { q: number; r: number }
export type SquareCoord = { x: number; y: number }

export type HexFieldExtents = { top?: HexCoord; bottom?: HexCoord; left?: HexCoord; right?: HexCoord }
export type SquareFieldExtents = { top?: SquareCoord; bottom?: SquareCoord; left?: SquareCoord; right?: SquareCoord }

export interface FitResult {
  s: number
  offsetX: number
  offsetY: number
  box: { minX: number; minY: number; width: number; height: number }
}

function bboxFromPoints(points: Array<{ x: number; y: number }>) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  if (!isFinite(minX)) {
    return { minX: -100, minY: -100, width: 200, height: 200 }
  }
  return { minX, minY, width: maxX - minX, height: maxY - minY }
}

export function fitHexFieldToViewport(params: {
  fieldExtents?: HexFieldExtents | null
  fieldMask?: HexCoord[] | null
  radius: number
  viewportWidth: number
  viewportHeight: number
  margin?: number
  baseSize?: number // s0
}): FitResult {
  const {
    fieldExtents,
    fieldMask,
    radius,
    viewportWidth: vw,
    viewportHeight: vh,
    margin = 0.96,
    baseSize = 28,
  } = params

  // Choose reference cells: extents > fieldMask > radius disk
  let refs: HexCoord[] = []
  if (fieldExtents && (fieldExtents.top || fieldExtents.bottom || fieldExtents.left || fieldExtents.right)) {
    const tmp: HexCoord[] = []
    if (fieldExtents.top) tmp.push(fieldExtents.top)
    if (fieldExtents.bottom) tmp.push(fieldExtents.bottom)
    if (fieldExtents.left) tmp.push(fieldExtents.left)
    if (fieldExtents.right) tmp.push(fieldExtents.right)
    refs = tmp
  } else if (fieldMask && fieldMask.length > 0) {
    refs = fieldMask
  } else {
    // Fallback: use all cells in radius disc
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius)
      const r2 = Math.min(radius, -q + radius)
      for (let r = r1; r <= r2; r++) {
        refs.push({ q, r })
      }
    }
  }

  // Pass 1: rough bbox with base size
  const roughPoints: Array<{ x: number; y: number }> = []
  for (const c of refs) {
    const center = axialToPixel(c.q, c.r, baseSize)
    const verts = hexVertices(center.x, center.y, baseSize).map(p => rotatePoint(p.x, p.y, 30))
    roughPoints.push(...verts)
  }
  const box0 = bboxFromPoints(roughPoints)
  const scale = Math.min((vw * margin) / box0.width, (vh * margin) / box0.height)
  const s = baseSize * (isFinite(scale) && scale > 0 ? scale : 1)

  // Pass 2: precise bbox with scaled size for centering
  const finalPoints: Array<{ x: number; y: number }> = []
  for (const c of refs) {
    const center = axialToPixel(c.q, c.r, s)
    const verts = hexVertices(center.x, center.y, s).map(p => rotatePoint(p.x, p.y, 30))
    finalPoints.push(...verts)
  }
  const box = bboxFromPoints(finalPoints)
  const cx = box.minX + box.width / 2
  const cy = box.minY + box.height / 2
  const offsetX = vw / 2 - cx
  const offsetY = vh / 2 - cy

  return { s, offsetX, offsetY, box }
}

export function fitSquareFieldToViewport(params: {
  fieldExtents?: SquareFieldExtents | null
  fieldMask?: SquareCoord[] | null
  radius: number
  viewportWidth: number
  viewportHeight: number
  margin?: number
  baseSize?: number
}): FitResult {
  const { fieldExtents, fieldMask, radius, viewportWidth: vw, viewportHeight: vh, margin = 0.96, baseSize = 20 } = params

  let refs: SquareCoord[] = []
  if (fieldExtents && (fieldExtents.top || fieldExtents.bottom || fieldExtents.left || fieldExtents.right)) {
    const tmp: SquareCoord[] = []
    if (fieldExtents.top) tmp.push(fieldExtents.top)
    if (fieldExtents.bottom) tmp.push(fieldExtents.bottom)
    if (fieldExtents.left) tmp.push(fieldExtents.left)
    if (fieldExtents.right) tmp.push(fieldExtents.right)
    refs = tmp
  } else if (fieldMask && fieldMask.length > 0) {
    refs = fieldMask
  } else {
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        if (chebyshevDistance({ x, y }, { x: 0, y: 0 }) <= radius) {
          refs.push({ x, y })
        }
      }
    }
  }

  const roughPoints: Array<{ x: number; y: number }> = []
  for (const c of refs) {
    const center = cellToPixel(c.x, c.y, baseSize)
    const verts = squareVertices(center.x, center.y, baseSize)
    roughPoints.push(...verts)
  }
  const box0 = bboxFromPoints(roughPoints)
  const scale = Math.min((vw * margin) / box0.width, (vh * margin) / box0.height)
  const s = baseSize * (isFinite(scale) && scale > 0 ? scale : 1)

  const finalPoints: Array<{ x: number; y: number }> = []
  for (const c of refs) {
    const center = cellToPixel(c.x, c.y, s)
    const verts = squareVertices(center.x, center.y, s)
    finalPoints.push(...verts)
  }
  const box = bboxFromPoints(finalPoints)
  const cx = box.minX + box.width / 2
  const cy = box.minY + box.height / 2
  const offsetX = vw / 2 - cx
  const offsetY = vh / 2 - cy

  return { s, offsetX, offsetY, box }
}