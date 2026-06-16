import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { InterventionEvaluationInput } from '@/core/contracts/interventions/evaluation'
import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { BehavioralSignal } from '@/core/contracts/signals/behavioral-signals'
import { makeUserState } from './task-intelligence'

const BASE_TS = '2026-03-10T08:00:00.000Z'

function hoursBack(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

// ---------------------------------------------------------------------------
// Shared builders
// ---------------------------------------------------------------------------

export function makeSignalSnapshot(
  signals: BehavioralSignal[],
  durations: Partial<Record<BehavioralSignal, number>> = {},
  strengths: Partial<Record<BehavioralSignal, number>> = {},
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH',
): SignalSnapshot {
  return {
    capturedAt: BASE_TS,
    activeSignals: signals,
    signalStrengths: Object.fromEntries(signals.map(s => [s, strengths[s] ?? 75])),
    signalDurations: Object.fromEntries(signals.map(s => [s, durations[s] ?? 3])),
    confidence,
  }
}

export function makeSequencing(
  overrides: Partial<SequencingDecision> = {},
): SequencingDecision {
  return {
    recommendedPrimaryTaskId: 'task-1',
    recommendedSecondaryTaskId: undefined,
    suppressedTaskIds: [],
    compressedTaskIds: [],
    sequencingReasoning: [],
    reasoningTrace: { factors: [], confidenceBand: 'HIGH' },
    expectedRecoveryImpact: 30,
    expectedMomentumImpact: 50,
    sequencingConfidence: 70,
    ...overrides,
  }
}

export function makeInput(
  stateOverrides: Partial<UserState>,
  signals: BehavioralSignal[],
  signalDurations: Partial<Record<BehavioralSignal, number>> = {},
  sequencingOverrides: Partial<SequencingDecision> = {},
  recentInterventions: InterventionAuditRecord[] = [],
): InterventionEvaluationInput {
  return {
    state: makeUserState('STABILIZING', stateOverrides),
    signalSnapshot: makeSignalSnapshot(signals, signalDurations),
    sequencing: makeSequencing(sequencingOverrides),
    context: {
      flowPhase: 'morning',
      recentInterventions,
    },
  }
}

// ---------------------------------------------------------------------------
// Simulation 1 — RecoverySpiral
// 3+ days RECOVERY_COLLAPSE, burnoutRisk CRITICAL → BURNOUT_PREVENTION T0 fires
// ---------------------------------------------------------------------------

export function buildScenario_RecoverySpiral(): InterventionEvaluationInput {
  return makeInput(
    {
      currentMode: 'RECOVERY',
      burnoutRisk: 'CRITICAL',
      collapseRisk: 'CRITICAL',
      recoveryDebt: 88,
      emotionalFriction: 70,
      overloadRisk: 'HIGH',
    },
    ['RECOVERY_COLLAPSE', 'DECLINING_EXECUTION_QUALITY'],
    { RECOVERY_COLLAPSE: 4, DECLINING_EXECUTION_QUALITY: 3 },
  )
}

// ---------------------------------------------------------------------------
// Simulation 2 — AvoidanceCluster
// 3-day AVOIDANCE_CLUSTERING + MEANINGFULNESS_DEFERRAL → AVOIDANCE_INTERRUPTION level 1
// Second run: cooldown active → suppressed
// ---------------------------------------------------------------------------

export function buildScenario_AvoidanceCluster(): InterventionEvaluationInput {
  return makeInput(
    {
      currentMode: 'STABILIZING',
      avoidanceRisk: 'HIGH',
      emotionalFriction: 65,
      fragmentationLevel: 50,
    },
    ['AVOIDANCE_CLUSTERING', 'MEANINGFULNESS_DEFERRAL'],
    { AVOIDANCE_CLUSTERING: 3, MEANINGFULNESS_DEFERRAL: 3 },
  )
}

export function buildScenario_AvoidanceCluster_CooldownActive(): InterventionEvaluationInput {
  const recentAuditRecord: InterventionAuditRecord = {
    interventionId: 'prev-avoidance-1',
    type: 'AVOIDANCE_INTERRUPTION',
    level: 1,
    firedAt: hoursBack(10),  // 10h ago — within 36h cooldown
    flowPhase: 'morning',
    cooldownDurationHours: 36,
  }
  return makeInput(
    {
      currentMode: 'STABILIZING',
      avoidanceRisk: 'HIGH',
      emotionalFriction: 65,
    },
    ['AVOIDANCE_CLUSTERING', 'MEANINGFULNESS_DEFERRAL'],
    { AVOIDANCE_CLUSTERING: 3, MEANINGFULNESS_DEFERRAL: 3 },
    {},
    [recentAuditRecord],
  )
}

// ---------------------------------------------------------------------------
// Simulation 3 — ExpandingOvercommit
// EXPANDING mode, RISING_FRAGMENTATION + PACING_INSTABILITY active
// - Deprecated MOMENTUM_EXPANSION must NOT appear in output
// - OVERLOAD fires at level 0 when sequencing already saturated
// - OVERLOAD fires at level 1 when sequencing is not saturated
// ---------------------------------------------------------------------------

export function buildScenario_ExpandingOvercommit_Saturated(): InterventionEvaluationInput {
  return makeInput(
    {
      currentMode: 'EXPANDING',
      overloadRisk: 'HIGH',
      overwhelmLevel: 72,
      emotionalFriction: 50,
      fragmentationLevel: 65,
    },
    ['RISING_FRAGMENTATION', 'PACING_INSTABILITY'],
    { RISING_FRAGMENTATION: 3, PACING_INSTABILITY: 3 },
    // Sequencing already compressed 50%+ of tasks (saturation → soft downgrade to level 0)
    {
      suppressedTaskIds: ['t1', 't2', 't3'],
      compressedTaskIds: ['t4'],
      expectedRecoveryImpact: 70,
    },
  )
}

export function buildScenario_ExpandingOvercommit_NotSaturated(): InterventionEvaluationInput {
  return makeInput(
    {
      currentMode: 'EXPANDING',
      overloadRisk: 'HIGH',
      overwhelmLevel: 72,
      emotionalFriction: 50,
    },
    ['RISING_FRAGMENTATION', 'PACING_INSTABILITY'],
    { RISING_FRAGMENTATION: 3, PACING_INSTABILITY: 3 },
    // Sequencing not saturated — overload fires at level 1
    {
      suppressedTaskIds: [],
      compressedTaskIds: [],
      expectedRecoveryImpact: 30,
    },
  )
}
