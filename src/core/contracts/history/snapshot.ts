import type { Timestamp, TrendDirection } from '../primitives'

export type WindowKey = 'W7' | 'W7_PRIOR' | 'W14' | 'W28'

export const WINDOW_DAYS: Record<WindowKey, number> = {
  W7: 7,
  W7_PRIOR: 7,
  W14: 14,
  W28: 28,
}

export const SNAPSHOT_TTL_HOURS: Record<WindowKey, number> = {
  W7: 24,
  W7_PRIOR: 24,
  W14: 24,
  W28: 48,
}

export type DistractionProfileEntry = {
  id: string
  frequency: number
  avgScoreImpact: number
}

export type BlockerFrequencyEntry = {
  blockerType: string
  count: number
  taskTypeBreakdown: Record<string, number>
}

export type SnapshotMetrics = {
  avgExecutionScore: number
  minExecutionScore: number
  maxExecutionScore: number
  scoreStdDev: number
  avgSleepHours: number
  daysUnderSleepTarget: number
  avgFocus: number
  avgDistractionCount: number
  distractionProfile: DistractionProfileEntry[]
  avgCompletionRate: number
  avgPlanned: number
  blockerFrequency: BlockerFrequencyEntry[]
  recoveryDayCount: number
  gapDays: number
  lastEvidenceDate: string
  streakAtRisk: boolean
  recoveryDebtAccumulating: boolean
  momentumDirection: TrendDirection
  consistencyRate: number
  dominantBlockerType: string | null
  dominantDistractionType: string | null
  executionScoreDelta: number
}

export type AggregationSnapshot = {
  windowKey: WindowKey
  windowDays: number
  computedAt: Timestamp
  evidenceDays: number
  metrics: SnapshotMetrics
  isStale: boolean
}
