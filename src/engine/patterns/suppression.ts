import type { DetectedPattern } from "@/core/contracts/patterns/pattern";
import type {
  PatternSuppressionAdvisory,
  PatternSuppressionReason,
} from "@/core/contracts/patterns/suppression";

export function buildSuppressionAdvisory(pattern: DetectedPattern): PatternSuppressionAdvisory {
  const reasons: PatternSuppressionReason[] = [];
  const { evidence, association, confidence } = pattern;

  if (!association.meetsMinSupport) {
    reasons.push("INSUFFICIENT_SUPPORT");
  }

  if (association.confounders.some((c) => c.kind === "WEAK_LIFT")) {
    reasons.push("WEAK_ASSOCIATION");
  }

  if (association.confounders.some((c) => c.kind === "HIGH_BASE_RATE")) {
    reasons.push("HIGH_BASE_RATE");
  }

  // Contradicted: contradictions ≥ supports, or most recent event is a contradiction
  if (evidence.contradictingCount >= evidence.supportingCount && evidence.supportingCount > 0) {
    reasons.push("CONTRADICTED");
  } else if (
    evidence.lastContradictionDate !== null &&
    (evidence.lastConfirmationDate === null ||
      evidence.lastContradictionDate > evidence.lastConfirmationDate)
  ) {
    reasons.push("CONTRADICTED");
  }

  // Stale: no confirmation in windowDays/2 days, or data gap
  if (evidence.lastConfirmationDate !== null) {
    const daysSince = Math.floor(
      (Date.now() - new Date(evidence.lastConfirmationDate).getTime()) / 86400000,
    );
    const staleThreshold = Math.floor(pattern.window.windowDays / 2);
    if (daysSince > staleThreshold) {
      reasons.push("STALE");
    }
  } else {
    reasons.push("STALE");
  }

  if (association.confounders.some((c) => c.kind === "CO_VARYING_FACTOR")) {
    reasons.push("CONFOUNDED");
  }

  if (confidence.band === "LOW") {
    reasons.push("LOW_CONFIDENCE");
  }

  return {
    patternId: pattern.patternId,
    suppressed: reasons.length > 0,
    reasons,
  };
}
