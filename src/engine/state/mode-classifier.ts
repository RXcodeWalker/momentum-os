import type { UserMode } from '@/core/contracts/state/modes'
import type { RiskLevel } from '@/core/contracts/primitives'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { DimensionResult } from './state-dimensions'
import {
  THRESHOLDS,
  RISK_THRESHOLDS,
  RECOVERY_SUSTAINED_DAYS,
  EXPANSION_SUSTAINED_DAYS,
} from './config'

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

function toRiskLevel(
  score: number,
  thresholds: { moderate: number; high: number; critical: number },
): RiskLevel {
  if (score >= thresholds.critical)  return 'CRITICAL'
  if (score >= thresholds.high)      return 'HIGH'
  if (score >= thresholds.moderate)  return 'MODERATE'
  return 'LOW'
}

export type RiskAssessment = {
  overloadRisk:  RiskLevel
  burnoutRisk:   RiskLevel
  avoidanceRisk: RiskLevel
  collapseRisk:  RiskLevel
}

export function assessRisks(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
): RiskAssessment {
  // Overload: high cognitive strain + fragmentation
  const overloadScore = dimensions.cognitiveStrain * 0.55 + dimensions.fragmentationLevel * 0.45
  // Burnout: high recovery debt + sustained intensity (embedded in dimensions)
  const burnoutScore  = dimensions.recoveryDebt * 0.60 + dimensions.emotionalFriction * 0.40
  // Avoidance: high avoidance pressure from signal snapshot or emotional friction
  const avoidanceDuration = snapshot?.signalDurations?.['AVOIDANCE_CLUSTERING'] ?? 0
  const avoidanceScore    = dimensions.emotionalFriction * 0.55 +
    (avoidanceDuration >= RECOVERY_SUSTAINED_DAYS ? 25 : 0) + dimensions.fragmentationLevel * 0.25
  // Collapse: compounded — high recovery debt + low execution stability
  const collapseScore = dimensions.recoveryDebt * 0.50 + (100 - dimensions.executionStability) * 0.50

  return {
    overloadRisk:  toRiskLevel(overloadScore,  RISK_THRESHOLDS.overload),
    burnoutRisk:   toRiskLevel(burnoutScore,   RISK_THRESHOLDS.burnout),
    avoidanceRisk: toRiskLevel(avoidanceScore, RISK_THRESHOLDS.avoidance),
    collapseRisk:  toRiskLevel(collapseScore,  RISK_THRESHOLDS.collapse),
  }
}

// ---------------------------------------------------------------------------
// Mode classification — priority ordered: RECOVERY → EXPANDING → STABILIZING → FOCUSED
// ---------------------------------------------------------------------------

export type ModeClassification = {
  mode: UserMode
  supportingFactors: string[]
  risks: RiskAssessment
}

function snapshotDuration(snapshot: SignalSnapshot | undefined, signal: SignalSnapshot['activeSignals'][number]): number {
  return snapshot?.signalDurations?.[signal] ?? 0
}

function checkRecovery(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  risks: RiskAssessment,
): string[] | null {
  const factors: string[] = []

  // Hard trigger: recovery debt above threshold (multi-factor confirmation via smoothing)
  if (dimensions.recoveryDebt >= THRESHOLDS.recoveryDebtRecovery) {
    factors.push(`Recovery debt elevated (${Math.round(dimensions.recoveryDebt)}/100)`)
  }

  // Signal-driven trigger: RECOVERY_COLLAPSE sustained
  const collapseDays = snapshotDuration(snapshot, 'RECOVERY_COLLAPSE')
  if (collapseDays >= RECOVERY_SUSTAINED_DAYS) {
    factors.push(`Recovery collapse signal sustained ${collapseDays} days`)
  }

  // Compound trigger: HIGH burnout risk + LOW execution stability
  if (risks.burnoutRisk === 'HIGH' || risks.burnoutRisk === 'CRITICAL') {
    if (dimensions.executionStability < THRESHOLDS.executionStabilityFocused) {
      factors.push('High burnout risk with declining execution stability')
    }
  }

  // Compound trigger: CRITICAL collapse risk is always recovery-eligible
  if (risks.collapseRisk === 'CRITICAL') {
    factors.push('Critical collapse risk requires recovery posture')
  }

  return factors.length >= 1 ? factors : null
}

function checkExpanding(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  previousMode: UserMode | undefined,
): string[] | null {
  // EXPANDING requires ALL dimension gates
  if (dimensions.recoveryDebt      > THRESHOLDS.expandingRecoveryDebt)      return null
  if (dimensions.cognitiveStrain   > THRESHOLDS.expandingCognitiveStrain)   return null
  if (dimensions.executionStability < THRESHOLDS.expandingExecutionStability) return null
  if (dimensions.emotionalFriction > THRESHOLDS.expandingEmotionalFriction) return null

  // No active collapse-class signals
  const hasNegativeSignal =
    (snapshot?.activeSignals ?? []).some(s =>
      s === 'RECOVERY_COLLAPSE' ||
      s === 'DECLINING_EXECUTION_QUALITY' ||
      s === 'VOLATILITY_ACCELERATION',
    )
  if (hasNegativeSignal) return null

  // Require FOCUSED or already EXPANDING as prior mode (can't leap from RECOVERY)
  if (previousMode === 'RECOVERY' || previousMode === 'STABILIZING') {
    // Needs extra sustained evidence to exit a recovery state — require longer smoothed positivity
    const requiredMinimumStability = THRESHOLDS.expandingExecutionStability + 4
    if (dimensions.executionStability < requiredMinimumStability) return null
  }

  return [
    `Recovery debt low (${Math.round(dimensions.recoveryDebt)})`,
    `Execution stability strong (${Math.round(dimensions.executionStability)})`,
    `Emotional friction low (${Math.round(dimensions.emotionalFriction)})`,
  ]
}

function checkStabilizing(
  dimensions: DimensionResult,
): string[] | null {
  const factors: string[] = []

  if (dimensions.recoveryDebt >= THRESHOLDS.recoveryDebtStabilizing) {
    factors.push(`Recovery debt moderate (${Math.round(dimensions.recoveryDebt)})`)
  }
  if (dimensions.executionStability < THRESHOLDS.executionStabilityFocused) {
    factors.push(`Execution stability below focused threshold (${Math.round(dimensions.executionStability)})`)
  }
  if (dimensions.emotionalFriction >= THRESHOLDS.emotionalFrictionHigh) {
    factors.push(`Emotional friction elevated (${Math.round(dimensions.emotionalFriction)})`)
  }

  return factors.length >= 1 ? factors : null
}

export function classifyMode(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  previousMode: UserMode | undefined,
): ModeClassification {
  const risks = assessRisks(dimensions, snapshot)

  const recoveryFactors = checkRecovery(dimensions, snapshot, risks)
  if (recoveryFactors) {
    return { mode: 'RECOVERY', supportingFactors: recoveryFactors, risks }
  }

  const expandingFactors = checkExpanding(dimensions, snapshot, previousMode)
  if (expandingFactors) {
    return { mode: 'EXPANDING', supportingFactors: expandingFactors, risks }
  }

  const stabilizingFactors = checkStabilizing(dimensions)
  if (stabilizingFactors) {
    return { mode: 'STABILIZING', supportingFactors: stabilizingFactors, risks }
  }

  return {
    mode: 'FOCUSED',
    supportingFactors: ['Dimensions within healthy operational range'],
    risks,
  }
}
