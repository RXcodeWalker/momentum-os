import { useMemo } from 'react'
import {
  useApp,
  useExecutionScore,
  useScoreAttribution,
  useStreakContext,
} from '@/lib/store'
import type { UserMode } from '@/core/contracts/state/modes'
import type { RiskLevel } from '@/core/contracts/primitives'

export type EveningReflectionView = {
  ready: boolean
  displayMode: 'recovery' | 'stabilizing' | 'focused' | 'expanding'
  score: number
  delta: number
  observations: { text: string; code: string }[]
  hasObservations: boolean
  stateHeadline: string | null
  attribution: { label: string; value: string; baseline: string; direction: 'drag' | 'boost' | 'neutral' }[]
  northStar: string | null
  workloadGuidance: 'reduce' | 'hold' | 'expand'
  workloadMessage: string | null
  suggestedTasks: { label: string; type: string }[]
  recoveryMessage: string | null
  streakContext: { current: number; milestone: string | null } | null
}

function modeToDisplay(mode: UserMode): EveningReflectionView['displayMode'] {
  switch (mode) {
    case 'RECOVERY': return 'recovery'
    case 'STABILIZING': return 'stabilizing'
    case 'EXPANDING': return 'expanding'
    default: return 'focused'
  }
}

function deriveWorkloadGuidance(
  mode: UserMode,
  overloadRisk: RiskLevel,
): 'reduce' | 'hold' | 'expand' {
  if (mode === 'RECOVERY') return 'reduce'
  if (overloadRisk === 'HIGH' || overloadRisk === 'CRITICAL') return 'reduce'
  if (mode === 'EXPANDING' && overloadRisk === 'LOW') return 'expand'
  return 'hold'
}

function taskCapForMode(mode: UserMode): number {
  switch (mode) {
    case 'RECOVERY': return 0
    case 'STABILIZING': return 2
    default: return 3
  }
}

export function useEveningReflection(): EveningReflectionView {
  const lastReflectionResult = useApp((s) => s.lastReflectionResult)
  const lastPipelineResult = useApp((s) => s.lastPipelineResult)
  const tomorrowPlan = useApp((s) => s.tomorrowPlan)
  const history = useApp((s) => s.history)
  const score = useExecutionScore()
  const attribution = useScoreAttribution()
  const streakCtx = useStreakContext()

  return useMemo(() => {
    const ready = lastReflectionResult !== null

    // Derive pipeline mode from reflection record (most accurate) or pipeline result
    const pipelineMode: UserMode =
      lastReflectionResult?.pipelineSnapshotMode ??
      lastPipelineResult?.stateInterpretation.currentMode ??
      'FOCUSED'

    const displayMode = modeToDisplay(pipelineMode)

    // Delta vs yesterday
    const prev = history.slice(-2, -1)[0]?.executionScore ?? score
    const delta = score - prev

    // Observations from reflection engine
    const observations = (lastReflectionResult?.observations ?? []).map((o) => ({
      text: o.text,
      code: o.code,
    }))
    const hasObservations = observations.length > 0

    // State headline backstop when no observations
    const stateHeadline =
      lastPipelineResult?.stateExplanation?.primary?.observation ?? null

    // Score attribution
    const attributionRows = attribution?.deviations ?? []

    // Tomorrow orientation from existing tomorrowPlan
    const northStar = tomorrowPlan?.northStar || null
    const overloadRisk = lastPipelineResult?.stateInterpretation.overloadRisk ?? 'LOW'
    const workloadGuidance = deriveWorkloadGuidance(pipelineMode, overloadRisk)

    // workloadMessage: pipeline's primary observation; null when engine has no output yet
    const workloadMessage =
      lastPipelineResult?.stateExplanation?.primary?.observation ?? null

    // Suggested tasks capped by mode
    const cap = taskCapForMode(pipelineMode)
    const suggestedTasks = (tomorrowPlan?.suggestedTasks ?? [])
      .slice(0, cap)
      .map((t) => ({ label: t.label, type: t.type }))

    // Recovery message only in recovery mode
    const recoveryMessage =
      displayMode === 'recovery'
        ? (lastPipelineResult?.stateExplanation?.supporting?.[0]?.observation ?? null)
        : null

    // Streak context
    const streakContext =
      streakCtx.currentStreak > 0
        ? {
            current: streakCtx.currentStreak,
            milestone:
              streakCtx.milestoneNext <= 5 || streakCtx.milestoneNext <= 0
                ? streakCtx.milestoneLabel
                : null,
          }
        : null

    return {
      ready,
      displayMode,
      score,
      delta,
      observations,
      hasObservations,
      stateHeadline,
      attribution: attributionRows,
      northStar,
      workloadGuidance,
      workloadMessage,
      suggestedTasks,
      recoveryMessage,
      streakContext,
    }
  }, [lastReflectionResult, lastPipelineResult, tomorrowPlan, history, score, attribution, streakCtx])
}
