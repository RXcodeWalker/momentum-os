export const REFLECTION_CONFIG = {
  // Deviation thresholds for boolean flags
  fragmentationImprovedThreshold: -12,
  recoveryStableThreshold: 8,
  emotionalFrictionReducedThreshold: -15,
  pacingProtectionThreshold: 10,

  // Scalar thresholds for observation eligibility
  executionQualityGoodThreshold: 70,
  fragmentationLowThreshold: 40,
  emotionalFrictionHighThreshold: 45,
  emotionalFrictionLowThreshold: 25,   // mood >= 3 equivalent
  meaningfulBreakthroughPriorMax: 80,

  // Minimum history for deviation computation and confidence
  minHistoryDaysForDeviation: 3,
  minHistoryDaysForObservations: 7,
  minHistoryDaysForSomeRules: 5,       // used by FRAGMENTATION, EMOTIONAL_FRICTION rules

  // Confidence completeness thresholds
  minCompletenessForMedium: 0.6,
  minCompletenessForHigh: 0.8,

  // Deviation magnitude thresholds
  minDeviationMagnitudeForMedium: 5,
  minDeviationMagnitudeForHigh: 10,

  // Suppression
  repetitionSuppressionWindow: 3,
  maxObservations: 2,
} as const
