import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type {
  InterventionOutcomeRecord,
  TargetMetricId,
} from "@/core/contracts/interventions/intelligence";
import type { DayData } from "@/lib/store";
import type { CheckIn } from "@/lib/store";

// ---------------------------------------------------------------------------
// Outcome Measurement — pure functions, no I/O.
// Computes baseline and post-window values from history + check-in arrays.
// ---------------------------------------------------------------------------

/** Per-type measurement config: which metric to track and how long the window is. */
const OUTCOME_CONFIG: Record<
  ActiveInterventionType,
  { targetMetricId: TargetMetricId; windowDays: number }
> = {
  BURNOUT_PREVENTION: { targetMetricId: "EXECUTION_SCORE", windowDays: 7 },
  RECOVERY_ENFORCEMENT: { targetMetricId: "EXECUTION_SCORE", windowDays: 5 },
  OVERLOAD: { targetMetricId: "FRAGMENTATION_SIGNAL", windowDays: 3 },
  AVOIDANCE_INTERRUPTION: { targetMetricId: "AVOIDANCE_SIGNAL", windowDays: 4 },
  FRAGMENTATION_REDUCTION: { targetMetricId: "FRAGMENTATION_SIGNAL", windowDays: 3 },
  DEEP_WORK_PROTECTION: { targetMetricId: "DEEP_WORK_SIGNAL", windowDays: 2 },
  RESTART_ASSISTANCE: { targetMetricId: "EXECUTION_SCORE", windowDays: 3 },
};

export function getOutcomeConfig(type: ActiveInterventionType): {
  targetMetricId: TargetMetricId;
  windowDays: number;
} {
  return OUTCOME_CONFIG[type];
}

/**
 * Extract the target metric value from a single DayData entry.
 * For signal-strength metrics (FRAGMENTATION, AVOIDANCE, DEEP_WORK), we derive a proxy
 * from DayData fields. Lower values = better for signal metrics (signal weakening = improvement).
 */
export function extractMetricValue(
  day: DayData,
  checkIns: CheckIn[],
  metricId: TargetMetricId,
): number {
  const checkIn = checkIns.find((c) => c.date === day.date);

  switch (metricId) {
    case "EXECUTION_SCORE":
      return day.executionScore;

    case "FRAGMENTATION_SIGNAL": {
      // Higher distractions + lower focus = stronger fragmentation signal (worse)
      const focusNorm = day.focus / 10; // 0–1, higher = better
      const distractNorm = Math.min(day.distractions / 10, 1); // 0–1, higher = worse
      return Math.round((distractNorm * 0.6 + (1 - focusNorm) * 0.4) * 100);
    }

    case "AVOIDANCE_SIGNAL": {
      // Low completion ratio = stronger avoidance signal (worse)
      const ratio = day.planned > 0 ? day.completed / day.planned : 0;
      return Math.round((1 - ratio) * 100);
    }

    case "DEEP_WORK_SIGNAL": {
      // Low focus = stronger deep-work degradation signal (worse)
      return Math.round((1 - day.focus / 10) * 100);
    }

    case "COMPLETION_RATIO": {
      return day.planned > 0 ? Math.round((day.completed / day.planned) * 100) : 0;
    }

    case "FOCUS": {
      return checkIn?.focus ?? day.focus;
    }
  }
}

/**
 * Compute trailing 3-day average of targetMetric at fire time.
 * Uses history days strictly before firedAt (not including the fire day itself).
 */
export function computeBaseline(
  type: ActiveInterventionType,
  firedAt: string,
  history: DayData[],
  checkIns: CheckIn[],
): number {
  const { targetMetricId } = OUTCOME_CONFIG[type];
  const fireMs = new Date(firedAt).getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  const recent = history
    .filter((d) => {
      const dMs = new Date(d.date).getTime();
      return dMs < fireMs && dMs >= fireMs - threeDaysMs;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (recent.length === 0) return 0;
  const sum = recent.reduce((acc, d) => acc + extractMetricValue(d, checkIns, targetMetricId), 0);
  return sum / recent.length;
}

/**
 * Compute avg of targetMetric for check-ins that fall within [firedAt, firedAt + windowDays].
 * Returns { value, count } where count drives the UNMEASURABLE gate.
 */
export function computePostWindowValue(
  type: ActiveInterventionType,
  firedAt: string,
  history: DayData[],
  checkIns: CheckIn[],
): { value: number | null; count: number } {
  const { targetMetricId, windowDays } = OUTCOME_CONFIG[type];
  const fireMs = new Date(firedAt).getTime();
  const windowEndMs = fireMs + windowDays * 24 * 60 * 60 * 1000;

  const inWindow = history.filter((d) => {
    const dMs = new Date(d.date).getTime();
    return dMs > fireMs && dMs <= windowEndMs;
  });

  // Filter to days that have a corresponding check-in (real data, not just history entries)
  const withCheckIn = inWindow.filter((d) => checkIns.some((c) => c.date === d.date));

  if (withCheckIn.length === 0) return { value: null, count: 0 };

  const sum = withCheckIn.reduce(
    (acc, d) => acc + extractMetricValue(d, checkIns, targetMetricId),
    0,
  );
  return { value: sum / withCheckIn.length, count: withCheckIn.length };
}

/**
 * Build a new PENDING InterventionOutcomeRecord to write at fire time.
 * Post-window values are null until reconciliation.
 */
export function buildPendingOutcomeRecord(
  outcomeId: string,
  type: ActiveInterventionType,
  firedAt: string,
  history: DayData[],
  checkIns: CheckIn[],
): InterventionOutcomeRecord {
  const { targetMetricId, windowDays } = OUTCOME_CONFIG[type];
  const baselineValue = computeBaseline(type, firedAt, history, checkIns);
  const expiresAt = new Date(new Date(firedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    outcomeId,
    type,
    firedAt,
    targetMetricId,
    baselineValue,
    postWindowValue: null,
    outcomeDelta: null,
    windowDays,
    postCheckInCount: 0,
    status: "PENDING",
    finalizedAt: null,
    attribution: null,
    expiresAt,
  };
}
