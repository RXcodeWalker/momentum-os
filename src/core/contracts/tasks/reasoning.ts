import type { ConfidenceBand } from '../primitives'

export type ReasoningFactor = {
  /** Stable machine-readable code for analytics/tests. Not user-facing. */
  code: string
  /** Observational, probabilistic language. No formulas, no weights. */
  observation: string
  influence: 'supports' | 'cautions' | 'suppresses' | 'neutral'
}

export type ReasoningTrace = {
  factors: ReasoningFactor[]
  confidenceBand: ConfidenceBand
}
