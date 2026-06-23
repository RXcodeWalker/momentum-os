import type { ConfidenceBand, RiskLevel, Scalar, Timestamp } from '../primitives'

export type AvoidancePatternId =
  | 'MAINTENANCE_LOOP'
  | 'PREPARATION_ESCAPE'
  | 'FRAGMENTATION_ESCAPE'
  | 'ADVANCEMENT_DEFERRAL'

export type AvoidanceEvidence = {
  signal: string
  value: number
  threshold: number
  weight: number
  description: string
}

export type DetectedAvoidancePattern = {
  id: AvoidancePatternId
  detected: boolean
  confidence: ConfidenceBand
  severity: RiskLevel
  evidence: AvoidanceEvidence[]
  durationDays: number
  observedAt: Timestamp
}

export type AvoidanceProfile = {
  patterns: DetectedAvoidancePattern[]
  activePatterns: AvoidancePatternId[]
  dominantPattern: AvoidancePatternId | null
  overallAvoidancePressure: Scalar
  observationalSummary: string
  confidence: ConfidenceBand
  windowDays: number
  checkInsInWindow: number
  detectedAt: Timestamp
}
