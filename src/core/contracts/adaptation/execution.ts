import type { Scalar } from '../primitives'

export type PacingRecommendation =
  | 'REDUCE_LOAD'
  | 'MAINTAIN_RHYTHM'
  | 'PROTECT_CONTINUITY'
  | 'INCREASE_CHALLENGE'
  | 'COMPRESS_SCOPE'

export type ExecutionAdaptation = {
  visibleTaskLimit: number
  recommendedChallengeLevel: Scalar
  workloadCompressionRatio: Scalar
  pacingRecommendation: PacingRecommendation
  deepWorkExpectation: Scalar
  recoveryWeighting: Scalar
  advancementWeighting: Scalar
  focusProtectionStrength: Scalar
}

