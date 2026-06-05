import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { DailyInputs } from '@/core/contracts/signals/daily-inputs'
import type { SessionEvidence } from '@/core/contracts/signals/session-evidence'
import type { Timestamp } from '@/core/contracts/primitives'
import { DEFAULT_SMOOTHING_WINDOW } from './config'
import { buildMetricTimeline } from './evidence'
import {
  detectBehavioralSignalsDetailed,
  resolveConfidenceBand,
  type SignalDetectionOptions,
} from './detection'

export type GenerateSignalSnapshotOptions = SignalDetectionOptions & {
  capturedAt?: Timestamp
}

/**
 * Transform raw behavioral evidence into a point-in-time SignalSnapshot
 * suitable for State Engine and Intervention Engine consumption.
 */
export function generateSignalSnapshot(
  evidence: SessionEvidence[],
  dailyInputs: DailyInputs[],
  options?: GenerateSignalSnapshotOptions,
): SignalSnapshot {
  const timeline = buildMetricTimeline(evidence, dailyInputs)
  const detected = detectBehavioralSignalsDetailed(evidence, dailyInputs, options)

  const signalStrengths: SignalSnapshot['signalStrengths'] = {}
  const signalDurations: SignalSnapshot['signalDurations'] = {}

  for (const entry of detected) {
    signalStrengths[entry.signal] = entry.strength
    signalDurations[entry.signal] = entry.sustainedDays
  }

  const capturedAt =
    options?.capturedAt ??
    timeline.points[timeline.points.length - 1]?.capturedAt ??
    new Date().toISOString()

  return {
    capturedAt,
    activeSignals: detected.map((entry) => entry.signal),
    signalStrengths,
    confidence: resolveConfidenceBand(timeline, detected.length),
    signalDurations,
  }
}

export { DEFAULT_SMOOTHING_WINDOW }
