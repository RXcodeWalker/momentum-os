export type PatternSuppressionReason =
  | "INSUFFICIENT_SUPPORT"
  | "WEAK_ASSOCIATION"
  | "HIGH_BASE_RATE"
  | "STALE"
  | "CONTRADICTED"
  | "CONFOUNDED"
  | "LOW_CONFIDENCE"
  | "DUPLICATE"
  | "COOLDOWN";

export type PatternSuppressionAdvisory = {
  patternId: string;
  suppressed: boolean;
  reasons: PatternSuppressionReason[];
};
