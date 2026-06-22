import type { DetectedPattern, PatternStatus } from "@/core/contracts/patterns/pattern";
import type { PatternSuppressionAdvisory } from "@/core/contracts/patterns/suppression";

export function resolveStatus(
  pattern: DetectedPattern,
  advisory: PatternSuppressionAdvisory,
): PatternStatus {
  if (advisory.suppressed) return "SUPPRESSED";

  // Dormant: antecedent not seen in last min(windowDays, 28) days
  const lookback = Math.min(pattern.window.windowDays, 28);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookback);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentAntecedent = pattern.evidence.observations.some(
    (o) => o.antecedentPresent && o.date >= cutoffStr,
  );
  if (!recentAntecedent) return "DORMANT";

  // Fading: recency weight is low but had historical confidence
  const { recencyWeight } = pattern.confidence.factors;
  if (recencyWeight < 0.3 && pattern.confidence.score >= 40) return "FADING";

  // Emerging: not yet enough confidence/support to be ACTIVE
  if (pattern.confidence.band === "LOW" || !pattern.association.meetsMinSupport) return "EMERGING";

  return "ACTIVE";
}
