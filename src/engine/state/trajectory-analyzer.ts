import type { UserTrajectory } from '@/core/contracts/state/modes'
import type { SessionEvidence } from '@/core/contracts/signals/session-evidence'
import { movingAverage, weightedAverage, calculateTrend } from '@/engine/shared'
import { TRAJECTORY_CONTRACTING_DELTA_THRESHOLD } from './config'

/**
 * Trajectory is computed over a longer window than mode (ideally 7–14 days)
 * and is entirely independent of `currentMode`.
 *
 * The composite score blends execution quality, recovery capacity, and
 * low behavioral disruption into a single longitudinal signal.
 */

const TRAJECTORY_SMOOTHING_WINDOW = 4
const TRAJECTORY_MIN_DAYS_FULL    = 7

type TrajectoryScore = { date: string; score: number }

function extractTrajectoryScores(evidence: SessionEvidence[]): TrajectoryScore[] {
  const sorted = [...evidence].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
  return sorted.map(e => {
    const { recoveryInputs, executionInputs, behavioralInputs } = e.inputs
    const recoveryComponent = weightedAverage(
      [recoveryInputs.sleepQuality, recoveryInputs.physicalEnergy, recoveryInputs.mentalClarity],
      [0.4, 0.3, 0.3],
    )
    const executionComponent = weightedAverage(
      [
        executionInputs.meaningfulAdvancementQuality,
        executionInputs.deepWorkContinuity,
        executionInputs.executionIntegrity,
      ],
      [0.35, 0.35, 0.3],
    )
    const behavioralNoise = weightedAverage(
      [behavioralInputs.fragmentationLevel, behavioralInputs.avoidancePressure],
      [0.6, 0.4],
    )
    return {
      date: e.capturedAt.slice(0, 10),
      score: weightedAverage(
        [recoveryComponent, executionComponent, 100 - behavioralNoise],
        [0.35, 0.40, 0.25],
      ),
    }
  })
}

function deduplicateByDay(scores: TrajectoryScore[]): number[] {
  const byDay = new Map<string, number>()
  for (const s of scores) byDay.set(s.date, s.score)
  return [...byDay.values()]
}

export function analyzeTrajectory(evidence: SessionEvidence[]): UserTrajectory {
  if (evidence.length === 0) return 'STABLE'

  const rawScores = extractTrajectoryScores(evidence)
  const daily     = deduplicateByDay(rawScores)

  if (daily.length < 2) return 'STABLE'

  const smoothed = movingAverage(daily, TRAJECTORY_SMOOTHING_WINDOW)
  const trend    = calculateTrend(smoothed, { stabilityThreshold: 5 })
  const recentMean =
    smoothed.slice(-3).reduce((s, v) => s + v, 0) / Math.min(3, smoothed.length)

  // With limited data, be conservative — bias toward STABLE
  const hasFullHistory = daily.length >= TRAJECTORY_MIN_DAYS_FULL

  if (trend === 'RISING') {
    if (!hasFullHistory && recentMean < 65) return 'STABLE'
    return 'EXPANDING'
  }

  if (trend === 'DECLINING') {
    // Distinguish FRAGILE (moderate decline) from CONTRACTING (steep decline)
    const firstSegMean =
      smoothed.slice(0, Math.max(1, Math.floor(smoothed.length / 3)))
        .reduce((s, v) => s + v, 0) / Math.max(1, Math.floor(smoothed.length / 3))
    const delta = recentMean - firstSegMean

    if (delta < TRAJECTORY_CONTRACTING_DELTA_THRESHOLD) return 'CONTRACTING'
    return 'FRAGILE'
  }

  // STABLE trend — maintenance at a level is not directional expansion or fragility
  return 'STABLE'
}
