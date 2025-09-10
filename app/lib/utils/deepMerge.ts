// Deep merge utility without external dependencies
// What: Deterministic deep merge for plain objects used by the play config resolver.
// Why: Avoid adding new deps; keep resolver logic concise and predictable.

export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function deepMerge<T = any>(target: any, source: any): T {
  if (!isObject(target)) return (source ?? target) as T
  if (!isObject(source)) return (target ?? source) as T

  const output: Record<string, any> = { ...target }
  for (const key of Object.keys(source)) {
    const srcVal = source[key]
    const tgtVal = output[key]

    if (Array.isArray(srcVal)) {
      // Strategy: override arrays from source to prevent confusing partial merges
      output[key] = srcVal
    } else if (isObject(srcVal)) {
      output[key] = deepMerge(tgtVal || {}, srcVal)
    } else if (srcVal !== undefined) {
      output[key] = srcVal
    }
  }
  return output as T
}

