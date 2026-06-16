import type { UserState } from '@/core/contracts/state/user-state'
import type { Task } from '@/core/contracts/tasks/task'
import { computeRecoveryBurden } from './burden-calculator'
import { clampScalar, type CompatibilityAssessment } from './types'

// ---------------------------------------------------------------------------
// Compatibility assessment — consumes opaque UserState scalars only
// ---------------------------------------------------------------------------

export type { CompatibilityAssessment } from './types'

export function evaluateCompatibility(task: Task, state: UserState): CompatibilityAssessment {
  const mode = state.currentMode
  const band = task.stateCompatibility[mode]
  const burden = computeRecoveryBurden(task)
  const capacity = Math.max(state.recoveryCapacity, 1)
  const burdenRelativeToCapacity = clampScalar((burden.totalBurdenScore / capacity) * 100)

  return {
    taskId: task.id,
    mode,
    band,
    burdenRelativeToCapacity,
    modeAppropriate: band !== 'HARMFUL',
  }
}
