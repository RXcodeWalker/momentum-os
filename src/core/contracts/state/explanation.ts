import type { ConfidenceBand, Timestamp } from '../primitives'

/**
 * Semantic codes for state-level observations.
 * Codes are stable identifiers — the human-readable `observation` string may
 * be updated for tone without breaking downstream switch logic on the code.
 */
export type StateExplanationCode =
  | 'RECOVERY_DEMAND_ELEVATED'
  | 'COGNITIVE_LOAD_ACCUMULATING'
  | 'EXECUTION_RHYTHM_BUILDING'
  | 'EXPANSION_CONDITIONS_PRESENT'
  | 'TRAJECTORY_IMPROVING'
  | 'TRAJECTORY_DECLINING'
  | 'TRAJECTORY_STABLE'
  | 'EVIDENCE_SPARSE'
  | 'TRANSITION_DETECTED'

/**
 * A single observational statement about current behavioral state.
 * Trust contract: observation strings MUST be:
 *   - probabilistic ("patterns suggest…", "may indicate…")
 *   - non-diagnostic (no medical or psychological labels)
 *   - non-blaming (no performance judgements)
 *   - formula-free (no weights, scores, or coefficients)
 */
export type StateExplanation = {
  code:        StateExplanationCode
  observation: string
  confidence:  ConfidenceBand
}

/**
 * Full explainability output for a single pipeline evaluation.
 * `primary` is the headline observation. `supporting` contains 0–2 contextual
 * observations. `modeRationale` and `trajectoryRationale` are plain-language
 * descriptions of why the current mode and trajectory were selected — for
 * developer/debug transparency, not direct UI display.
 */
export type StateExplanationResult = {
  primary:              StateExplanation
  supporting:           StateExplanation[]
  modeRationale:        string
  trajectoryRationale:  string
  generatedAt:          Timestamp
}
