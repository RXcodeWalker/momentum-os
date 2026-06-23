import type { UserTrajectory } from '@/core/contracts/state/modes'
import type { MomentumClassification, MomentumModel, MomentumSignal, MomentumVelocity } from '@/core/contracts/momentum'
import type { StateDynamics, StateDynamicsProfile } from '@/core/contracts/state/dynamics'
import type { TrendRecord } from '@/core/contracts/history/trend'

const FRAGILITY_SOUND_THRESHOLD = 35
const FRAGILITY_FRAGILE_THRESHOLD = 45

export type MomentumModelInput = {
  dynamics: StateDynamics
  profile: StateDynamicsProfile
  streakCtx: { atRisk: boolean }
  momentum: { trend: 'up' | 'down' | 'flat' }
  consistency: number
  checkInsCount: number
  recoveryMode: boolean
  trajectoryFromPipeline: UserTrajectory | null
  trendRecords: TrendRecord[]
  recoveryDebtAccumulating: boolean
  /** Optional avoidance pressure (0–100) from the AvoidanceDetection engine. Contributes ~0.10 to fragilityScore when >= 60. */
  avoidancePressure?: number
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function trajectoryToDirection(
  trajectory: UserTrajectory | null,
  fallbackTrend: 'up' | 'down' | 'flat',
): 'UP' | 'DOWN' | 'FLAT' {
  if (trajectory === null) {
    return fallbackTrend === 'up' ? 'UP' : fallbackTrend === 'down' ? 'DOWN' : 'FLAT'
  }
  if (trajectory === 'EXPANDING') return 'UP'
  if (trajectory === 'CONTRACTING') return 'DOWN'
  // STABLE and FRAGILE both map to FLAT here (structural fragility from fragilityScore)
  return 'FLAT'
}

function classifyVelocity(trendRecords: TrendRecord[]): MomentumVelocity {
  const record = trendRecords.find((t) => t.metric === 'executionScore')
  if (!record) return 'stalled'
  const v = record.velocity
  if (v > 0.5) return 'accelerating'
  if (v >= -0.5) return 'steady'
  if (v >= -1.5) return 'decelerating'
  return 'stalled'
}

function computeRecoverySuccessRate(profile: StateDynamicsProfile): number | null {
  const { pathways } = profile.recoveryPathwayAnalysis
  if (pathways.length === 0) return null
  const successful = pathways.filter((p) => p.isSuccessful).reduce((sum, p) => sum + p.count, 0)
  const total = pathways.reduce((sum, p) => sum + p.count, 0)
  return total > 0 ? successful / total : null
}

function buildConservativeStable(checkInsCount: number): MomentumModel {
  return {
    classification: 'stable',
    velocity: 'stalled',
    quality: {
      fragilityScore: 0,
      sustainabilityScore: 50,
      isStructurallySound: true,
    },
    confidence: 'low',
    signals: [],
    underlyingTrajectory: null,
    summary: 'Early signal: Consistent execution at a sustainable level. (limited data)',
    computedAt: new Date().toISOString(),
  }
}

function buildSummary(classification: MomentumClassification, confidence: 'low' | 'medium' | 'high'): string {
  const base: Record<MomentumClassification, string> = {
    expanding:   'Execution scores have trended upward with low structural volatility.',
    stable:      'Consistent execution at a sustainable level.',
    fragile:     'Progress appears positive, but structural signals indicate risk.',
    contracting: 'Execution scores have declined over the observed window.',
  }
  const text = base[classification]
  if (confidence === 'low') return `Early signal: ${text} (limited data)`
  return text
}

export function computeMomentumModel(input: MomentumModelInput): MomentumModel {
  const {
    dynamics,
    profile,
    streakCtx,
    momentum,
    consistency,
    checkInsCount,
    recoveryMode,
    trajectoryFromPipeline,
    trendRecords,
    recoveryDebtAccumulating,
    avoidancePressure,
  } = input

  if (checkInsCount < 7) return buildConservativeStable(checkInsCount)

  const confidence: 'low' | 'medium' | 'high' =
    checkInsCount < 7 ? 'low' : checkInsCount < 14 ? 'medium' : 'high'

  const recoverySuccessRate = computeRecoverySuccessRate(profile)
  const invertedRecoverySuccessRate = recoverySuccessRate !== null ? (1 - recoverySuccessRate) * 100 : 0

  const volatilityScore = dynamics.volatility.score
  const isOscillating = profile.oscillation.isOscillating
  const streakAtRisk = streakCtx.atRisk

  const avoidanceActive = avoidancePressure !== undefined && avoidancePressure >= 60
  const avoidanceFragilityContribution = avoidanceActive ? avoidancePressure! : 0

  // Divide by total active weight so avoidance addition doesn't inflate the 0-100 scale.
  // Without avoidance: sum / 1.00 (no-op). With avoidance: sum / 1.10 (~9.1% contribution).
  const totalWeight = avoidanceActive ? 1.10 : 1.00

  const fragilityScore = clamp(
    (
      volatilityScore                      * 0.35 +
      (isOscillating ? 100 : 0)            * 0.20 +
      invertedRecoverySuccessRate          * 0.25 +
      (streakAtRisk ? 100 : 0)             * 0.10 +
      (recoveryDebtAccumulating ? 100 : 0) * 0.10 +
      avoidanceFragilityContribution       * 0.10
    ) / totalWeight,
    0, 100,
  )

  const sustainabilityScore = clamp(
    consistency * 0.40 +
    (recoverySuccessRate !== null ? recoverySuccessRate : 0.5) * 100 * 0.30 +
    (isOscillating ? 0 : 100) * 0.15 +
    (streakAtRisk ? 0 : 100) * 0.15,
    0, 100,
  )

  const isStructurallySound = fragilityScore < FRAGILITY_SOUND_THRESHOLD

  const underlyingTrajectory = trajectoryFromPipeline
  const direction = trajectoryToDirection(
    trajectoryFromPipeline,
    momentum.trend,
  )
  const velocity = classifyVelocity(trendRecords)

  // Classification decision — priority order
  let classification: MomentumClassification

  if (direction === 'DOWN') {
    classification = 'contracting'
  } else if (recoveryMode) {
    classification = 'fragile'
  } else if (isOscillating) {
    classification = 'fragile'
  } else if (direction === 'UP') {
    if (fragilityScore < FRAGILITY_SOUND_THRESHOLD) {
      classification = 'expanding'
    } else if (fragilityScore >= FRAGILITY_FRAGILE_THRESHOLD) {
      classification = 'fragile'
    } else {
      // uncertain zone: velocity tie-breaker
      classification = velocity === 'accelerating' || velocity === 'steady' ? 'expanding' : 'fragile'
    }
  } else {
    // direction === FLAT
    if (fragilityScore < FRAGILITY_SOUND_THRESHOLD) {
      classification = 'stable'
    } else if (fragilityScore >= FRAGILITY_FRAGILE_THRESHOLD) {
      classification = 'fragile'
    } else {
      // uncertain zone: velocity tie-breaker
      classification = velocity === 'accelerating' || velocity === 'steady' ? 'stable' : 'fragile'
    }
  }

  const signals: MomentumSignal[] = [
    {
      id: 'volatility',
      label: 'Score volatility',
      contribution: 'fragility',
      weight: 0.35,
      rawValue: volatilityScore,
      normalizedValue: clamp(volatilityScore / 100, 0, 1),
    },
    {
      id: 'oscillation',
      label: 'Oscillating recovery cycles',
      contribution: isOscillating ? 'fragility' : 'stability',
      weight: 0.20,
      rawValue: isOscillating ? 100 : 0,
      normalizedValue: isOscillating ? 1 : 0,
    },
    {
      id: 'recoverySuccess',
      label: 'Recovery success rate',
      contribution: recoverySuccessRate !== null && recoverySuccessRate >= 0.5 ? 'stability' : 'fragility',
      weight: 0.25,
      rawValue: recoverySuccessRate !== null ? recoverySuccessRate * 100 : 50,
      normalizedValue: recoverySuccessRate !== null ? recoverySuccessRate : 0.5,
    },
    {
      id: 'streakAtRisk',
      label: 'Execution streak at risk',
      contribution: streakAtRisk ? 'fragility' : 'stability',
      weight: 0.10,
      rawValue: streakAtRisk ? 100 : 0,
      normalizedValue: streakAtRisk ? 1 : 0,
    },
    {
      id: 'recoveryDebt',
      label: 'Accumulating recovery debt',
      contribution: recoveryDebtAccumulating ? 'fragility' : 'stability',
      weight: 0.10,
      rawValue: recoveryDebtAccumulating ? 100 : 0,
      normalizedValue: recoveryDebtAccumulating ? 1 : 0,
    },
    ...(avoidancePressure !== undefined && avoidancePressure >= 60
      ? [{
          id: 'avoidancePressure',
          label: 'Avoidance activity pressure',
          contribution: 'fragility' as const,
          weight: 0.10,
          rawValue: avoidancePressure,
          normalizedValue: clamp(avoidancePressure / 100, 0, 1),
        }]
      : []),
  ]

  return {
    classification,
    velocity,
    quality: {
      fragilityScore,
      sustainabilityScore,
      isStructurallySound,
    },
    confidence,
    signals,
    underlyingTrajectory,
    summary: buildSummary(classification, confidence),
    computedAt: new Date().toISOString(),
  }
}
