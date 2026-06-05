// Fix-5: recommendedReentryTask?: Task replaced with recommendedReentryTaskId?: string.
// The re-entry engine decides which task to suggest; it does not carry the full
// task intelligence contract. Domain/orchestration resolves the ID to a Task for rendering.

import type { Scalar } from '../primitives'

export type ReentryStage =
  | 'ASSESSMENT'
  | 'COMPRESSION'
  | 'MINIMUM_VIABLE_RESTART'
  | 'RHYTHM_REBUILD'
  | 'GRADUAL_EXPANSION'

export type RestartFriction =
  | 'OVERWHELM'
  | 'SHAME'
  | 'UNCERTAINTY'
  | 'EXHAUSTION'
  | 'AVOIDANCE'
  | 'COGNITIVE_CHAOS'

export type ReentryProtocol = {
  currentStage: ReentryStage
  backlogCompressionEnabled: boolean
  visibleScopeReduction: Scalar
  restartFrictionFactors: RestartFriction[]
  recommendedReentryTaskId?: string
  recoveryPriorityWeight: Scalar
  rhythmRebuildIntensity: Scalar
  // NOTE: No Task import — re-entry engine boundary enforced at contract level.
}

