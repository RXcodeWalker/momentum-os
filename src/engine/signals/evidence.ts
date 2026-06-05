import type { DailyInputs } from '@/core/contracts/signals/daily-inputs'
import type { SessionEvidence } from '@/core/contracts/signals/session-evidence'
import type { Percentage, Timestamp } from '@/core/contracts/primitives'
import { weightedAverage } from '@/engine/shared'

export type DailyMetricPoint = {
  capturedAt: Timestamp
  completeness: Percentage
  fragmentation: number
  executionQuality: number
  recoveryCapacity: number
  avoidancePressure: number
  deepWorkContinuity: number
  pacingQuality: number
  meaningfulness: number
  behavioralComposite: number
}

export type MetricTimeline = {
  points: DailyMetricPoint[]
}

function dayKey(timestamp: Timestamp): string {
  return timestamp.slice(0, 10)
}

function extractMetrics(inputs: DailyInputs): Omit<DailyMetricPoint, 'capturedAt' | 'completeness'> {
  const { recoveryInputs, emotionalInputs, executionInputs, behavioralInputs } = inputs

  const fragmentation = weightedAverage(
    [behavioralInputs.fragmentationLevel, behavioralInputs.distractionPatterns],
    [0.6, 0.4],
  )

  const executionQuality = weightedAverage(
    [
      executionInputs.meaningfulAdvancementQuality,
      executionInputs.deepWorkContinuity,
      executionInputs.executionIntegrity,
    ],
    [0.35, 0.35, 0.3],
  )

  const recoveryCapacity = weightedAverage(
    [recoveryInputs.sleepQuality, recoveryInputs.physicalEnergy, recoveryInputs.mentalClarity],
    [0.4, 0.3, 0.3],
  )

  const avoidancePressure = weightedAverage(
    [behavioralInputs.avoidancePressure, emotionalInputs.emotionalResistance],
    [0.65, 0.35],
  )

  const behavioralComposite = weightedAverage(
    [fragmentation, avoidancePressure, 100 - behavioralInputs.pacingQuality],
    [0.4, 0.35, 0.25],
  )

  return {
    fragmentation,
    executionQuality,
    recoveryCapacity,
    avoidancePressure,
    deepWorkContinuity: executionInputs.deepWorkContinuity,
    pacingQuality: behavioralInputs.pacingQuality,
    meaningfulness: executionInputs.meaningfulAdvancementQuality,
    behavioralComposite,
  }
}

type TimelineEntry = {
  capturedAt: Timestamp
  completeness: Percentage
  inputs: DailyInputs
}

/** Merge session evidence and daily inputs into a single chronological timeline. */
export function buildMetricTimeline(
  evidence: SessionEvidence[],
  dailyInputs: DailyInputs[],
): MetricTimeline {
  const byDay = new Map<string, TimelineEntry>()

  for (const session of evidence) {
    const key = dayKey(session.capturedAt)
    const existing = byDay.get(key)
    if (!existing || session.completeness >= existing.completeness) {
      byDay.set(key, {
        capturedAt: session.capturedAt,
        completeness: session.completeness,
        inputs: session.inputs,
      })
    }
  }

  for (const inputs of dailyInputs) {
    const key = dayKey(inputs.capturedAt)
    const existing = byDay.get(key)
    if (!existing) {
      byDay.set(key, {
        capturedAt: inputs.capturedAt,
        completeness: 1,
        inputs,
      })
    }
  }

  const points = [...byDay.values()]
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    .map((entry) => ({
      capturedAt: entry.capturedAt,
      completeness: entry.completeness,
      ...extractMetrics(entry.inputs),
    }))

  return { points }
}

export function seriesFromTimeline(
  timeline: MetricTimeline,
  key: keyof Omit<DailyMetricPoint, 'capturedAt' | 'completeness'>,
): number[] {
  return timeline.points.map((point) => point[key])
}

export function averageCompleteness(timeline: MetricTimeline): Percentage {
  if (timeline.points.length === 0) return 0
  const total = timeline.points.reduce((sum, point) => sum + point.completeness, 0)
  return total / timeline.points.length
}
