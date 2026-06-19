import { useMemo } from 'react'
import { useApp } from '@/lib/store'
import { useBehavioralPipeline } from '@/hooks/useBehavioralPipeline'
import type { FocusEnvironmentView } from '@/core/contracts/focus/environment'

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

export function useFocusEnvironment(): FocusEnvironmentView {
  const focusEnv = useApp((s) => s.focusEnvironment)
  const tasks = useApp((s) => s.tasks)
  const behavioral = useBehavioralPipeline()

  return useMemo((): FocusEnvironmentView => {
    const { active, lastManualDismissAt } = focusEnv
    const mode = behavioral.state.mode
    const interventions = behavioral.interventions.active
    const primaryTask = behavioral.tasks.primaryTask
    const secondaryTask = behavioral.tasks.secondaryTask

    // --- entryAllowed ---
    const hasBurnoutBlock = interventions.some(
      (i) => i.type === 'BURNOUT_PREVENTION' && i.level >= 2,
    )
    const hasOverloadBlock = interventions.some(
      (i) => i.type === 'OVERLOAD' && i.level >= 1,
    )
    const hasRestartBlock = interventions.some(
      (i) => i.type === 'RESTART_ASSISTANCE',
    )

    let entryAllowed: boolean
    if (hasBurnoutBlock || hasOverloadBlock || hasRestartBlock) {
      entryAllowed = false
    } else {
      // A primary task must exist in all modes — focus without a task to anchor is structurally empty
      entryAllowed = primaryTask !== null
    }

    // --- entryAutoSuggested ---
    const hasDwpTrigger =
      behavioral.shell.focusMode ||
      interventions.some((i) => i.type === 'DEEP_WORK_PROTECTION')
    const hasFragmentationTrigger = interventions.some(
      (i) => i.type === 'FRAGMENTATION_REDUCTION',
    )

    const dismissedRecently =
      lastManualDismissAt !== null &&
      Date.now() - new Date(lastManualDismissAt).getTime() < FOUR_HOURS_MS

    const entryAutoSuggested =
      entryAllowed &&
      !active &&
      (hasDwpTrigger || hasFragmentationTrigger) &&
      !dismissedRecently

    // --- suppression level ---
    let suppressionLevel: FocusEnvironmentView['suppressionLevel']
    if (!active) {
      suppressionLevel = 'none'
    } else if (mode === 'RECOVERY') {
      suppressionLevel = 'full'
    } else {
      suppressionLevel = 'partial'
    }

    // --- visible tasks & hidden count ---
    const incompleteTasks = tasks.filter((t) => !t.done)

    let focusSecondaryTask: typeof secondaryTask = null
    let hiddenCount = 0

    if (active) {
      if (mode !== 'RECOVERY' && mode !== 'STABILIZING') {
        focusSecondaryTask = secondaryTask
      }

      const visibleCount = primaryTask ? (focusSecondaryTask ? 2 : 1) : 0

      hiddenCount = mode === 'RECOVERY'
        ? 0
        : Math.max(0, incompleteTasks.length - visibleCount)
    } else {
      focusSecondaryTask = secondaryTask
    }

    // heroCompressed: RECOVERY expression removes hero entirely (false = absent)
    const heroCompressed = active && mode !== 'RECOVERY'

    // level-2 interventions are held during focus, shown on exit
    const heldInterventions = active
      ? interventions.filter((i) => i.level === 2)
      : []

    return {
      active,
      entryAllowed,
      entryAutoSuggested,
      primaryTask,
      secondaryTask: focusSecondaryTask,
      hiddenCount,
      suppressionLevel,
      navigationReduced: active,
      motionReduced: active,
      heroCompressed,
      heldInterventions,
      mode,
    }
  }, [focusEnv, tasks, behavioral])
}
