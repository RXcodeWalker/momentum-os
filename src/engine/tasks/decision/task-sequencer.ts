import type { Scalar } from '@/core/contracts/primitives'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { Task } from '@/core/contracts/tasks/task'
import type { TaskEvaluation } from '@/core/contracts/tasks/scores'
import {
  BURDEN_ACCUMULATION_THRESHOLD,
  BURDEN_COMPRESS_THRESHOLD,
  DEEP_WORK_PRIORITY_THRESHOLD,
  FOCUS_WINDOW_BY_MODE,
} from '../config'
import {
  bandToScalar,
  clampScalar,
  type CompatibilityAssessment,
  type SequencingSuitability,
} from '../analysis/types'
import type { SequencingContext } from './sequencing-context'

// ---------------------------------------------------------------------------
// Decision layer — sole authority for ranking, suppression, and compression
// ---------------------------------------------------------------------------

function findTask(tasks: Task[], id: string): Task | undefined {
  return tasks.find(t => t.id === id)
}

function findEvaluation(
  evaluations: TaskEvaluation[],
  id: string,
): TaskEvaluation | undefined {
  return evaluations.find(e => e.task.id === id)
}

function findCompatibility(
  compatibilities: CompatibilityAssessment[],
  id: string,
): CompatibilityAssessment | undefined {
  return compatibilities.find(c => c.taskId === id)
}

function computeSuitability(
  task: Task,
  evaluation: TaskEvaluation,
  compatibility: CompatibilityAssessment,
  context: SequencingContext,
): Scalar {
  const { state, portfolioObservation } = context
  const mode = state.currentMode
  const execution = evaluation.score.execution.finalExecutionWeight
  const resistance = evaluation.score.resistance.finalResistanceWeight
  const burden = evaluation.score.burden.totalBurdenScore
  const bandScalar = bandToScalar(compatibility.band)

  let suitability = execution - resistance * 0.4 - burden * 0.25 + bandScalar * 0.3

  switch (mode) {
    case 'RECOVERY':
      suitability += task.recoveryCompatibility * 0.35
      suitability -= compatibility.burdenRelativeToCapacity * 0.3
      suitability += task.meaningfulness * 0.1
      break
    case 'STABILIZING':
      suitability += (100 - evaluation.score.resistance.ambiguityWeight) * 0.2
      suitability += (100 - resistance) * 0.15
      if (task.category === 'MAINTENANCE') suitability += 15
      break
    case 'FOCUSED':
      suitability += task.deepWorkCompatibility * 0.3
      suitability += task.meaningfulness * 0.2
      suitability += task.leverageWeight * 0.15
      suitability -= task.fragmentationRisk * 0.2
      break
    case 'EXPANDING':
      if (task.category === 'GROWTH' || task.category === 'ADVANCEMENT') suitability += 20
      suitability += task.cognitiveLoad * 0.15
      suitability += task.leverageWeight * 0.2
      suitability += state.expansionReadiness * 0.1
      break
  }

  if (portfolioObservation.patterns.includes('MAINTENANCE_ADVANCEMENT_GAP')) {
    if (
      task.category === 'ADVANCEMENT' &&
      task.repeatedDeferralCount >= 2
    ) {
      suitability -= 35
    }
    if (task.category === 'MAINTENANCE') {
      suitability += 10
    }
  }

  if (portfolioObservation.patterns.includes('SUPPORT_ADVANCEMENT_GAP')) {
    if (task.category === 'SUPPORT') {
      suitability -= 20
    }
    if (
      task.category === 'ADVANCEMENT' &&
      task.repeatedDeferralCount >= 2
    ) {
      suitability -= 15
    }
  }

  if (portfolioObservation.patterns.includes('HIGH_RESISTANCE_DEFERRAL_CLUSTER')) {
    if (
      task.emotionalResistance >= 60 &&
      task.meaningfulness >= 65 &&
      task.repeatedDeferralCount >= 2
    ) {
      suitability -= 25
    }
  }

  if (portfolioObservation.patterns.includes('LOW_VALUE_TASK_CLUSTER')) {
    if (task.meaningfulness < 40) {
      suitability -= 20
    }
  }

  if (state.avoidanceRisk === 'HIGH' || state.avoidanceRisk === 'CRITICAL') {
    if (resistance >= 60) suitability -= 15
  }

  if (state.currentTrajectory === 'CONTRACTING' && mode === 'EXPANDING') {
    suitability -= 10
  }

  return clampScalar(suitability)
}

function rankTasks(context: SequencingContext): SequencingSuitability[] {
  const eligible = context.tasks.filter(task => {
    const compat = findCompatibility(context.compatibilities, task.id)
    return compat?.modeAppropriate ?? false
  })

  return eligible
    .map(task => {
      const evaluation = findEvaluation(context.evaluations, task.id)!
      const compatibility = findCompatibility(context.compatibilities, task.id)!
      return {
        taskId: task.id,
        suitability: computeSuitability(task, evaluation, compatibility, context),
      }
    })
    .sort((a, b) => b.suitability - a.suitability)
}

function collectSuppressed(context: SequencingContext): string[] {
  return context.compatibilities
    .filter(c => !c.modeAppropriate)
    .map(c => c.taskId)
}

function collectCompressed(context: SequencingContext): string[] {
  return context.compatibilities
    .filter(
      c =>
        c.modeAppropriate &&
        c.burdenRelativeToCapacity >= BURDEN_COMPRESS_THRESHOLD,
    )
    .map(c => c.taskId)
}

function computeImpacts(
  primaryId: string | undefined,
  secondaryId: string | undefined,
  context: SequencingContext,
): { recovery: Scalar; momentum: Scalar } {
  let recovery = 0
  let momentum = 0

  for (const id of [primaryId, secondaryId].filter(Boolean) as string[]) {
    const task = findTask(context.tasks, id)
    const evaluation = findEvaluation(context.evaluations, id)
    if (!task || !evaluation) continue
    recovery += evaluation.score.burden.totalBurdenScore * 0.5
    momentum += task.momentumContribution * 0.5
  }

  return { recovery: clampScalar(recovery), momentum: clampScalar(momentum) }
}

function resolveFocusWindow(
  primaryId: string | undefined,
  context: SequencingContext,
): number | undefined {
  const mode = context.state.currentMode
  const defaultWindow = FOCUS_WINDOW_BY_MODE[mode]

  if (!primaryId) return undefined
  const task = findTask(context.tasks, primaryId)
  if (task?.estimatedDuration) return task.estimatedDuration

  return defaultWindow
}

function computeSequencingConfidence(context: SequencingContext): Scalar {
  const stateConfidence = context.state.confidence.score
  const portfolioFactor =
    context.portfolioObservation.confidenceBand === 'HIGH' ? 15
    : context.portfolioObservation.confidenceBand === 'MEDIUM' ? 8
    : 0
  const taskFactor = Math.min(context.tasks.length * 3, 15)
  return clampScalar(stateConfidence * 0.6 + portfolioFactor + taskFactor)
}

export function sequenceTasks(context: SequencingContext): Omit<SequencingDecision, 'reasoningTrace' | 'sequencingReasoning'> {
  const suppressedTaskIds = collectSuppressed(context)
  const compressedTaskIds = collectCompressed(context)
  const ranked = rankTasks(context)

  let recommendedPrimaryTaskId = ranked[0]?.taskId
  let recommendedSecondaryTaskId: string | undefined

  if (recommendedPrimaryTaskId) {
    const primaryCompat = findCompatibility(context.compatibilities, recommendedPrimaryTaskId)
    const primaryBurden = primaryCompat?.burdenRelativeToCapacity ?? 0

    const secondaryCandidate = ranked.find(
      r =>
        r.taskId !== recommendedPrimaryTaskId &&
        !compressedTaskIds.includes(r.taskId),
    )

    if (secondaryCandidate) {
      const secondaryCompat = findCompatibility(
        context.compatibilities,
        secondaryCandidate.taskId,
      )
      const accumulated =
        primaryBurden + (secondaryCompat?.burdenRelativeToCapacity ?? 0)

      if (accumulated <= BURDEN_ACCUMULATION_THRESHOLD) {
        recommendedSecondaryTaskId = secondaryCandidate.taskId
      } else {
        compressedTaskIds.push(secondaryCandidate.taskId)
      }
    }
  }

  // FOCUSED: prefer deep-work candidate if top pick lacks deep work fit
  if (context.state.currentMode === 'FOCUSED' && recommendedPrimaryTaskId) {
    const primary = findTask(context.tasks, recommendedPrimaryTaskId)
    if (primary && primary.deepWorkCompatibility < DEEP_WORK_PRIORITY_THRESHOLD) {
      const deepWorkPick = ranked.find(r => {
        const t = findTask(context.tasks, r.taskId)
        return t && t.deepWorkCompatibility >= DEEP_WORK_PRIORITY_THRESHOLD
      })
      if (deepWorkPick) {
        recommendedSecondaryTaskId = recommendedPrimaryTaskId
        recommendedPrimaryTaskId = deepWorkPick.taskId
      }
    }
  }

  const impacts = computeImpacts(
    recommendedPrimaryTaskId,
    recommendedSecondaryTaskId,
    context,
  )

  return {
    recommendedPrimaryTaskId,
    recommendedSecondaryTaskId,
    suppressedTaskIds,
    compressedTaskIds: [...new Set(compressedTaskIds)],
    expectedRecoveryImpact: impacts.recovery,
    expectedMomentumImpact: impacts.momentum,
    recommendedFocusWindow: resolveFocusWindow(recommendedPrimaryTaskId, context),
    sequencingConfidence: computeSequencingConfidence(context),
  }
}
