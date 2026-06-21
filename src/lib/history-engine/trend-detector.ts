import type { AggregationSnapshot } from '@/core/contracts/history/snapshot'
import type { TrendRecord, TrendMetricKey } from '@/core/contracts/history/trend'
import type { TrendDirection, ConfidenceBand } from '@/core/contracts/primitives'

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function extractMetricValue(
  snapshot: AggregationSnapshot,
  metric: TrendMetricKey,
): number {
  const m = snapshot.metrics
  switch (metric) {
    case 'executionScore': return m.avgExecutionScore
    case 'sleepHours': return m.avgSleepHours
    case 'focus': return m.avgFocus
    case 'distractionCount': return m.avgDistractionCount
    case 'completionRate': return m.avgCompletionRate * 100
    case 'consistency': return m.consistencyRate
  }
}

function confidenceFromEvidence(evidenceDays: number): ConfidenceBand {
  if (evidenceDays >= 10) return 'HIGH'
  if (evidenceDays >= 5) return 'MEDIUM'
  return 'LOW'
}

export function detectTrends(
  w7: AggregationSnapshot,
  w7Prior: AggregationSnapshot,
  existing: TrendRecord[],
): TrendRecord[] {
  const metrics: TrendMetricKey[] = [
    'executionScore',
    'sleepHours',
    'focus',
    'distractionCount',
    'completionRate',
    'consistency',
  ]

  return metrics.map((metric) => {
    const currentAvg = extractMetricValue(w7, metric)
    const priorAvg = extractMetricValue(w7Prior, metric)
    const magnitude = currentAvg - priorAvg

    const direction: TrendDirection =
      magnitude > 2 ? 'RISING' : magnitude < -2 ? 'DECLINING' : 'STABLE'

    const velocity = w7.windowDays > 0 ? magnitude / w7.windowDays : 0

    // Consistency: 1 - normalized stdDev (for executionScore; approximated for others)
    const range = w7.metrics.maxExecutionScore - w7.metrics.minExecutionScore
    const consistency =
      metric === 'executionScore' && range > 0
        ? Math.max(0, Math.min(1, 1 - w7.metrics.scoreStdDev / range))
        : 0.5

    // Persistence: fraction of evidence days where day-over-day delta matched direction
    // Approximated from evidence days and direction magnitude — exact requires day-level deltas
    const persistence =
      w7.evidenceDays > 1
        ? Math.min(1, Math.max(0, 0.5 + (Math.abs(magnitude) / (w7.metrics.scoreStdDev + 1)) * 0.15))
        : 0

    // Extend existing trend's duration if same direction
    const existing_ = existing.find((t) => t.metric === metric)
    const sameDirAsBefore = existing_?.direction === direction
    const durationDays = sameDirAsBefore ? (existing_.durationDays ?? 0) + 1 : 1
    const periodStartDate =
      sameDirAsBefore && existing_?.periodStartDate ? existing_.periodStartDate : new Date().toISOString().slice(0, 10)

    const confidence = confidenceFromEvidence(w7.evidenceDays)

    return {
      trendId: existing_?.trendId ?? generateId(),
      metric,
      direction,
      magnitude: Math.round(magnitude * 10) / 10,
      velocity: Math.round(velocity * 100) / 100,
      persistence: Math.round(persistence * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      durationDays,
      windowDays: w7.windowDays,
      detectedAt: new Date().toISOString(),
      periodStartDate,
      supportingDayCount: w7.evidenceDays,
      confidence,
      priorWindowAvg: Math.round(priorAvg * 10) / 10,
      currentWindowAvg: Math.round(currentAvg * 10) / 10,
    } satisfies TrendRecord
  })
}

export function pruneTrends(trends: TrendRecord[], maxAgeDays: number): TrendRecord[] {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString()
  return trends.filter((t) => t.detectedAt >= cutoff)
}
