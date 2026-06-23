export const TASK_INTELLIGENCE_VERSION = "v1" as const;

/** Minimum tasks required for portfolio pattern detection. */
export const MIN_PORTFOLIO_TASKS = 3;

/** Deferral count threshold for cluster and gap patterns. */
export const DEFERRAL_THRESHOLD = 2;

/** High resistance / meaningfulness cutoffs for cluster detection. */
export const HIGH_RESISTANCE_THRESHOLD = 60;
export const HIGH_MEANINGFULNESS_THRESHOLD = 65;
export const LOW_MEANINGFULNESS_THRESHOLD = 40;

/** Meaningful engagement floor — patterns suppressed when already low. */
export const LOW_MEANINGFUL_ENGAGEMENT = 40;

/** Burden relative to capacity above which tasks are compressed. */
export const BURDEN_COMPRESS_THRESHOLD = 85;

/** Burden relative to capacity above which secondary task is dropped. */
export const BURDEN_ACCUMULATION_THRESHOLD = 100;

export const EXECUTION_WEIGHTS = {
  meaningfulness: 0.3,
  executionQuality: 0.2,
  momentumContribution: 0.2,
  goalAlignment: 0.15,
  recoveryCompatibility: 0.15,
} as const;

export const RESISTANCE_WEIGHTS = {
  emotionalResistance: 0.35,
  ambiguity: 0.25,
  reversibility: 0.15,
  initiationDelay: 0.25,
} as const;

export const BURDEN_WEIGHTS = {
  cognitive: 0.4,
  depletion: 0.35,
  fragmentation: 0.25,
} as const;

/** Maps repeatedDeferralCount to a 0–100 proxy when initiationDelay is absent. */
export const DEFERRAL_PROXY_PER_COUNT = 15;
export const DEFERRAL_PROXY_CAP = 90;

/** Default execution quality when not recorded on the task. */
export const DEFAULT_EXECUTION_QUALITY = 50;

/** Mode-specific focus window defaults (minutes). */
export const FOCUS_WINDOW_BY_MODE = {
  RECOVERY: 25,
  STABILIZING: 45,
  FOCUSED: 90,
  EXPANDING: 75,
} as const;

/** Deep work compatibility threshold for FOCUSED prioritization. */
export const DEEP_WORK_PRIORITY_THRESHOLD = 60;

/** Avoidance-related signals from Signal Engine — portfolio confidence capped when absent. */
export const AVOIDANCE_RELATED_SIGNALS = [
  "AVOIDANCE_CLUSTERING",
  "MEANINGFULNESS_DEFERRAL",
  "PLANNING_ESCAPE",
] as const;
