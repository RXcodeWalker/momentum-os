import type { Scalar, Timestamp } from '../primitives'
import type { UserMode, UserTrajectory } from './modes'
import type { StateConfidence } from './confidence'

/**
 * Persisted record for audit, replay, and trajectory context across sessions.
 * Stores only the primary scalars — secondary scalars are fully derivable from
 * these, so persisting them would be redundant and expensive.
 * The `engineVersion` field enables replay comparisons when weights change.
 */
export type HistoricalStateSnapshot = {
  snapshotId:       string
  capturedAt:       Timestamp
  engineVersion:    string
  mode:             UserMode
  trajectory:       UserTrajectory
  primaryScalars: {
    recoveryDebt:        Scalar
    cognitiveStrain:     Scalar
    executionStability:  Scalar
    emotionalFriction:   Scalar
    momentumIntegrity:   Scalar
    resilienceCapacity:  Scalar
  }
  confidence:       StateConfidence
  evidenceDayCount: number
}
