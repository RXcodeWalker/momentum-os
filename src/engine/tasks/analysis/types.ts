import type { ConfidenceBand, Scalar } from '@/core/contracts/primitives'
import type { UserMode } from '@/core/contracts/state/modes'
import type { CompatibilityBand } from '@/core/contracts/tasks/compatibility'
import type { TaskEvaluation } from '@/core/contracts/tasks/scores'
import type { RecoveryCompatibilityResult } from '@/core/contracts/tasks/recovery-compatibility'

export type PortfolioPattern =
  | 'MAINTENANCE_ADVANCEMENT_GAP'
  | 'SUPPORT_ADVANCEMENT_GAP'
  | 'HIGH_RESISTANCE_DEFERRAL_CLUSTER'
  | 'LOW_VALUE_TASK_CLUSTER'

export type PortfolioObservation = {
  patterns: PortfolioPattern[]
  confidenceBand: ConfidenceBand
  observations: string[]
}

export type CompatibilityAssessment = {
  taskId: string
  mode: UserMode
  band: CompatibilityBand
  burdenRelativeToCapacity: Scalar
  modeAppropriate: boolean
  recoveryCompatibility?: RecoveryCompatibilityResult
}

/** Engine-internal bundle passed from analysis to decision layer. */
export type AnalysisBundle = {
  evaluations: TaskEvaluation[]
  compatibilities: CompatibilityAssessment[]
  portfolioObservation: PortfolioObservation
}

/** Internal ranking key — never exposed outside the decision layer. */
export type SequencingSuitability = {
  taskId: string
  suitability: Scalar
}

export function clampScalar(value: number, min = 0, max = 100): Scalar {
  return Math.min(max, Math.max(min, value))
}

export function bandToScalar(band: CompatibilityBand): Scalar {
  switch (band) {
    case 'OPTIMAL':     return 90
    case 'COMPATIBLE':  return 70
    case 'FRAGILE':     return 40
    case 'HARMFUL':     return 10
  }
}

export function lowerConfidence(
  current: ConfidenceBand,
  cap: ConfidenceBand,
): ConfidenceBand {
  const order: ConfidenceBand[] = ['LOW', 'MEDIUM', 'HIGH']
  const currentIdx = order.indexOf(current)
  const capIdx = order.indexOf(cap)
  return order[Math.min(currentIdx, capIdx)]
}
