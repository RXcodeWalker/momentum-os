import type { ConfidenceBand } from '@/core/contracts/primitives'
import type { StateDimensions } from '@/core/contracts/state/dimensions'
import type { StateDynamicsProfile } from '@/core/contracts/state/dynamics'
import type { UserState } from '@/core/contracts/state/user-state'
import type { Task } from '@/core/contracts/tasks/task'
import type {
  RecoveryCompatibilityComponents,
  RecoveryCompatibilityFlag,
  RecoveryCompatibilityResult,
  RecoveryCompatibilityTier,
} from '@/core/contracts/tasks/recovery-compatibility'
import type { CompatibilityBand } from '@/core/contracts/tasks/compatibility'
import { clampScalar } from './types'

// ---------------------------------------------------------------------------
// Input contract
// ---------------------------------------------------------------------------

export type RecoveryCompatibilityInput = {
  task: Task
  userState: UserState
  stateDimensions?: StateDimensions
  dynamicsProfile: StateDynamicsProfile
}

// ---------------------------------------------------------------------------
// Component computers
// ---------------------------------------------------------------------------

export function computeRecoveryDebtLoad(
  task: Task,
  userState: UserState,
  dims?: StateDimensions,
): number {
  let debtSensitivity: number

  if (dims) {
    const d = dims.recoveryDebt
    debtSensitivity = (
      d.exhaustionAccumulation * 0.35 +
      (100 - d.sleepQuality) * 0.30 +
      d.sustainedIntensity * 0.25 +
      (100 - d.recoveryBehaviorQuality) * 0.10
    ) / 100
  } else {
    debtSensitivity = userState.recoveryDebt / 100
  }

  const taskAmplifier = task.recoveryCost / 100
  return clampScalar(debtSensitivity * taskAmplifier * 100)
}

export function computeCognitiveStrainLoad(
  task: Task,
  userState: UserState,
  dims?: StateDimensions,
): number {
  let strainLevel: number

  if (dims) {
    const d = dims.cognitiveStrain
    strainLevel = (
      d.taskSwitchingRate * 0.20 +
      d.ambiguityExposure * 0.25 +
      d.interruptionDensity * 0.15 +
      d.activeCommitmentLoad * 0.25 +
      d.deepWorkDegradation * 0.15
    ) / 100
  } else {
    strainLevel = userState.cognitiveStrain / 100
  }

  const demand = task.cognitiveLoad / 100
  return clampScalar(strainLevel * 50 + demand * 50 + strainLevel * demand * 50)
}

export function computeEmotionalFrictionLoad(
  task: Task,
  userState: UserState,
  dims?: StateDimensions,
): number {
  let frictionLevel: number

  if (dims) {
    const d = dims.emotionalFriction
    frictionLevel = (
      d.initiationResistance * 0.30 +
      d.avoidancePressure * 0.30 +
      d.perfectionismPressure * 0.15 +
      d.overwhelmWeight * 0.15 +
      d.uncertaintyResistance * 0.10
    ) / 100
  } else {
    frictionLevel = userState.emotionalFriction / 100
  }

  const taskResistance = task.emotionalResistance / 100
  return clampScalar(frictionLevel * 50 + taskResistance * 50 + frictionLevel * taskResistance * 50)
}

export function computeHistoricalSuccessRate(profile: StateDynamicsProfile): number {
  const { pathways, failedRecoveries } = profile.recoveryPathwayAnalysis
  const total = pathways.length
  if (total === 0) return 50
  return ((total - failedRecoveries) / total) * 100
}

// ---------------------------------------------------------------------------
// Tier and band derivation
// ---------------------------------------------------------------------------

export function tierFromScore(score: number): RecoveryCompatibilityTier {
  if (score >= 80) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 45) return 'moderate'
  if (score >= 25) return 'poor'
  return 'harmful'
}

export function tierToCompatibilityBand(tier: RecoveryCompatibilityTier): CompatibilityBand {
  switch (tier) {
    case 'excellent': return 'OPTIMAL'
    case 'good':      return 'OPTIMAL'
    case 'moderate':  return 'COMPATIBLE'
    case 'poor':      return 'FRAGILE'
    case 'harmful':   return 'HARMFUL'
  }
}

// ---------------------------------------------------------------------------
// Flag detection
// ---------------------------------------------------------------------------

export function detectFlags(
  components: RecoveryCompatibilityComponents,
  task: Task,
  userState: UserState,
  tier: RecoveryCompatibilityTier,
): RecoveryCompatibilityFlag[] {
  const flags: RecoveryCompatibilityFlag[] = []

  if (components.cognitiveStrainLoad > 70) flags.push('COGNITIVE_OVERLOAD')
  if (components.emotionalFrictionLoad > 70) flags.push('EMOTIONAL_FRICTION_HIGH')
  if (components.recoveryDebtLoad > 70) flags.push('RECOVERY_DEBT_AMPLIFIER')
  if (components.resilienceBuffer < 30) flags.push('RESILIENCE_BUFFER_INSUFFICIENT')
  if (components.historicalSuccessRate < 40) flags.push('HISTORICAL_RECOVERY_FAILURE')

  if (task.fragmentationRisk > 65 && userState.fragmentationLevel > 60) {
    flags.push('FRAGMENTATION_RISK')
  }

  if (tier === 'excellent' || tier === 'good') flags.push('MOMENTUM_SAFE')

  const grossLoad =
    components.recoveryDebtLoad * 0.30 +
    components.cognitiveStrainLoad * 0.28 +
    components.emotionalFrictionLoad * 0.22 +
    (100 - components.historicalSuccessRate) * 0.08

  if (grossLoad <= 60) flags.push('CAPACITY_ALIGNED')

  return flags
}

// ---------------------------------------------------------------------------
// Human-readable output
// ---------------------------------------------------------------------------

export function buildRationale(tier: RecoveryCompatibilityTier): string {
  switch (tier) {
    case 'excellent':
      return 'Task demands align well with current adaptive capacity — proceeding supports recovery momentum.'
    case 'good':
      return 'Task is appropriate; no significant concern for current recovery state.'
    case 'moderate':
      return 'Task is within range but warrants attention — one or more capacity dimensions are under load.'
    case 'poor':
      return 'Task demands likely exceed current recovery capacity — consider deferring or scoping down.'
    case 'harmful':
      return 'Attempting this task risks compounding existing strain — not recommended without protocol adjustment.'
  }
}

export function buildAdaptationHint(flags: RecoveryCompatibilityFlag[]): string {
  if (flags.includes('COGNITIVE_OVERLOAD')) {
    return 'Reduce scope or break into sequential micro-tasks.'
  }
  if (flags.includes('EMOTIONAL_FRICTION_HIGH')) {
    return 'Pair with a low-friction warm-up or defer to a higher-energy window.'
  }
  if (flags.includes('RECOVERY_DEBT_AMPLIFIER')) {
    return 'Prioritize sleep and recovery before engaging; this task compounds existing debt.'
  }
  if (flags.includes('RESILIENCE_BUFFER_INSUFFICIENT')) {
    return 'Build 1-2 days of recovery foundation before attempting.'
  }
  if (flags.includes('HISTORICAL_RECOVERY_FAILURE')) {
    return 'Historical patterns suggest pausing; revisit protocol alignment.'
  }
  if (flags.includes('FRAGMENTATION_RISK')) {
    return 'Protect a continuous block — interruptions will amplify the fragmentation risk.'
  }
  return 'Task is well-matched to current state — proceed with standard pacing.'
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function computeConfidence(
  stateDimensions: StateDimensions | undefined,
  dynamicsProfile: StateDynamicsProfile,
): ConfidenceBand {
  const hasStrongDynamics =
    dynamicsProfile.confidence === 'high' && dynamicsProfile.periodCount >= 5

  if (stateDimensions && hasStrongDynamics) return 'HIGH'
  if (stateDimensions || dynamicsProfile.confidence !== 'low') return 'MEDIUM'
  return 'LOW'
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function evaluateRecoveryCompatibility(
  input: RecoveryCompatibilityInput,
): RecoveryCompatibilityResult {
  const { task, userState, stateDimensions, dynamicsProfile } = input

  const recoveryDebtLoad = computeRecoveryDebtLoad(task, userState, stateDimensions)
  const cognitiveStrainLoad = computeCognitiveStrainLoad(task, userState, stateDimensions)
  const emotionalFrictionLoad = computeEmotionalFrictionLoad(task, userState, stateDimensions)
  const historicalSuccessRate = computeHistoricalSuccessRate(dynamicsProfile)
  const resilienceBuffer = userState.resilienceCapacity

  const historicalLoad = (100 - historicalSuccessRate)

  const grossLoad =
    recoveryDebtLoad * 0.30 +
    cognitiveStrainLoad * 0.28 +
    emotionalFrictionLoad * 0.22 +
    historicalLoad * 0.08

  // Resilience buffer reduces gross load; max ~13.6% reduction at full resilience
  const bufferStrength = 0.12 / 0.88
  const netLoad = grossLoad * (1 - (resilienceBuffer / 100) * bufferStrength)

  const score = clampScalar(100 - netLoad)
  const tier = tierFromScore(score)

  const components: RecoveryCompatibilityComponents = {
    recoveryDebtLoad,
    cognitiveStrainLoad,
    emotionalFrictionLoad,
    resilienceBuffer,
    historicalSuccessRate,
  }

  const flags = detectFlags(components, task, userState, tier)

  return {
    taskId: task.id,
    tier,
    score,
    components,
    flags,
    rationale: buildRationale(tier),
    adaptationHint: buildAdaptationHint(flags),
    confidence: computeConfidence(stateDimensions, dynamicsProfile),
    evaluatedAt: new Date().toISOString(),
  }
}
