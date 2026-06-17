import { useMemo } from 'react'
import { useApp } from '@/lib/store'
import type { BehavioralPipeline } from '@/core/contracts/pipeline/behavioral-pipeline'
import type { BehavioralTasksView, ResolvedTask } from './contracts'
import { scalarToConfidence, pacingToGuidance } from './map'

const DEFAULT_VISIBLE_LIMIT = 5

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBehavioralTasks(): BehavioralTasksView {
  const pipeline = useApp((s) => s.lastPipelineResult) as BehavioralPipeline | null
  const storeTasks = useApp((s) => s.tasks)

  return useMemo((): BehavioralTasksView => {
    if (!pipeline) {
      return {
        ready:        false,
        primaryTask:  null,
        secondaryTask: null,
        sequencing: {
          rationale:           [],
          focusWindowMinutes:  null,
          confidence:          'low',
        },
        workload: {
          visibleTaskLimit: DEFAULT_VISIBLE_LIMIT,
          guidance:         'hold',
          overCapacity:     false,
        },
        visibility: {
          visibleTaskIds:     [],
          suppressedTaskIds:  [],
          compressedTaskIds:  [],
        },
      }
    }

    const { sequencingDecision: seq, adaptationGeneration } = pipeline

    // Resolve task IDs to store Task objects — this is the domain-layer
    // responsibility deferred by the sequencing contract.
    const taskById = new Map(storeTasks.map((t) => [t.id, t]))

    function resolveTask(id: string | undefined): ResolvedTask | null {
      if (!id) return null
      const t = taskById.get(id)
      if (!t) return null
      return { id: t.id, label: t.label, type: t.type, estMin: t.estMin }
    }

    const primaryTask   = resolveTask(seq.recommendedPrimaryTaskId)
    const secondaryTask = resolveTask(seq.recommendedSecondaryTaskId)

    // Validate suppressed/compressed IDs against actual store tasks
    const suppressedTaskIds = seq.suppressedTaskIds.filter((id) => taskById.has(id))
    const compressedTaskIds = seq.compressedTaskIds.filter((id) => taskById.has(id))

    // Workload
    const visibleTaskLimit = adaptationGeneration?.execution.visibleTaskLimit ?? DEFAULT_VISIBLE_LIMIT
    const pacingRec = adaptationGeneration?.execution.pacingRecommendation ?? 'MAINTAIN_RHYTHM'
    const guidance = pacingToGuidance(pacingRec)

    // Visible task list: all tasks not suppressed, up to the limit
    const suppressedSet = new Set(suppressedTaskIds)
    const visibleTaskIds = storeTasks
      .filter((t) => !suppressedSet.has(t.id))
      .slice(0, visibleTaskLimit)
      .map((t) => t.id)

    const overCapacity = storeTasks.filter((t) => !suppressedSet.has(t.id)).length > visibleTaskLimit

    return {
      ready:        true,
      primaryTask,
      secondaryTask,
      sequencing: {
        rationale:          seq.sequencingReasoning,
        focusWindowMinutes: seq.recommendedFocusWindow ?? null,
        confidence:         scalarToConfidence(seq.sequencingConfidence),
      },
      workload: {
        visibleTaskLimit,
        guidance,
        overCapacity,
      },
      visibility: {
        visibleTaskIds,
        suppressedTaskIds,
        compressedTaskIds,
      },
    }
  }, [pipeline, storeTasks])
}
