import type { ConfidenceBand } from "../primitives";
import type { TrendMetricKey } from "../history/trend";

export type AttributionFactorKind =
  | "SLEEP"
  | "DISTRACTION"
  | "BLOCKER"
  | "FOCUS"
  | "CONSISTENCY"
  | "RECOVERY_DAYS";

export type AttributionDirection = "SUPPORTIVE" | "NEUTRAL" | "LIMITING";

export type AttributionFactor = {
  kind: AttributionFactorKind;
  trendMetricKey: TrendMetricKey | null;
  direction: AttributionDirection;
  observation: string;
  /** Engine-internal only — never rendered in UI */
  associationStrength: number;
  scoreDelta: number | null;
  confidence: ConfidenceBand;
  evidenceDays: number;
};

export const ATTRIBUTION_EVIDENCE_REQUIREMENTS = {
  minimumCheckIns: 7,
  minimumEvidenceDaysPerFactor: 3,
} as const;

export type ReplayAttribution = {
  factors: AttributionFactor[];
  primaryFactor: AttributionFactor | null;
  sectionHedge: "TENTATIVE" | "OBSERVED" | "CONSISTENT";
  confidence: ConfidenceBand;
  suppressed: boolean;
  suppressionReason: string | null;
};
