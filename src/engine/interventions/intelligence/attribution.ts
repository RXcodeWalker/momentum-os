import type {
  InterventionOutcomeRecord,
  OutcomeAttribution,
  ConfounderFlag,
  AttributionVerdict,
} from "@/core/contracts/interventions/intelligence";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import type { DayData } from "@/lib/store";
import type { CheckIn } from "@/lib/store";

// ---------------------------------------------------------------------------
// Attribution — confounder scan → OutcomeAttribution. Pure, no I/O.
// Default to UNATTRIBUTABLE; attribute only when no hard confounder present.
// ---------------------------------------------------------------------------

const MIN_POST_CHECKINS = 3;
/** Improvement threshold above which verdict is IMPROVED (percentage points or score pts). */
const IMPROVEMENT_THRESHOLD = 3;
/** Sleep shift threshold in hours that constitutes an external driver. */
const SLEEP_SHIFT_THRESHOLD_H = 1.5;
/** Regression-to-mean: if pre-fire baseline is this many points below 28d mean, RTM likely. */
const REGRESSION_Z_THRESHOLD = 10; // ~1 SD proxy in score points

function isoToMs(iso: string): number {
  return new Date(iso).getTime();
}

function dayMs(dateStr: string): number {
  return new Date(dateStr).getTime();
}

/** Returns true if the outcome window straddles a Saturday or Sunday. */
function detectWeekendBoundary(firedAt: string, windowDays: number): boolean {
  const startMs = isoToMs(firedAt);
  for (let d = 0; d <= windowDays; d++) {
    const dow = new Date(startMs + d * 86400000).getDay();
    if (dow === 0 || dow === 6) return true;
  }
  return false;
}

/** Returns true if another intervention fired inside the window. */
function detectConcurrentIntervention(
  record: InterventionOutcomeRecord,
  auditRecords: InterventionAuditRecord[],
): boolean {
  const fireMs = isoToMs(record.firedAt);
  const windowEndMs = fireMs + record.windowDays * 24 * 60 * 60 * 1000;
  return auditRecords.some((a) => {
    if (a.interventionId === record.outcomeId) return false; // same intervention
    const aMs = isoToMs(a.firedAt);
    return aMs > fireMs && aMs <= windowEndMs;
  });
}

/** Returns true if avg sleep shifted > SLEEP_SHIFT_THRESHOLD_H between pre and post window. */
function detectSleepShift(record: InterventionOutcomeRecord, history: DayData[]): boolean {
  const fireMs = isoToMs(record.firedAt);
  const preWindow = history.filter((d) => {
    const dMs = dayMs(d.date);
    return dMs < fireMs && dMs >= fireMs - 3 * 86400000;
  });
  const postWindow = history.filter((d) => {
    const dMs = dayMs(d.date);
    return dMs > fireMs && dMs <= fireMs + record.windowDays * 86400000;
  });
  if (preWindow.length === 0 || postWindow.length === 0) return false;
  const preAvg = preWindow.reduce((s, d) => s + d.sleepHours, 0) / preWindow.length;
  const postAvg = postWindow.reduce((s, d) => s + d.sleepHours, 0) / postWindow.length;
  return Math.abs(postAvg - preAvg) > SLEEP_SHIFT_THRESHOLD_H;
}

/**
 * Returns true if pre-fire baseline was far below the user's own 28d mean.
 * In that case, improvement is expected regardless of intervention.
 */
function detectRegressionToMean(record: InterventionOutcomeRecord, history: DayData[]): boolean {
  const fireMs = isoToMs(record.firedAt);
  const last28 = history.filter((d) => {
    const dMs = dayMs(d.date);
    return dMs < fireMs && dMs >= fireMs - 28 * 86400000;
  });
  if (last28.length < 7) return false; // not enough data to compute mean
  // Only meaningful for EXECUTION_SCORE target metric
  if (record.targetMetricId !== "EXECUTION_SCORE") return false;
  const mean28 = last28.reduce((s, d) => s + d.executionScore, 0) / last28.length;
  return record.baselineValue < mean28 - REGRESSION_Z_THRESHOLD;
}

/** Returns true if recovery mode was active during any day in the window. */
function detectRecoveryModeOverlap(
  record: InterventionOutcomeRecord,
  history: DayData[],
  checkIns: CheckIn[],
): boolean {
  const fireMs = isoToMs(record.firedAt);
  const windowEndMs = fireMs + record.windowDays * 86400000;
  // Recovery days are tracked in DayData.recovery field
  return (
    history.some((d) => {
      const dMs = dayMs(d.date);
      return dMs > fireMs && dMs <= windowEndMs && d.recovery;
    }) ||
    checkIns.some((c) => {
      const cMs = dayMs(c.date);
      return cMs > fireMs && cMs <= windowEndMs && c.meaningfulProgress === "no";
    })
  );
}

function directionalVerdict(delta: number): Exclude<AttributionVerdict, "UNATTRIBUTABLE"> {
  if (delta >= IMPROVEMENT_THRESHOLD) return "IMPROVED";
  if (delta <= -IMPROVEMENT_THRESHOLD) return "WORSENED";
  return "NEUTRAL";
}

/**
 * Scan for confounders and produce an OutcomeAttribution.
 * Hard confounders → UNATTRIBUTABLE. Soft confounders recorded for transparency.
 */
export function computeAttribution(
  record: InterventionOutcomeRecord,
  history: DayData[],
  checkIns: CheckIn[],
  auditRecords: InterventionAuditRecord[],
): OutcomeAttribution {
  const hardConfounders: ConfounderFlag[] = [];
  const softConfounders: ConfounderFlag[] = [];

  // Hard gate: insufficient post data
  if (record.postCheckInCount < MIN_POST_CHECKINS) {
    hardConfounders.push("INSUFFICIENT_POSTDATA");
    return {
      verdict: "UNATTRIBUTABLE",
      hardConfounders,
      softConfounders,
      basis: `Only ${record.postCheckInCount} post-fire check-ins (minimum ${MIN_POST_CHECKINS} required).`,
    };
  }

  if (detectConcurrentIntervention(record, auditRecords)) {
    hardConfounders.push("CONCURRENT_INTERVENTION");
  }
  if (detectWeekendBoundary(record.firedAt, record.windowDays)) {
    hardConfounders.push("WEEKEND_BOUNDARY");
  }
  if (detectSleepShift(record, history)) {
    hardConfounders.push("SLEEP_SHIFT");
  }
  if (detectRegressionToMean(record, history)) {
    hardConfounders.push("REGRESSION_TO_MEAN");
  }
  if (detectRecoveryModeOverlap(record, history, checkIns)) {
    softConfounders.push("RECOVERY_MODE_OVERLAP");
  }

  if (hardConfounders.length > 0) {
    return {
      verdict: "UNATTRIBUTABLE",
      hardConfounders,
      softConfounders,
      basis: `Hard confounders detected: ${hardConfounders.join(", ")}. Outcome excluded from effectiveness scoring.`,
    };
  }

  const delta = record.outcomeDelta ?? 0;
  const verdict = directionalVerdict(delta);
  const softNote =
    softConfounders.length > 0
      ? ` Soft confounders present (${softConfounders.join(", ")}) but not disqualifying.`
      : "";

  return {
    verdict,
    hardConfounders: [],
    softConfounders,
    basis: `Delta ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} on ${record.targetMetricId} over ${record.windowDays}d window.${softNote}`,
  };
}
