import type { Scalar, Percentage, ConfidenceBand } from '../primitives'

/** Structured confidence — replaces bare stateConfidence number. */
export type StateConfidence = {
  /** 0–100 overall confidence in interpretation. */
  score: Scalar
  band: ConfidenceBand
  /** Fraction of expected evidence present (0–1). */
  evidenceCoverage: Percentage
  /** Consistency of signals across recent window (0–1). */
  signalConsistency: Percentage
  /** Human-readable factors reducing confidence. */
  uncertaintyFactors: string[]
  /**
   * Per-dimension confidence bands — reserved for future population.
   * Downstream engines may optionally use these when they need to express
   * uncertainty about a specific scalar rather than the global band.
   * Initially undefined; the global `band` applies to all variables.
   */
  variableConfidence?: Partial<Record<
    'recoveryDebt' | 'cognitiveStrain' | 'executionStability' | 'emotionalFriction',
    ConfidenceBand
  >>
}

