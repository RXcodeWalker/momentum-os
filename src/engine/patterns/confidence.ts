import type { PatternEvidence } from "@/core/contracts/patterns/evidence";
import type { PatternAssociation } from "@/core/contracts/patterns/association";
import type { PatternConfidence } from "@/core/contracts/patterns/confidence";
import type { ConfidenceBand } from "@/core/contracts/primitives";
import { PATTERN_DECAY_HALF_LIFE_DAYS } from "@/core/contracts/patterns/window";

function wilsonInterval(successes: number, n: number): { low: number; high: number } {
  if (n === 0) return { low: 0, high: 1 };
  const z = 1.96; // 95% CI
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const spread = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return {
    low: Math.max(0, Math.round((center - spread) * 100) / 100),
    high: Math.min(1, Math.round((center + spread) * 100) / 100),
  };
}

export function computePatternConfidence(
  evidence: PatternEvidence,
  association: PatternAssociation,
  minSupport: number,
  windowDays: number,
): PatternConfidence {
  // Support weight: how much evidence relative to 2× minimum
  const supportWeight = Math.min(1, evidence.supportingCount / (2 * Math.max(1, minSupport)));

  // Lift weight: how far conditional rate deviates from base rate
  const liftWeight = Math.min(1, Math.abs(association.riskDifference) * 3);

  // Consistency weight: direction stable + recurrence spread
  const spreadBonus =
    evidence.recurrenceSpread >= 2 ? 1 : evidence.recurrenceSpread >= 1 ? 0.6 : 0.2;
  const consistencyWeight = association.directionStable ? spreadBonus : 0.1;

  // Coverage weight: what fraction of window days have observations
  const coverageWeight = windowDays > 0 ? Math.min(1, evidence.totalObservations / windowDays) : 0;

  // Recency weight: exponential decay from last confirmation
  let recencyWeight = 0;
  if (evidence.lastConfirmationDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(evidence.lastConfirmationDate).getTime()) / 86400000,
    );
    recencyWeight = Math.exp((-Math.LN2 * daysSince) / PATTERN_DECAY_HALF_LIFE_DAYS);
  }

  const factors = {
    supportWeight: Math.round(supportWeight * 100) / 100,
    liftWeight: Math.round(liftWeight * 100) / 100,
    consistencyWeight: Math.round(consistencyWeight * 100) / 100,
    coverageWeight: Math.round(coverageWeight * 100) / 100,
    recencyWeight: Math.round(recencyWeight * 100) / 100,
  };

  const raw =
    factors.supportWeight * 0.3 +
    factors.liftWeight * 0.25 +
    factors.consistencyWeight * 0.2 +
    factors.coverageWeight * 0.15 +
    factors.recencyWeight * 0.1;

  const score = Math.round(raw * 100);

  let band: ConfidenceBand = score > 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

  // Wilson interval on conditional rate
  const rateInterval = wilsonInterval(evidence.supportingCount, evidence.antecedentOccurrences);

  // If interval straddles base rate, clamp band to ≤ MEDIUM
  if (
    band === "HIGH" &&
    rateInterval.low <= association.baseRate &&
    rateInterval.high >= association.baseRate
  ) {
    band = "MEDIUM";
  }

  return { score, band, factors, rateInterval };
}
