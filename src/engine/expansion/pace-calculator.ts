import type { MomentumModel } from '@/core/contracts/momentum'
import type { StateDynamicsProfile } from '@/core/contracts/state/dynamics'
import type { SafetyConstraint } from '@/core/contracts/expansion'

export type PaceCalculatorInput = {
  readinessScore: number
  momentumModel: MomentumModel
  dynamicsProfile: StateDynamicsProfile
  safetyConstraints: SafetyConstraint[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function computePaceModifier(input: PaceCalculatorInput): number {
  const { readinessScore, momentumModel, dynamicsProfile, safetyConstraints } = input

  // Base: normalize readiness from 0..100 → 0..1 (negative readiness → 0 base)
  const base = clamp(readinessScore / 100, 0, 1)

  // Boosters (additive)
  let boosters = 0
  if (momentumModel.quality.sustainabilityScore > 80) boosters += 0.15
  if (momentumModel.velocity === 'accelerating') boosters += 0.10
  if (dynamicsProfile.dominantPattern === 'expanding') boosters += 0.05

  let preliminary = base + boosters

  // Dampeners (multiplicative)
  const hotspotTriggered = safetyConstraints.some(
    (c) => c.id === 'HOTSPOT_RISK' && c.triggered,
  )
  const streakFragilityTriggered = safetyConstraints.some(
    (c) => c.id === 'STREAK_FRAGILITY_GATE' && c.triggered,
  )

  if (hotspotTriggered) preliminary *= 0.70
  if (streakFragilityTriggered) preliminary *= 0.80

  // Fragility dampener: fragilityScore > 35 reduces pace proportionally
  const { fragilityScore } = momentumModel.quality
  if (fragilityScore > 35) {
    const fragilityDampener = 1 - (fragilityScore - 35) / 130
    preliminary *= clamp(fragilityDampener, 0, 1)
  }

  return clamp(preliminary, 0, 1)
}
