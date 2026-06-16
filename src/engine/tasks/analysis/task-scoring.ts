import type { Timestamp } from '@/core/contracts/primitives'
import type { Task } from '@/core/contracts/tasks/task'
import type {
  ExecutionWeight,
  ResistanceWeight,
  TaskScore,
} from '@/core/contracts/tasks/scores'
import { weightedAverage } from '@/engine/shared'
import {
  DEFAULT_EXECUTION_QUALITY,
  DEFERRAL_PROXY_CAP,
  DEFERRAL_PROXY_PER_COUNT,
  EXECUTION_WEIGHTS,
  RESISTANCE_WEIGHTS,
} from '../config'
import { computeRecoveryBurden } from './burden-calculator'
import { clampScalar } from './types'

// ---------------------------------------------------------------------------
// Task scoring — task attributes only, no UserState, no ranking
// ---------------------------------------------------------------------------

function deferralProxy(repeatedDeferralCount: number): number {
  return clampScalar(repeatedDeferralCount * DEFERRAL_PROXY_PER_COUNT, 0, DEFERRAL_PROXY_CAP)
}

export function computeExecutionWeight(task: Task): ExecutionWeight {
  const meaningfulnessWeight = clampScalar(task.meaningfulness)
  const executionQualityWeight = clampScalar(task.executionQuality ?? DEFAULT_EXECUTION_QUALITY)
  const momentumContributionWeight = clampScalar(task.momentumContribution)
  const goalAlignmentWeight = clampScalar(task.leverageWeight)
  const recoveryCompatibilityWeight = clampScalar(task.recoveryCompatibility)

  const finalExecutionWeight = clampScalar(
    weightedAverage(
      [
        meaningfulnessWeight,
        executionQualityWeight,
        momentumContributionWeight,
        goalAlignmentWeight,
        recoveryCompatibilityWeight,
      ],
      [
        EXECUTION_WEIGHTS.meaningfulness,
        EXECUTION_WEIGHTS.executionQuality,
        EXECUTION_WEIGHTS.momentumContribution,
        EXECUTION_WEIGHTS.goalAlignment,
        EXECUTION_WEIGHTS.recoveryCompatibility,
      ],
    ),
  )

  return {
    meaningfulnessWeight,
    executionQualityWeight,
    momentumContributionWeight,
    goalAlignmentWeight,
    recoveryCompatibilityWeight,
    finalExecutionWeight,
  }
}

export function computeResistanceWeight(task: Task): ResistanceWeight {
  const emotionalResistanceWeight = clampScalar(task.emotionalResistance)
  const ambiguityWeight = clampScalar(task.ambiguity)
  const reversibilityWeight = clampScalar(task.reversibilityRisk)
  const initiationDelayWeight = clampScalar(
    task.initiationDelay ?? deferralProxy(task.repeatedDeferralCount),
  )

  const finalResistanceWeight = clampScalar(
    weightedAverage(
      [
        emotionalResistanceWeight,
        ambiguityWeight,
        reversibilityWeight,
        initiationDelayWeight,
      ],
      [
        RESISTANCE_WEIGHTS.emotionalResistance,
        RESISTANCE_WEIGHTS.ambiguity,
        RESISTANCE_WEIGHTS.reversibility,
        RESISTANCE_WEIGHTS.initiationDelay,
      ],
    ),
  )

  return {
    emotionalResistanceWeight,
    ambiguityWeight,
    reversibilityWeight,
    initiationDelayWeight,
    finalResistanceWeight,
  }
}

export function scoreTask(task: Task, evaluatedAt: Timestamp): TaskScore {
  return {
    taskId: task.id,
    execution: computeExecutionWeight(task),
    resistance: computeResistanceWeight(task),
    burden: computeRecoveryBurden(task),
    evaluatedAt,
  }
}
