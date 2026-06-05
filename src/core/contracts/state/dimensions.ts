import type { Scalar } from '../primitives'

export type RecoveryDebtModel = {
  sleepQuality: Scalar
  sleepConsistency: Scalar
  sustainedIntensity: Scalar
  recoveryBehaviorQuality: Scalar
  exhaustionAccumulation: Scalar
}

export type CognitiveStrainModel = {
  taskSwitchingRate: Scalar
  ambiguityExposure: Scalar
  interruptionDensity: Scalar
  activeCommitmentLoad: Scalar
  deepWorkDegradation: Scalar
}

export type ExecutionStabilityModel = {
  meaningfulCompletionIntegrity: Scalar
  rhythmConsistency: Scalar
  followThroughReliability: Scalar
  pacingStability: Scalar
  volatilityResistance: Scalar
}

export type EmotionalFrictionModel = {
  initiationResistance: Scalar
  avoidancePressure: Scalar
  perfectionismPressure: Scalar
  overwhelmWeight: Scalar
  uncertaintyResistance: Scalar
}

/** Raw dimension evidence before scalar collapse into UserState. */
export type StateDimensions = {
  recoveryDebt: RecoveryDebtModel
  cognitiveStrain: CognitiveStrainModel
  executionStability: ExecutionStabilityModel
  emotionalFriction: EmotionalFrictionModel
}

