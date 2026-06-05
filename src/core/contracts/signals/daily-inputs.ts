import type { Scalar, Timestamp } from '../primitives'

export type RecoveryInputs = {
  sleepQuality: Scalar
  physicalEnergy: Scalar
  mentalClarity: Scalar
}

export type EmotionalInputs = {
  overwhelm: Scalar
  emotionalResistance: Scalar
  stressPressure: Scalar
}

export type ExecutionInputs = {
  meaningfulAdvancementQuality: Scalar
  deepWorkContinuity: Scalar
  executionIntegrity: Scalar
}

export type BehavioralInputs = {
  fragmentationLevel: Scalar
  distractionPatterns: Scalar
  avoidancePressure: Scalar
  pacingQuality: Scalar
}

/** Raw daily evidence bundle — persisted, not interpreted. */
export type DailyInputs = {
  recoveryInputs: RecoveryInputs
  emotionalInputs: EmotionalInputs
  executionInputs: ExecutionInputs
  behavioralInputs: BehavioralInputs
  capturedAt: Timestamp
  /** Optional session/check-in reference for audit. */
  sessionId?: string
}

