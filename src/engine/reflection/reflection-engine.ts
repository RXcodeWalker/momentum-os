import type { ReflectionOutput, ReflectionScalars } from '@/core/contracts/flow/reflection'
import type { DayData, CheckIn } from '@/lib/store'
import type { ReflectionInputBundle } from './reflection-inputs'
import { REFLECTION_CONFIG } from './reflection-config'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function computeScalars(
  checkIn: Omit<CheckIn, 'date'>,
  overridePlanned?: number,
): ReflectionScalars {
  const planned = overridePlanned !== undefined ? overridePlanned : checkIn.planned

  // Execution quality: completion ratio blended with honesty, penalized by avoidance blockers
  const completionBase = planned > 0 ? Math.min(1, checkIn.completed / planned) * 100 : 50
  const beforePenalty = completionBase * 0.6 + checkIn.honesty * 10 * 0.4
  const avoidanceCount = Object.values(checkIn.blockers).filter(
    (b) => b === 'energy' || b === 'focus',
  ).length
  const executionQuality = Math.max(0, beforePenalty - avoidanceCount * 8)

  // Pacing quality: direct focus scale
  const pacingQuality = checkIn.focus * 10

  // Fragmentation: distraction count × 18, capped at 100
  const fragmentationLevel = clamp(checkIn.distractions.length * 18, 0, 100)

  // Recovery quality: sleep normalized to 0-100, blended with energy (0-100 scale)
  const sleepQuality = clamp((checkIn.sleepHours / 8) * 100, 0, 100)
  const recoveryQuality = sleepQuality * 0.6 + checkIn.energy * 0.4

  // Emotional friction: inverted mood (0–4 scale → 0–100 friction)
  const emotionalFriction = (4 - checkIn.mood) * 25

  // Meaningful progress
  const mp = (checkIn as CheckIn & { meaningfulProgress?: 'yes' | 'partial' | 'no' })
    .meaningfulProgress
  const meaningfulProgress =
    mp === 'yes' ? 100 : mp === 'partial' ? 60 : mp === 'no' ? 25 : 50

  return {
    executionQuality: clamp(executionQuality, 0, 100),
    pacingQuality: clamp(pacingQuality, 0, 100),
    fragmentationLevel: clamp(fragmentationLevel, 0, 100),
    recoveryQuality: clamp(recoveryQuality, 0, 100),
    emotionalFriction: clamp(emotionalFriction, 0, 100),
    meaningfulProgress,
  }
}

function computeRollingAvg(checkIns: CheckIn[]): ReflectionScalars {
  const zero: ReflectionScalars = {
    executionQuality: 0,
    pacingQuality: 0,
    fragmentationLevel: 0,
    recoveryQuality: 0,
    emotionalFriction: 0,
    meaningfulProgress: 0,
  }
  if (checkIns.length === 0) return zero

  const sums = checkIns.reduce((acc, ci) => {
    const s = computeScalars(ci)
    return {
      executionQuality: acc.executionQuality + s.executionQuality,
      pacingQuality: acc.pacingQuality + s.pacingQuality,
      fragmentationLevel: acc.fragmentationLevel + s.fragmentationLevel,
      recoveryQuality: acc.recoveryQuality + s.recoveryQuality,
      emotionalFriction: acc.emotionalFriction + s.emotionalFriction,
      meaningfulProgress: acc.meaningfulProgress + s.meaningfulProgress,
    }
  }, zero)

  const n = checkIns.length
  return {
    executionQuality: sums.executionQuality / n,
    pacingQuality: sums.pacingQuality / n,
    fragmentationLevel: sums.fragmentationLevel / n,
    recoveryQuality: sums.recoveryQuality / n,
    emotionalFriction: sums.emotionalFriction / n,
    meaningfulProgress: sums.meaningfulProgress / n,
  }
}

export function evaluateReflection(
  inputs: ReflectionInputBundle,
  _history: DayData[],
  priorCheckIns: CheckIn[],
): ReflectionOutput {
  const { checkIn, completedTasks, plannedCount, historyDays } = inputs

  // Today's scalars
  const scalars = computeScalars(checkIn, plannedCount)

  // Deviations vs rolling average of last 7 prior check-ins
  const deviations: Partial<Record<keyof ReflectionScalars, number>> = {}
  if (historyDays >= REFLECTION_CONFIG.minHistoryDaysForDeviation && priorCheckIns.length >= 3) {
    const avg = computeRollingAvg(priorCheckIns.slice(-7))
    for (const key of Object.keys(scalars) as (keyof ReflectionScalars)[]) {
      deviations[key] = scalars[key] - avg[key]
    }
  }

  // Boolean flags
  const fragmentationImproved =
    (deviations.fragmentationLevel ?? 0) < REFLECTION_CONFIG.fragmentationImprovedThreshold

  // meaningfulBreakthrough: today is 100 AND prior 2 days avg < 80
  const prior2 = priorCheckIns.slice(-2)
  const prior2AvgMp =
    prior2.length > 0
      ? prior2.reduce((acc, ci) => {
          const mp = (ci as CheckIn & { meaningfulProgress?: 'yes' | 'partial' | 'no' })
            .meaningfulProgress
          return acc + (mp === 'yes' ? 100 : mp === 'partial' ? 60 : mp === 'no' ? 25 : 50)
        }, 0) / prior2.length
      : 50
  const meaningfulBreakthrough =
    scalars.meaningfulProgress === 100 &&
    prior2AvgMp < REFLECTION_CONFIG.meaningfulBreakthroughPriorMax

  const recoveryStable =
    (deviations.recoveryQuality ?? 0) > REFLECTION_CONFIG.recoveryStableThreshold

  const highResistanceCompleted =
    completedTasks.some((t) => t.type === 'deep') &&
    scalars.emotionalFriction > REFLECTION_CONFIG.emotionalFrictionHighThreshold

  const mp = (checkIn as CheckIn & { meaningfulProgress?: 'yes' | 'partial' | 'no' })
    .meaningfulProgress
  const evidenceCompleteness = mp != null ? 1.0 : 5 / 6

  return {
    scalars,
    deviations,
    fragmentationImproved,
    meaningfulBreakthrough,
    recoveryStable,
    highResistanceCompleted,
    evidenceCompleteness,
    historyDays,
    capturedAt: new Date().toISOString(),
  }
}
