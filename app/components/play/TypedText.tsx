"use client"

import React, { useMemo } from 'react'
import { familyAndWeightFrom } from './fontUtils'

// TypedText component renders a platform text using the selected type (H1/H2/P)
// What: Applies semantic heading/paragraph type per admin selection and uses configured classes from styles.main
// Why: Fine-tune visuals by mapping each text to H1/H2/P without changing page code everywhere
export function resolveTextType(styles: any, code: string, defaultType: 'H1' | 'H2' | 'P' = 'P'): 'H1' | 'H2' | 'P' {
  try {
    const v = styles?.textTypes?.[code]
    if (v === 'H1' || v === 'H2' || v === 'P') return v
  } catch {}
  return defaultType
}

export function classFor(type: 'H1' | 'H2' | 'P', styles: any): string {
  const h1 = styles?.main?.h1Class || 'text-3xl font-bold'
  const h2 = styles?.main?.h2Class || 'text-xl font-semibold'
  const p = styles?.main?.pClass || 'text-base'
  return type === 'H1' ? h1 : type === 'H2' ? h2 : p
}

export default function TypedText({ code, texts, styles, defaultType = 'P' as const }: { code: string; texts: any; styles: any; defaultType?: 'H1' | 'H2' | 'P' }) {
  const text = (texts?.[code] ?? '').toString()
  const type = resolveTextType(styles, code, defaultType)
  const cls = classFor(type, styles)
  const { family, weight } = useMemo(() => {
    if (type === 'H1') return familyAndWeightFrom(styles?.main?.h1FontUrl, styles?.main?.h1FontStyle)
    if (type === 'H2') return familyAndWeightFrom(styles?.main?.h2FontUrl, styles?.main?.h2FontStyle)
    return familyAndWeightFrom(styles?.main?.pFontUrl, styles?.main?.pFontStyle)
  }, [styles, type])
  if (!text) return null
  const style: React.CSSProperties = { whiteSpace: 'pre-wrap' }
  if (family) style.fontFamily = `"${family}", "Noto Sans", sans-serif`
  if (weight != null) style.fontWeight = weight as any
  // Apply per-type font color when provided
  if (type === 'H1' && styles?.main?.h1Color) style.color = styles.main.h1Color
  if (type === 'H2' && styles?.main?.h2Color) style.color = styles.main.h2Color
  if (type === 'P' && styles?.main?.pColor) style.color = styles.main.pColor
  if (type === 'H1') return <h1 className={cls} style={style}>{text}</h1>
  if (type === 'H2') return <h2 className={cls} style={style}>{text}</h2>
  return <p className={cls} style={style}>{text}</p>
}
