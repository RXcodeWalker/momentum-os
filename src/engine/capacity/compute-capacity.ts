/**
 * Capacity primitive — the single authority for "how much can this day hold".
 *
 * Per the Phase 6 Ownership Matrix (#4), Capacity/Load had three independent
 * computations (`useTaskIntelligence` today-horizon, `useWeeklyAdaptation`
 * week-horizon via `buildBaseCapacities`, and the expansion engine). They could
 * disagree — Today saying "optimal" while Weekly said "overloaded" for the same
 * day. This module is the one place the score→capacity mapping lives; each
 * consumer applies it to its own horizon.
 *
 * This is pure: it derives capacity from an execution-score baseline and a
 * recovery flag, and computes no other behavioral judgment.
 */

export type DayCapacityResult = {
  /** Max total tasks the day can hold. */
  taskCap: number;
  /** Max deep-work tasks within that cap. */
  deepWorkCap: number;
};

/**
 * Map a representative execution score for a day to a task / deep-work cap.
 * This is the canonical score→capacity ladder used everywhere caps are derived.
 */
export function computeCapacity(
  /** Representative execution score for the day (0–100). */
  avgScore: number,
  opts: {
    /** Recovery hysteresis state — compresses the day to a minimum-viable cap. */
    recoveryMode?: boolean;
    /** W14 recovery-debt accumulating — applies a mid-week buffer when set. */
    recoveryDebt?: boolean;
    /** Whether this day is the mid-week buffer day (Wednesday). */
    isBufferDay?: boolean;
  } = {},
): DayCapacityResult {
  if (opts.recoveryMode) {
    return { taskCap: 1, deepWorkCap: 0 };
  }

  let taskCap = avgScore >= 70 ? 4 : avgScore >= 60 ? 3 : avgScore >= 50 ? 2 : 1;
  let deepWorkCap = avgScore >= 70 ? 3 : avgScore >= 60 ? 2 : avgScore >= 50 ? 1 : 0;

  if (opts.recoveryDebt && opts.isBufferDay) {
    taskCap = Math.min(taskCap, 2);
    deepWorkCap = Math.min(deepWorkCap, 1);
  }

  return { taskCap, deepWorkCap };
}

/**
 * Convert a task cap to an estimated minute budget for the day, using the
 * standard per-task block. Used by the today-horizon load-risk check so that
 * "load" is expressed in the same capacity currency as the weekly view.
 */
export function capacityToMinutes(taskCap: number, minutesPerTask = 45): number {
  return taskCap * minutesPerTask;
}

/** Classify a day's planned minutes against its capacity budget. */
export function classifyLoad(
  plannedMinutes: number,
  capacityMinutes: number,
): "overloaded" | "optimal" | "underloaded" {
  if (capacityMinutes <= 0) return "optimal";
  if (plannedMinutes > capacityMinutes * 1.4) return "overloaded";
  if (plannedMinutes < capacityMinutes * 0.5) return "underloaded";
  return "optimal";
}
