import type { ConfidenceBand } from "../primitives";
import type { BehavioralPeriodType } from "../history/period";

export type ForecastProbabilityLabel = "LIKELY" | "POSSIBLE" | "UNLIKELY";

export type ForecastOutcome = {
  outcomeId: string;
  targetPeriodType: BehavioralPeriodType | null;
  probability: ForecastProbabilityLabel;
  estimatedDaysRange: { min: number; max: number } | null;
  observation: string;
  evidenceCount: number;
  isPrimary: boolean;
};

export const FORECAST_MINIMUM_CONFIDENCE: ConfidenceBand = "MEDIUM";
export const FORECAST_MINIMUM_TRANSITION_EVIDENCE = 3;

export type ReplayForecast = {
  outcomes: ForecastOutcome[];
  primaryOutcome: ForecastOutcome | null;
  sectionHedge: "TENTATIVE" | "OBSERVED" | "CONSISTENT";
  sourceTransitionCount: number;
  confidence: ConfidenceBand;
  suppressed: boolean;
  suppressionReason: string | null;
};
