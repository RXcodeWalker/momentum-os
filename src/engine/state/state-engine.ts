import type { UserState } from '@/core/contracts/state/user-state'
import type { UserMode } from '@/core/contracts/state/modes'
import type { StateTransition } from '@/core/contracts/state/transitions'
import type { SessionEvidence } from '@/core/contracts/signals/session-evidence'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import { STATE_ENGINE_VERSION } from './config'
import { computeDimensions } from './state-dimensions'
import { computeStateConfidence } from './state-confidence'
import { classifyMode } from './mode-classifier'
import { analyzeTrajectory } from './trajectory-analyzer'
import { detectTransition } from './transition-engine'

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

export type StateEngineInput = {
  /** Chronological session evidence from the persistence layer. */
  evidence: SessionEvidence[]
  /**
   * Signal snapshots produced by the Signal Engine for this pipeline run.
   * The most recent snapshot drives active signal assessment; the series
   * drives signal consistency scoring.
   */
  signalSnapshots: SignalSnapshot[]
  /**
   * Current mode from the prior pipeline run — used only for transition
   * detection.  Never used as authority for dimension computation.
   */
  previousMode?: UserMode
}

export type StateEngineResult = {
  state: UserState
  /** Emitted only when `currentMode` changed relative to `previousMode`. */
  transition?: StateTransition
  /** State Engine version tag for audit. */
  engineVersion: typeof STATE_ENGINE_VERSION
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mostRecentSnapshot(snapshots: SignalSnapshot[]): SignalSnapshot | undefined {
  if (snapshots.length === 0) return undefined
  return [...snapshots].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0]
}

function resolveTimestamp(
  evidence: SessionEvidence[],
  snapshots: SignalSnapshot[],
): string {
  const evidenceLast  = evidence[evidence.length - 1]?.capturedAt
  const snapshotLast  = snapshots[snapshots.length - 1]?.capturedAt
  const candidates    = [evidenceLast, snapshotLast].filter((s): s is string => !!s)
  return candidates.length > 0
    ? candidates.reduce((latest, c) => (c > latest ? c : latest))
    : new Date().toISOString()
}

// ---------------------------------------------------------------------------
// evaluate() — main entry point (State Engine v1)
// ---------------------------------------------------------------------------

export function evaluate(input: StateEngineInput): StateEngineResult {
  const { evidence, signalSnapshots, previousMode } = input

  // 1. Compute all behavioral dimensions from raw evidence
  const dimensions = computeDimensions(evidence)

  // 2. Compute StateConfidence from evidence quality + signal consistency
  const confidence = computeStateConfidence(evidence, signalSnapshots)

  // 3. Identify the most recent signal snapshot for active signal queries
  const snapshot = mostRecentSnapshot(signalSnapshots)

  // 4. Classify operational mode (RECOVERY / STABILIZING / FOCUSED / EXPANDING)
  const classification = classifyMode(dimensions, snapshot, previousMode, evidence.length)

  // 5. Derive trajectory independently from mode
  const trajectory = analyzeTrajectory(evidence)

  // 6. Detect mode transition (emitted only when mode changed)
  const occurredAt = resolveTimestamp(evidence, signalSnapshots)
  const transition = detectTransition(previousMode, classification, dimensions, snapshot, occurredAt)

  // 7. Assemble UserState — stable snapshot, no in-flight fields
  const state: UserState = {
    // Primary scalars
    recoveryDebt:        dimensions.recoveryDebt,
    cognitiveStrain:     dimensions.cognitiveStrain,
    executionStability:  dimensions.executionStability,
    emotionalFriction:   dimensions.emotionalFriction,

    // Secondary scalars
    momentumIntegrity:   dimensions.momentumIntegrity,
    resilienceCapacity:  dimensions.resilienceCapacity,
    overwhelmLevel:      dimensions.overwhelmLevel,
    fragmentationLevel:  dimensions.fragmentationLevel,
    recoveryCapacity:    dimensions.recoveryCapacity,
    meaningfulEngagement: dimensions.meaningfulEngagement,
    deepWorkContinuity:  dimensions.deepWorkContinuity,
    behavioralVolatility: dimensions.behavioralVolatility,

    // Mode + trajectory (may diverge)
    currentMode:         classification.mode,
    currentTrajectory:   trajectory,

    // Risk assessment
    overloadRisk:        classification.risks.overloadRisk,
    burnoutRisk:         classification.risks.burnoutRisk,
    avoidanceRisk:       classification.risks.avoidanceRisk,
    collapseRisk:        classification.risks.collapseRisk,

    // Readiness
    adaptationReadiness: dimensions.adaptationReadiness,
    expansionReadiness:  dimensions.expansionReadiness,

    // Trends
    consistencyTrend:    dimensions.consistencyTrend,
    recoveryTrend:       dimensions.recoveryTrend,
    engagementTrend:     dimensions.engagementTrend,

    // Confidence — always present
    confidence,

    lastUpdatedAt: occurredAt,
  }

  return { state, transition, engineVersion: STATE_ENGINE_VERSION }
}
