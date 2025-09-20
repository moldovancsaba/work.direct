// Reusable helpers for Google Fonts handling in PlayMass
// What: Centralize parsing and CSS link building for Google Fonts across components
// Why: Avoid duplicate logic in Blocks and TypedText and ensure consistent behavior

export function parseGoogleFont(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (!u.hostname.includes('fonts.google.com')) return null
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex(p => p.toLowerCase() === 'specimen')
    if (idx >= 0 && parts[idx + 1]) {
      return decodeURIComponent(parts[idx + 1]).replace(/\+/g, ' ')
    }
    return null
  } catch {
    return null
  }
}

export function extractWeight(style?: string): number | null {
  if (!style) return null
  const match = String(style).match(/(100|200|300|400|500|600|700|800|900)/)
  return match ? Number(match[1]) : null
}

export function buildGoogleCssHref(family: string, weight: number): string {
  const fam = family.replace(/ /g, '+')
  const w = Math.min(900, Math.max(100, Math.round(weight / 100) * 100))
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}:wght@${w}&display=block`
}

export function familyAndWeightFrom(url?: string, style?: string): { family: string | null, weight: number | null } {
  const family = parseGoogleFont(url || '')
  const weight = extractWeight(style || '')
  return { family, weight }
}
