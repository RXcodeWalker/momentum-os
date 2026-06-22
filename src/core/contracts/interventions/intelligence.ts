import type { Timestamp } from "../primitives";
import type { ActiveInterventionType, InterventionLevel } from "./types";

// ---------------------------------------------------------------------------
// Intervention Intelligence System — types only, no runtime logic.
// ---------------------------------------------------------------------------

// ── Outcome Measurement ─────────────────────────────────────────────────────

/** Which behavioral metric this intervention type targets for outcome measurement. */
export type TargetMetricId =
  | "EXECUTION_SCORE"
  | "FRAGMENTATION_SIGNAL"
  | "AVOIDANCE_SIGNAL"
  | "DEEP_WORK_SIGNAL"
  | "COMPLETION_RATIO"
  | "FOCUS";

export type OutcomeStatus = "PENDING" | "MEASURED" | "FINALIZED" | "UNMEASURABLE";

/** Baseline snapshot captured at fire time; post-window values filled in on reconciliation. */
export type InterventionOutcomeRecord = {
  /** UUID matching the InterventionAuditRecord.interventionId. */
  outcomeId: string;
  type: ActiveInterventionType;
  firedAt: Timestamp;
  /** Target metric for this type — what we measure, not raw global score. */
  targetMetricId: TargetMetricId;
  /** Trailing 3-day avg of targetMetric at fire time. */
  baselineValue: number;
  /** Avg of targetMetric across post-fire check-ins inside the window (filled on reconciliation). */
  postWindowValue: number | null;
  /** Signed delta: postWindowValue − baselineValue. Positive = improvement for score metrics. */
  outcomeDelta: number | null;
  /** Outcome window in days (type-specific). */
  windowDays: number;
  /** How many check-ins occurred inside the window (for UNMEASURABLE gate). */
  postCheckInCount: number;
  status: OutcomeStatus;
  /** ISO timestamp when status moved to FINALIZED or UNMEASURABLE. */
  finalizedAt: Timestamp | null;
  attribution: OutcomeAttribution | null;
  /** 90-day retention (not 8d like audit). */
  expiresAt: Timestamp;
};

// ── Attribution ─────────────────────────────────────────────────────────────

/** Hard confounders that invalidate causal attribution. */
export type ConfounderFlag =
  | "CONCURRENT_INTERVENTION"
  | "WEEKEND_BOUNDARY"
  | "SLEEP_SHIFT"
  | "REGRESSION_TO_MEAN"
  | "RECOVERY_MODE_OVERLAP"
  | "INSUFFICIENT_POSTDATA";

export type AttributionVerdict = "IMPROVED" | "NEUTRAL" | "WORSENED" | "UNATTRIBUTABLE";

export type OutcomeAttribution = {
  verdict: AttributionVerdict;
  /** Hard confounders detected (any present → UNATTRIBUTABLE). */
  hardConfounders: ConfounderFlag[];
  /** Soft confounders recorded for transparency but not blocking attribution. */
  softConfounders: ConfounderFlag[];
  /** Human-readable basis for this attribution decision. */
  basis: string;
};

// ── Effectiveness Scoring ────────────────────────────────────────────────────

export type EffectivenessVerdict = "WORKING" | "NEUTRAL" | "NOT_WORKING" | "INSUFFICIENT_EVIDENCE";

export type EffectivenessConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type TypeEffectiveness = {
  type: ActiveInterventionType;
  verdict: EffectivenessVerdict;
  confidence: EffectivenessConfidence;
  /** Median delta across attributable outcomes (null when INSUFFICIENT_EVIDENCE). */
  medianDelta: number | null;
  /** Proportion of attributable outcomes showing improvement. */
  signAgreementRate: number | null;
  /** Total outcomes measured (including unattributable). */
  totalOutcomes: number;
  /** Outcomes excluded from verdict due to confounders. */
  unattributableCount: number;
  /** Proportion of outcomes flagged as unattributable. */
  confounderRate: number;
};

// ── Fatigue Detection ────────────────────────────────────────────────────────

export type FatigueLevel = "NONE" | "EMERGING" | "HIGH";

export type InterventionFatigueSignal = {
  type: ActiveInterventionType;
  level: FatigueLevel;
  /** Human-readable reasons for the fatigue classification. */
  basis: string[];
};

// ── Advisories (feedback into engine) ───────────────────────────────────────

/** Multiplier applied to COOLDOWN_DEFAULTS for this type. Capped [1×, 3×]. */
export type CooldownAdvisory = {
  type: ActiveInterventionType;
  /** Multiplier ∈ [1, 3]. 1 = no change; 3 = triple cooldown. Safety types always get 1. */
  multiplier: number;
  reason: string;
};

export type SuppressionAction = "NONE" | "DEMOTE";

/** Advisory to demote a type: cap max level −1 and lower priority. Never for safety types. */
export type SuppressionAdvisory = {
  type: ActiveInterventionType;
  action: SuppressionAction;
  reason: string;
};

// ── Intelligence Report (top-level selector output) ──────────────────────────

export type InterventionIntelligenceReport = {
  /** Per-type effectiveness verdicts with confidence and attribution stats. */
  effectiveness: TypeEffectiveness[];
  /** Per-type user fatigue signals. */
  fatigue: InterventionFatigueSignal[];
  /** Cooldown multiplier advisories to feed into the next pipeline run. */
  cooldownAdvisories: CooldownAdvisory[];
  /** Suppression advisories to feed into the next pipeline run. */
  suppressionAdvisories: SuppressionAdvisory[];
  /** ISO timestamp of last reconciliation pass. */
  lastReconciled: Timestamp | null;
};
