import type { ConfidenceBand, Timestamp } from "../primitives";
import type { DetectedPattern } from "./pattern";
import type { PatternSuppressionAdvisory } from "./suppression";

export type PatternDetectionProfile = {
  patterns: DetectedPattern[];
  activePatterns: DetectedPattern[];
  suppressionAdvisories: PatternSuppressionAdvisory[];
  dominantRiskPattern: DetectedPattern | null;
  dominantProtectivePattern: DetectedPattern | null;
  patternCount: number;
  windowDays: number;
  confidence: ConfidenceBand;
  computedAt: Timestamp;
};
