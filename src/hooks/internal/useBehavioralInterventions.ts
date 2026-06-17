import { useMemo } from 'react'
import { useApp } from '@/lib/store'
import type { BehavioralPipeline } from '@/core/contracts/pipeline/behavioral-pipeline'
import type { Intervention } from '@/core/contracts/interventions/intervention'
import type { BehavioralInterventionsView, ActiveInterventionView } from './contracts'
import { interventionLevelToSurface, clampLevel } from './map'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBehavioralInterventions(): BehavioralInterventionsView {
  const pipeline = useApp((s) => s.lastPipelineResult) as BehavioralPipeline | null

  return useMemo((): BehavioralInterventionsView => {
    if (!pipeline) {
      return {
        ready:             false,
        active:            [],
        highestLevel:      0,
        restraintApplied:  false,
        ui: {
          requiresAcknowledgement: false,
          surface:                 'none',
        },
        cooldown: {
          anyOnCooldown:   false,
          nextEligibleHint: null,
        },
      }
    }

    const { interventionEvaluation } = pipeline

    // Only surface interventions at level ≥ 1 — level-0 are silent directives
    const activeRaw = interventionEvaluation.interventions.filter((i) => i.level >= 1)

    const active: ActiveInterventionView[] = activeRaw.map((i: Intervention) => ({
      id:         i.id,
      type:       i.type,
      level:      i.level,
      // interventionMessage is the engine-authored user copy; fall back to
      // behavioralObjective (also engine copy) when absent rather than
      // exposing the raw triggerReasoning array.
      message:    i.interventionMessage ?? i.behavioralObjective,
      intent:     i.emotionalGoal,
      directives: i.adaptationDirectives,
    }))

    const highestLevel = clampLevel(active.map((i) => i.level))
    const requiresAcknowledgement = active.some((i) => i.level === 3)

    return {
      ready:            true,
      active,
      highestLevel,
      restraintApplied: interventionEvaluation.restraintApplied,
      ui: {
        requiresAcknowledgement,
        surface: interventionLevelToSurface(highestLevel),
      },
      cooldown: {
        // restraintApplied covers both suppression and cooldown — it's the
        // closest signal available from the evaluation result.
        anyOnCooldown:    interventionEvaluation.restraintApplied,
        nextEligibleHint: null,
      },
    }
  }, [pipeline])
}
