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
}

