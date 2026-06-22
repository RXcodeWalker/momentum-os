import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type {
  InterventionFatigueSignal,
  FatigueLevel,
  TypeEffectiveness,
} from "@/core/contracts/interventions/intelligence";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";

// ---------------------------------------------------------------------------
// User Fatigue Detection — distinct from firing-rate fatigue (hard-rules.ts).
// Detects repeated exposure without behavioral change.
// ---------------------------------------------------------------------------

/**
 * Trailing window (days) for acknowledgement-without-improvement analysis.
 * Must be long enough to accumulate multiple fires but not so long that old
 * behavior is still influencing the signal.
 */
const FATIGUE_WINDOW_DAYS = 21;
/** Fires in window without any IMPROVED outcome → repetition exposure signal. */
const REPETITION_THRESHOLD = 3;
/** Minimum fires to detect responsiveness decay. */
const DECAY_MIN_FIRES = 4;

function dayMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/** Fires of this type within the trailing window. */
function recentFires(
  type: ActiveInterventionType,
  auditRecords: InterventionAuditRecord[],
  nowMs: number,
): InterventionAuditRecord[] {
  const cutoff = nowMs - dayMs(FATIGUE_WINDOW_DAYS);
  return auditRecords.filter((r) => r.type === type && new Date(r.firedAt).getTime() >= cutoff);
}

/**
 * Acknowledgement-without-improvement: type was acknowledged multiple times
 * but effectiveness verdict shows no improvement.
 */
function detectAckWithoutImprovement(
  type: ActiveInterventionType,
  fires: InterventionAuditRecord[],
  effectiveness: TypeEffectiveness | undefined,
): boolean {
  if (fires.length < 2) return false;
  if (!effectiveness) return false;
  return (
    (effectiveness.verdict === "NOT_WORKING" || effectiveness.verdict === "NEUTRAL") &&
    fires.length >= REPETITION_THRESHOLD
  );
}

/**
 * Repetition exposure: same type fired N times in window with zero IMPROVED attributable outcomes.
 */
function detectRepetitionExposure(
  fires: InterventionAuditRecord[],
  effectiveness: TypeEffectiveness | undefined,
): boolean {
  if (fires.length < REPETITION_THRESHOLD) return false;
  if (!effectiveness || effectiveness.verdict === "INSUFFICIENT_EVIDENCE") return false;
  const hasImproved =
    effectiveness.signAgreementRate !== null && effectiveness.signAgreementRate > 0;
  return !hasImproved;
}

/**
 * Responsiveness decay: outcome deltas trending toward zero across successive fires.
 * Requires enough attributable outcomes to compute a trend.
 * Simple heuristic: median delta is near zero and we have HIGH confidence → plateau.
 */
function detectResponsivenessDecay(effectiveness: TypeEffectiveness | undefined): boolean {
  if (!effectiveness) return false;
  if (effectiveness.confidence !== "HIGH") return false;
  if (effectiveness.medianDelta === null) return false;
  return Math.abs(effectiveness.medianDelta) < 2; // near-zero delta at high confidence
}

function aggregateFatigueLevel(signals: boolean[]): FatigueLevel {
  const count = signals.filter(Boolean).length;
  if (count === 0) return "NONE";
  if (count === 1) return "EMERGING";
  return "HIGH";
}

/**
 * Compute the fatigue signal for a single intervention type.
 */
export function computeFatigueSignal(
  type: ActiveInterventionType,
  auditRecords: InterventionAuditRecord[],
  effectiveness: TypeEffectiveness | undefined,
  nowMs: number,
): InterventionFatigueSignal {
  const fires = recentFires(type, auditRecords, nowMs);
  const basis: string[] = [];

  const ackWithoutImprovement = detectAckWithoutImprovement(type, fires, effectiveness);
  const repetitionExposure = detectRepetitionExposure(fires, effectiveness);
  const responsivenesDecay = detectResponsivenessDecay(effectiveness);

  if (ackWithoutImprovement) {
    basis.push(
      `Fired ${fires.length}× in last ${FATIGUE_WINDOW_DAYS}d with ${effectiveness?.verdict ?? "no improvement"} verdict.`,
    );
  }
  if (repetitionExposure) {
    basis.push(`Repeated ${fires.length}× without any attributable improvement.`);
  }
  if (responsivenesDecay) {
    basis.push("High-confidence near-zero delta — responsiveness plateau detected.");
  }

  return {
    type,
    level: aggregateFatigueLevel([ackWithoutImprovement, repetitionExposure, responsivenesDecay]),
    basis,
  };
}

/**
 * Compute fatigue signals for all active types.
 */
export function computeAllFatigue(
  auditRecords: InterventionAuditRecord[],
  effectiveness: TypeEffectiveness[],
  nowMs: number,
): InterventionFatigueSignal[] {
  const types: ActiveInterventionType[] = [
    "BURNOUT_PREVENTION",
    "RECOVERY_ENFORCEMENT",
    "OVERLOAD",
    "AVOIDANCE_INTERRUPTION",
    "FRAGMENTATION_REDUCTION",
    "DEEP_WORK_PROTECTION",
    "RESTART_ASSISTANCE",
  ];
  return types.map((type) => {
    const eff = effectiveness.find((e) => e.type === type);
    return computeFatigueSignal(type, auditRecords, eff, nowMs);
  });
}
