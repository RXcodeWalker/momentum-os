/** Signal Engine v1 — detection thresholds and smoothing defaults. */

export const SIGNAL_ENGINE_VERSION = "v1" as const;

/** Default rolling window for temporal smoothing. */
export const DEFAULT_SMOOTHING_WINDOW = 3;

/** Minimum timeline length before any non-volatility signal may activate. */
export const MIN_TIMELINE_DAYS = 2;

/** Days of sustained evidence required before a signal activates. */
export const SUSTAINED_SIGNAL_MIN_DAYS = 2;

/** Days required for high-confidence sustained signals (e.g. recovery collapse). */
export const STRONG_SIGNAL_MIN_DAYS = 3;

/** Trend delta threshold (points) to classify RISING / DECLINING vs STABLE. */
export const TREND_STABILITY_THRESHOLD = 4;

/** Smoothed metric level thresholds (0–100). */
export const THRESHOLDS = {
  fragmentationElevated: 55,
  executionDeclining: 48,
  recoveryCollapsed: 42,
  avoidanceElevated: 58,
  deepWorkDegraded: 45,
  pacingUnstable: 50,
  volatilityElevated: 8,
  volatilityAccelerationRatio: 1.25,
} as const;
