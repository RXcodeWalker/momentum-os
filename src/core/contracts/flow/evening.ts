import type { Scalar } from '../primitives'
import type { UserTrajectory } from '../state/modes'
import type { BehavioralInsight } from '../pipeline/insights'

export type EveningReflectionOutput = {
  executionIntegrity: Scalar
  meaningfulProgressQuality: Scalar
  recoveryImpact: Scalar
  behavioralInsights: BehavioralInsight[]
  tomorrowOrientation?: string
  updatedTrajectory: UserTrajectory
}

