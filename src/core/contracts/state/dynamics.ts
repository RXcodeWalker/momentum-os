import type { BehavioralPeriodType } from '../history/period'

export type StabilityRating = 'stable' | 'building' | 'transitioning' | 'volatile'

export type ModeTransitionSummary = {
  from: BehavioralPeriodType
  to: BehavioralPeriodType
  date: string
  durationBefore: number
}

export type StabilityProfile = {
  currentModeDays: number
  rating: StabilityRating
  longestStablePeriodDays: number
  longestStablePeriodType: BehavioralPeriodType | null
}

export type VolatilityProfile = {
  score: number
  trend: 'increasing' | 'decreasing' | 'stable'
  scoreStdDev14d: number
  interpretation: string
}

export type OscillationProfile = {
  isOscillating: boolean
  frequencyPer28Days: number
  dominantCyclePair: { from: BehavioralPeriodType; to: BehavioralPeriodType } | null
  cycleCount: number
}

export type RecoveryCycleStats = {
  count: number
  avgDurationDays: number
  lastDurationDays: number
  longestDurationDays: number
  successRate: number
}

export type TrajectoryShiftEvent = {
  from: BehavioralPeriodType
  to: BehavioralPeriodType
  date: string
  significance: 'high' | 'medium' | 'low'
}

export type StateDynamics = {
  currentPeriod: BehavioralPeriodType | null
  recentTransitions: ModeTransitionSummary[]
  stability: StabilityProfile
  volatility: VolatilityProfile
  oscillation: OscillationProfile
  recoveryCycles: RecoveryCycleStats
  trajectoryShifts: TrajectoryShiftEvent[]
  evidenceDays: number
  confidence: 'low' | 'medium' | 'high'
}

// --- New types for StateDynamicsProfile ---

export type TransitionPath = {
  from: BehavioralPeriodType
  to: BehavioralPeriodType
  count: number
  frequency: number
  avgDurationBefore: number
  avgScoreDelta: number
}

export type TransitionMatrix = {
  paths: TransitionPath[]
  commonPaths: TransitionPath[]
  rarePaths: TransitionPath[]
  totalTransitions: number
}

export type StateStatistics = {
  type: BehavioralPeriodType
  occurrenceCount: number
  avgDurationDays: number
  maxDurationDays: number
  persistenceScore: number
  collapseRate: number
  instabilityPrecedenceRate: number
}

export type RecoveryPathway = {
  exitState: BehavioralPeriodType
  count: number
  isSuccessful: boolean
  avgDaysToFocused: number | null
}

export type RecoveryPathwayAnalysis = {
  pathways: RecoveryPathway[]
  failedRecoveries: number
  avgDaysToFocusedFromRecovery: number | null
  mostCommonExitState: BehavioralPeriodType | null
  mostSuccessfulPathway: RecoveryPathway | null
}

export type InstabilityHotspot = {
  predecessorState: BehavioralPeriodType
  precedenceRate: number
  count: number
  riskSignal: 'high' | 'moderate' | 'low'
}

export type DominantPattern =
  | 'cycling'
  | 'stable'
  | 'expanding'
  | 'contracting'
  | 'erratic'

export type StateDynamicsProfile = {
  transitionMatrix: TransitionMatrix
  stateStatistics: Partial<Record<BehavioralPeriodType, StateStatistics>>
  recoveryPathwayAnalysis: RecoveryPathwayAnalysis
  instabilityHotspots: InstabilityHotspot[]
  oscillation: OscillationProfile
  mostStableState: BehavioralPeriodType | null
  mostVolatileTransition: { from: BehavioralPeriodType; to: BehavioralPeriodType } | null
  dominantPattern: DominantPattern
  periodCount: number
  windowDays: number
  confidence: 'low' | 'medium' | 'high'
  computedAt: string
}
