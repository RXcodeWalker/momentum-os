export const STATE_ENGINE_VERSION = 'v1' as const

/** Rolling window for dimension smoothing (days). */
export const DIMENSION_SMOOTHING_WINDOW = 3

/** Days of evidence needed for full confidence coverage. */
export const FULL_CONFIDENCE_DAYS = 7

/** Minimum days of sustained negative evidence before RECOVERY can activate. */
export const RECOVERY_SUSTAINED_DAYS = 2

/** Minimum days of positive evidence before EXPANDING can activate. */
export const EXPANSION_SUSTAINED_DAYS = 3

/**
 * Primary dimension thresholds (all scalars 0–100).
 *
 * Directions:
 *  recoveryDebt     HIGH = worse
 *  cognitiveStrain  HIGH = worse
 *  executionStability HIGH = better
 *  emotionalFriction HIGH = worse
 */
export const THRESHOLDS = {
  // RECOVERY gate — any single factor if sustained
  recoveryDebtRecovery: 62,

  // STABILIZING gate
  recoveryDebtStabilizing: 42,
  executionStabilityFocused: 52,
  emotionalFrictionHigh: 58,

  // EXPANDING gate — ALL must be satisfied simultaneously
  expandingRecoveryDebt: 30,
  expandingCognitiveStrain: 40,
  expandingExecutionStability: 68,
  expandingEmotionalFriction: 40,
} as const

export const RISK_THRESHOLDS = {
  overload:  { moderate: 50, high: 68, critical: 82 },
  burnout:   { moderate: 45, high: 62, critical: 78 },
  avoidance: { moderate: 50, high: 65, critical: 78 },
  collapse:  { moderate: 55, high: 72, critical: 86 },
} as const

/** Neutral-healthy defaults used when evidence is absent. */
export const EVIDENCE_DEFAULTS = {
  sleepQuality: 65,
  physicalEnergy: 65,
  mentalClarity: 65,
  overwhelm: 30,
  emotionalResistance: 30,
  stressPressure: 30,
  meaningfulAdvancementQuality: 65,
  deepWorkContinuity: 65,
  executionIntegrity: 65,
  fragmentationLevel: 25,
  distractionPatterns: 25,
  avoidancePressure: 25,
  pacingQuality: 70,
} as const
