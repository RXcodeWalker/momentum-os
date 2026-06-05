import type { TrendDirection } from '@/core/contracts/primitives'
import { TREND_STABILITY_THRESHOLD } from './config'

export type TrendOptions = {
  /** Minimum delta between early and late window means to classify direction. */
  stabilityThreshold?: number
}

/**
 * Compare early vs late segments of a series to infer multi-day direction.
 * Requires at least two points; shorter series return STABLE to avoid noise.
 */
export function calculateTrend(values: number[], options?: TrendOptions): TrendDirection {
  if (values.length < 2) return 'STABLE'

  const threshold = options?.stabilityThreshold ?? TREND_STABILITY_THRESHOLD
  const segmentSize = Math.max(1, Math.floor(values.length / 3))

  const early = values.slice(0, segmentSize)
  const late = values.slice(values.length - segmentSize)

  const earlyMean = early.reduce((sum, value) => sum + value, 0) / early.length
  const lateMean = late.reduce((sum, value) => sum + value, 0) / late.length
  const delta = lateMean - earlyMean

  if (delta > threshold) return 'RISING'
  if (delta < -threshold) return 'DECLINING'
  return 'STABLE'
}
