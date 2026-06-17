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
import { densityBandToSurfaceLevel } from './internal/map'
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

    // focusMode: deep work protection is active OR pacing calls for continuity
    const focusMode =
      state.environment.deepWorkProtection ||
      state.execution.pacing === 'PROTECT_CONTINUITY'

    // surfaceLevel: derived from interface density — one verdict for layout shells
    const surfaceLevel = densityBandToSurfaceLevel(state.environment.density)

    return {
      ready,
      generatedAt,
      state,
      tasks,
      interventions,
      focusMode,
      surfaceLevel,
    }
  }, [pipeline, state, tasks, interventions])
}
