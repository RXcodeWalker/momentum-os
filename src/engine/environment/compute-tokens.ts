import type { EnvironmentalAdaptation } from '@/core/contracts/adaptation/environmental'
import type { EnvironmentTokens, EnvironmentBands, EnvironmentBand } from './types'

function toBand(value: number): EnvironmentBand {
  if (value < 0.30) return 'low'
  if (value < 0.55) return 'moderate'
  if (value < 0.75) return 'elevated'
  return 'high'
}

export function computeEnvironmentTokens(env: EnvironmentalAdaptation): {
  tokens: EnvironmentTokens
  bands: EnvironmentBands
} {
  const density = env.interfaceDensity / 100
  const spacing = 0.75 + (env.spacingIntensity / 100) * 0.75
  const motion = env.motionIntensity / 100
  const hierarchy = (env.hierarchySharpness * 0.65 + env.contrastStrength * 0.35) / 100
  const pressure = (env.pacingFeel * 0.40 + env.visualNoiseLevel * 0.35 + env.visibleComplexity * 0.25) / 100

  const tokens: EnvironmentTokens = {
    density: Math.max(0, Math.min(1, density)),
    spacing: Math.max(0.75, Math.min(1.50, spacing)),
    motion: Math.max(0, Math.min(1, motion)),
    hierarchy: Math.max(0, Math.min(1, hierarchy)),
    pressure: Math.max(0, Math.min(1, pressure)),
  }

  // Spacing band: normalize back to 0–1 range from the 0.75–1.50 multiplier
  const spacingNormalized = (tokens.spacing - 0.75) / 0.75

  const bands: EnvironmentBands = {
    density: toBand(tokens.density),
    spacing: toBand(spacingNormalized),
    motion: toBand(tokens.motion),
    hierarchy: toBand(tokens.hierarchy),
    pressure: toBand(tokens.pressure),
  }

  return { tokens, bands }
}
