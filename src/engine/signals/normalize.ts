import type { Scalar } from '@/core/contracts/primitives'

/**
 * Clamp and scale a raw value into a 0–100 behavioral scalar.
 * When min/max match the source range, this is a safe clamp; engines may
 * supply alternate bounds when normalizing heterogeneous evidence.
 */
export function normalize(value: number, min = 0, max = 100): Scalar {
  if (max === min) return 0
  const clamped = Math.max(min, Math.min(max, value))
  return ((clamped - min) / (max - min)) * 100
}
