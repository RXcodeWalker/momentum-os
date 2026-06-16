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
  recoveryDebtRecovery: 55,

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

/**
 * Sleep quality floor below which exhaustion accumulates across the trailing window.
 * Intentionally below EVIDENCE_DEFAULTS.sleepQuality to detect early fatigue drift.
 */
export const EXHAUSTION_SLEEP_FLOOR = 55

/** Scale factor converting accumulated sleep deficit into an exhaustion scalar. */
export const EXHAUSTION_SCALE_FACTOR = 200

/** Amplifies expansion readiness when all dimension gates are satisfied. */
export const EXPANSION_READINESS_AMPLIFIER = 150

/** Converts mean day-to-day behavioral variation into a 0–100 volatility scalar. */
export const VOLATILITY_SCALE_FACTOR = 4

/**
 * Trajectory delta threshold separating CONTRACTING from FRAGILE.
 * If recentMean - firstSegmentMean < this value, trajectory is CONTRACTING.
 * More moderate declines classify as FRAGILE.
 */
export const TRAJECTORY_CONTRACTING_DELTA_THRESHOLD = -20

/**
 * Hysteresis band for RECOVERY mode exit.
 * When previousMode === 'RECOVERY', the RECOVERY gate re-triggers only when
 * recoveryDebt >= (recoveryDebtRecovery - RECOVERY_EXIT_HYSTERESIS_BAND).
 * This prevents rapid RECOVERY↔STABILIZING oscillation on day-to-day debt swings.
 */
export const RECOVERY_EXIT_HYSTERESIS_BAND = 8

/** State confidence band cutoffs (0–100 composite score). */
export const CONFIDENCE_BAND_HIGH_THRESHOLD = 70
export const CONFIDENCE_BAND_MEDIUM_THRESHOLD = 42

/** Transition confidence priors — anchored at mode gate thresholds, not arbitrary offsets. */
export const TRANSITION_CONFIDENCE = {
  /** Confidence score when dimension sits exactly at the mode gate threshold. */
  atThreshold: 50,
  /** Points added per scalar point above/below the gate threshold. */
  perPointMultiplier: 2,
  stabilizingBase: 55,
  focusedBase: 60,
  maxDurationBoost: 20,
  durationBoostPerDay: 5,
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
