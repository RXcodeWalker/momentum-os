import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type {
  InterventionOutcomeRecord,
  TypeEffectiveness,
  EffectivenessVerdict,
  EffectivenessConfidence,
} from "@/core/contracts/interventions/intelligence";

// ---------------------------------------------------------------------------
// Effectiveness Scoring — per-type robust aggregate over attributable outcomes.
// Mirrors useInsightEffectiveness taxonomy and time-gating discipline.
// ---------------------------------------------------------------------------

/** Minimum attributable outcomes required before any verdict is surfaced. */
const MIN_FOR_VERDICT = 4;
const MIN_FOR_HIGH_CONFIDENCE = 8;
/** Median delta at or above this → WORKING (in target metric units). */
const WORKING_THRESHOLD = 3;
/** Median delta at or below this → NOT_WORKING. */
const NOT_WORKING_THRESHOLD = -3;
/** Sign agreement rate required for WORKING verdict. */
const SIGN_AGREEMENT_REQUIRED = 0.7;
/** Confounder rate above which confidence stays LOW even with enough samples. */
const HIGH_CONFOUNDER_RATE = 0.3;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function signAgreementRate(deltas: number[]): number {
  if (deltas.length === 0) return 0;
  const positive = deltas.filter((d) => d > 0).length;
  return positive / deltas.length;
}

function computeConfidence(
  attributableCount: number,
  signRate: number,
  confounderRate: number,
): EffectivenessConfidence {
  if (attributableCount < MIN_FOR_VERDICT) return "INSUFFICIENT";
  if (confounderRate >= HIGH_CONFOUNDER_RATE) return "LOW";
  if (attributableCount >= MIN_FOR_HIGH_CONFIDENCE && signRate >= SIGN_AGREEMENT_REQUIRED) {
    return "HIGH";
  }
  if (attributableCount >= MIN_FOR_VERDICT) return "MEDIUM";
  return "LOW";
}

function computeVerdict(
  medianDelta: number,
  signRate: number,
  confidence: EffectivenessConfidence,
  attributableCount: number,
): EffectivenessVerdict {
  if (confidence === "INSUFFICIENT" || attributableCount < MIN_FOR_VERDICT) {
    return "INSUFFICIENT_EVIDENCE";
  }
  if (medianDelta >= WORKING_THRESHOLD && signRate >= SIGN_AGREEMENT_REQUIRED) {
    return "WORKING";
  }
  if (medianDelta <= NOT_WORKING_THRESHOLD) {
    return "NOT_WORKING";
  }
  // Zero-delta with sufficient samples → NOT_WORKING (type does nothing)
  if (Math.abs(medianDelta) < WORKING_THRESHOLD && attributableCount >= MIN_FOR_HIGH_CONFIDENCE) {
    return "NOT_WORKING";
  }
  return "NEUTRAL";
}

/**
 * Compute per-type effectiveness from a set of outcome records.
 * Only FINALIZED, attributable (non-UNATTRIBUTABLE) records contribute to the verdict.
 */
export function computeTypeEffectiveness(
  type: ActiveInterventionType,
  outcomes: InterventionOutcomeRecord[],
): TypeEffectiveness {
  const typeOutcomes = outcomes.filter((r) => r.type === type && r.status === "FINALIZED");
  const totalOutcomes = typeOutcomes.length;

  const attributable = typeOutcomes.filter(
    (r) => r.attribution?.verdict !== "UNATTRIBUTABLE" && r.outcomeDelta !== null,
  );
  const unattributableCount = totalOutcomes - attributable.length;
  const confounderRate = totalOutcomes > 0 ? unattributableCount / totalOutcomes : 0;

  if (attributable.length < MIN_FOR_VERDICT) {
    return {
      type,
      verdict: "INSUFFICIENT_EVIDENCE",
      confidence: "INSUFFICIENT",
      medianDelta: null,
      signAgreementRate: null,
      totalOutcomes,
      unattributableCount,
      confounderRate,
    };
  }

  const deltas = attributable.map((r) => r.outcomeDelta!);
  const medianDelta = median(deltas);
  const signRate = signAgreementRate(deltas);
  const confidence = computeConfidence(attributable.length, signRate, confounderRate);
  const verdict = computeVerdict(medianDelta, signRate, confidence, attributable.length);

  return {
    type,
    verdict,
    confidence,
    medianDelta,
    signAgreementRate: signRate,
    totalOutcomes,
    unattributableCount,
    confounderRate,
  };
}

/**
 * Compute effectiveness for all active intervention types from a flat outcome ledger.
 */
export function computeAllEffectiveness(
  outcomes: InterventionOutcomeRecord[],
): TypeEffectiveness[] {
  const types: ActiveInterventionType[] = [
    "BURNOUT_PREVENTION",
    "RECOVERY_ENFORCEMENT",
    "OVERLOAD",
    "AVOIDANCE_INTERRUPTION",
    "FRAGMENTATION_REDUCTION",
    "DEEP_WORK_PROTECTION",
    "RESTART_ASSISTANCE",
  ];
  return types.map((type) => computeTypeEffectiveness(type, outcomes));
}
