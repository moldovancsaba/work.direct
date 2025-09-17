"use client"

import React from 'react'

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

function classFor(type: 'H1' | 'H2' | 'P', styles: any): string {
  const h1 = styles?.main?.h1Class || 'text-3xl font-bold'
  const h2 = styles?.main?.h2Class || 'text-xl font-semibold'
  const p = styles?.main?.pClass || 'text-base'
  return type === 'H1' ? h1 : type === 'H2' ? h2 : p
}

export default function TypedText({ code, texts, styles, defaultType = 'P' as const }: { code: string; texts: any; styles: any; defaultType?: 'H1' | 'H2' | 'P' }) {
  const text = (texts?.[code] ?? '').toString()
  const type = resolveTextType(styles, code, defaultType)
  const cls = classFor(type, styles)
  if (!text) return null
  if (type === 'H1') return <h1 className={cls} style={{ whiteSpace: 'pre-wrap' }}>{text}</h1>
  if (type === 'H2') return <h2 className={cls} style={{ whiteSpace: 'pre-wrap' }}>{text}</h2>
  return <p className={cls} style={{ whiteSpace: 'pre-wrap' }}>{text}</p>
}
