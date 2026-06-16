import type { UserMode } from './modes'
import type { HistoricalStateSnapshot } from './historical'

/**
 * Per-evaluation context passed alongside raw evidence into the State Engine.
 * Mirrors the pattern established by InterventionEvaluationContext in the
 * intervention engine — provides metadata about the pipeline run without
 * coupling the engine to the persistence or orchestration layers.
 *
 * `configOverride` is a zero-cost reservation for future A/B testing of
 * dimension thresholds. Implement as a no-op initially and wire it when an
 * experimentation framework is available.
 */
export type StateEvaluationContext = {
  /** Which phase of the daily flow triggered this evaluation. */
  flowPhase: 'morning' | 'midday' | 'evening'
  /** Last 28 days of persisted state snapshots for trajectory context. */
  historicalSnapshots: HistoricalStateSnapshot[]
  /** Mode from the immediately prior pipeline run — drives hysteresis logic. */
  previousMode?: UserMode
  /** If true, the engine generates a StateExplanationResult alongside UserState. */
  forceExplanation?: boolean
  /**
   * Runtime overrides for dimension thresholds.
   * Reserved for experimentation; currently unused by the engine.
   */
  configOverride?: Record<string, number>
}
