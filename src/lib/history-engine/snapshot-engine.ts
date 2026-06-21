import type { DayData, CheckIn, BlockerRecord, DistractionLogEntry } from '@/lib/store'
import type {
  AggregationSnapshot,
  WindowKey,
  SnapshotMetrics,
  DistractionProfileEntry,
  BlockerFrequencyEntry,
} from '@/core/contracts/history/snapshot'
import type { TrendDirection } from '@/core/contracts/primitives'
import { WINDOW_DAYS } from '@/core/contracts/history/snapshot'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function computeSnapshot(
  history: DayData[],
  checkIns: CheckIn[],
  blockerHistory: BlockerRecord[],
  distractionLog: DistractionLogEntry[],
  windowKey: WindowKey,
): AggregationSnapshot {
  const windowDays = WINDOW_DAYS[windowKey]
  const today = todayStr()

  // For W7_PRIOR, offset window by 7 days back
  const offset = windowKey === 'W7_PRIOR' ? 7 : 0
  const windowEnd = dateNDaysAgo(offset)
  const windowStart = dateNDaysAgo(offset + windowDays)

  const windowHistory = history.filter(
    (d) => d.date > windowStart && d.date <= windowEnd,
  )
  const evidenceDays = windowHistory.length

  if (evidenceDays === 0) {
    const emptyMetrics: SnapshotMetrics = {
      avgExecutionScore: 0,
      minExecutionScore: 0,
      maxExecutionScore: 0,
      scoreStdDev: 0,
      avgSleepHours: 0,
      daysUnderSleepTarget: 0,
      avgFocus: 0,
      avgDistractionCount: 0,
      distractionProfile: [],
      avgCompletionRate: 0,
      avgPlanned: 0,
      blockerFrequency: [],
      recoveryDayCount: 0,
      gapDays: windowDays,
      lastEvidenceDate: '',
      streakAtRisk: false,
      recoveryDebtAccumulating: false,
      momentumDirection: 'STABLE',
      consistencyRate: 0,
      dominantBlockerType: null,
      dominantDistractionType: null,
      executionScoreDelta: 0,
    }
    return {
      windowKey,
      windowDays,
      computedAt: new Date().toISOString(),
      evidenceDays: 0,
      metrics: emptyMetrics,
      isStale: false,
    }
  }

  // Single-pass scalar aggregation
  const scores = windowHistory.map((d) => d.executionScore)
  const totalScore = scores.reduce((a, b) => a + b, 0)
  const avgExecutionScore = totalScore / evidenceDays
  const minExecutionScore = Math.min(...scores)
  const maxExecutionScore = Math.max(...scores)
  const scoreStdDev = stdDev(scores)

  const totalSleep = windowHistory.reduce((a, d) => a + d.sleepHours, 0)
  const avgSleepHours = totalSleep / evidenceDays
  const daysUnderSleepTarget = windowHistory.filter((d) => d.sleepHours < 6.5).length

  const totalFocus = windowHistory.reduce((a, d) => a + d.focus, 0)
  const avgFocus = totalFocus / evidenceDays

  const totalDistractions = windowHistory.reduce((a, d) => a + d.distractions, 0)
  const avgDistractionCount = totalDistractions / evidenceDays

  const completionRates = windowHistory.map((d) =>
    d.planned > 0 ? d.completed / d.planned : 1,
  )
  const avgCompletionRate = completionRates.reduce((a, b) => a + b, 0) / evidenceDays

  const totalPlanned = windowHistory.reduce((a, d) => a + d.planned, 0)
  const avgPlanned = totalPlanned / evidenceDays

  const recoveryDayCount = windowHistory.filter((d) => d.recovery).length

  // Distraction profile — O(n_distractionLog) pass
  const windowDistrLog = distractionLog.filter(
    (d) => d.date > windowStart && d.date <= windowEnd,
  )
  const distFreqMap = new Map<string, { freq: number; scoreAccum: number; count: number }>()
  for (const entry of windowDistrLog) {
    const histEntry = history.find((h) => h.date === entry.date)
    const score = histEntry?.executionScore ?? 0
    for (const type of entry.types) {
      const existing = distFreqMap.get(type) ?? { freq: 0, scoreAccum: 0, count: 0 }
      distFreqMap.set(type, {
        freq: existing.freq + 1,
        scoreAccum: existing.scoreAccum + score,
        count: existing.count + 1,
      })
    }
  }
  // Compute avg score on days without each distractor
  const distractionProfile: DistractionProfileEntry[] = []
  const allWindowScoreSum = totalScore
  const allWindowScoreCount = evidenceDays
  for (const [id, { freq, scoreAccum, count }] of distFreqMap) {
    const avgWith = count > 0 ? scoreAccum / count : 0
    const avgWithout =
      allWindowScoreCount - count > 0
        ? (allWindowScoreSum - scoreAccum) / (allWindowScoreCount - count)
        : avgWith
    distractionProfile.push({
      id,
      frequency: freq,
      avgScoreImpact: Math.round(avgWith - avgWithout),
    })
  }
  distractionProfile.sort((a, b) => a.avgScoreImpact - b.avgScoreImpact)

  const dominantDistractionType =
    distractionProfile.length > 0 ? distractionProfile[0].id : null

  // Blocker frequency — O(n_blockerHistory) pass
  const windowBlockers = blockerHistory.filter(
    (b) => b.date > windowStart && b.date <= windowEnd,
  )
  const blockerMap = new Map<string, { count: number; taskTypes: Record<string, number> }>()
  for (const b of windowBlockers) {
    const existing = blockerMap.get(b.blockerType) ?? { count: 0, taskTypes: {} }
    existing.count += 1
    existing.taskTypes[b.taskType] = (existing.taskTypes[b.taskType] ?? 0) + 1
    blockerMap.set(b.blockerType, existing)
  }
  const blockerFrequency: BlockerFrequencyEntry[] = Array.from(blockerMap.entries()).map(
    ([blockerType, { count, taskTypes }]) => ({ blockerType, count, taskTypeBreakdown: taskTypes }),
  )
  blockerFrequency.sort((a, b) => b.count - a.count)

  const dominantBlockerType = blockerFrequency[0]?.blockerType ?? null

  // Gap days
  const gapDays = windowDays - evidenceDays

  // Last evidence date
  const sortedDates = windowHistory.map((d) => d.date).sort()
  const lastEvidenceDate = sortedDates[sortedDates.length - 1] ?? ''

  // Streak at risk: last 3 days trending toward <60
  const last3 = windowHistory.slice(-3)
  const streakAtRisk =
    last3.length >= 2 &&
    last3[last3.length - 1].executionScore < 65 &&
    last3[last3.length - 1].executionScore < (last3[last3.length - 2]?.executionScore ?? 100)

  // Recovery debt: avg sleep < 6.5 this window
  const recoveryDebtAccumulating = avgSleepHours < 6.5

  // Momentum direction (only meaningful for W7 after comparison with W7_PRIOR — set STABLE for others)
  const momentumDirection: TrendDirection = 'STABLE'

  // Consistency rate (days ≥70 / total)
  const consistencyRate =
    evidenceDays > 0
      ? Math.round((windowHistory.filter((d) => d.executionScore >= 70).length / evidenceDays) * 100)
      : 0

  // Score delta (last day vs first day in window)
  const executionScoreDelta =
    windowHistory.length >= 2
      ? (windowHistory[windowHistory.length - 1]?.executionScore ?? 0) -
        (windowHistory[0]?.executionScore ?? 0)
      : 0

  const metrics: SnapshotMetrics = {
    avgExecutionScore: Math.round(avgExecutionScore * 10) / 10,
    minExecutionScore,
    maxExecutionScore,
    scoreStdDev: Math.round(scoreStdDev * 10) / 10,
    avgSleepHours: Math.round(avgSleepHours * 10) / 10,
    daysUnderSleepTarget,
    avgFocus: Math.round(avgFocus * 10) / 10,
    avgDistractionCount: Math.round(avgDistractionCount * 10) / 10,
    distractionProfile,
    avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
    avgPlanned: Math.round(avgPlanned * 10) / 10,
    blockerFrequency,
    recoveryDayCount,
    gapDays,
    lastEvidenceDate,
    streakAtRisk,
    recoveryDebtAccumulating,
    momentumDirection,
    consistencyRate,
    dominantBlockerType,
    dominantDistractionType,
    executionScoreDelta,
  }

  // Suppress unused variable — checkIns is reserved for future snapshot metrics
  void checkIns
  void today

  return {
    windowKey,
    windowDays,
    computedAt: new Date().toISOString(),
    evidenceDays,
    metrics,
    isStale: false,
  }
}

export function computeAllSnapshots(
  history: DayData[],
  checkIns: CheckIn[],
  blockerHistory: BlockerRecord[],
  distractionLog: DistractionLogEntry[],
): Record<WindowKey, AggregationSnapshot> {
  return {
    W7: computeSnapshot(history, checkIns, blockerHistory, distractionLog, 'W7'),
    W7_PRIOR: computeSnapshot(history, checkIns, blockerHistory, distractionLog, 'W7_PRIOR'),
    W14: computeSnapshot(history, checkIns, blockerHistory, distractionLog, 'W14'),
    W28: computeSnapshot(history, checkIns, blockerHistory, distractionLog, 'W28'),
  }
}
