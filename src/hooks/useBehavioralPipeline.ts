/**
 * useBehavioralPipeline — the sole public behavioral entry point for the UI.
 *
 * Composes the three internal sub-hooks and adds cross-cut verdicts
 * (focusMode, surfaceLevel) that would otherwise be re-derived per screen.
 * The UI imports ONLY this hook — sub-hooks are import-fenced to hooks/internal/.
 */

import { useMemo } from 'react'
import { useApp } from '@/lib/store'
import { useBehavioralState } from './internal/useBehavioralState'
import { useBehavioralTasks } from './internal/useBehavioralTasks'
import { useBehavioralInterventions } from './internal/useBehavioralInterventions'
import { densityBandToSurfaceLevel, toneToHeroTheme } from './internal/map'
import type { BehavioralView } from './internal/contracts'

export function useBehavioralPipeline(): BehavioralView {
  const pipeline = useApp((s) => s.lastPipelineResult)
  const state         = useBehavioralState()
  const tasks         = useBehavioralTasks()
  const interventions = useBehavioralInterventions()

  return useMemo((): BehavioralView => {
    const ready = !!pipeline

    const generatedAt = pipeline?.stateExplanation?.generatedAt
      ?? pipeline?.inputCollection.capturedAt
      ?? null

    return {
      ready,
      generatedAt,
      state,
      tasks,
      interventions,
      shell: {
        surfaceLevel: densityBandToSurfaceLevel(state.environment.density),
        focusMode:
          state.environment.deepWorkProtection ||
          state.execution.pacing === 'PROTECT_CONTINUITY',
      },
      heroTheme: toneToHeroTheme(state.guidance.tone),
    }
  }, [pipeline, state, tasks, interventions])
}
