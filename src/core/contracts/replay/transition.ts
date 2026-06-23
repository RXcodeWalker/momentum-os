import type { ConfidenceBand } from "../primitives";
import type { BehavioralPeriodType } from "../history/period";

export type TransitionKind = "IMPROVEMENT" | "DECLINE" | "LATERAL";
export type TransitionDirection = "UPWARD" | "DOWNWARD" | "LATERAL";

export type ReplayTransition = {
  transitionId: string;
  fromPeriodType: BehavioralPeriodType;
  toPeriodType: BehavioralPeriodType;
  kind: TransitionKind;
  direction: TransitionDirection;
  date: string;
  avgScoreBefore: number | null;
  avgScoreAfter: number | null;
  scoreDelta: number | null;
  observation: string;
};

export type ReplayTransitionSummary = {
  transitions: ReplayTransition[];
  netDirection: TransitionDirection;
  scoreDeltaTotal: number | null;
  sectionHedge: "TENTATIVE" | "OBSERVED" | "CONSISTENT";
  confidence: ConfidenceBand;
  suppressed: boolean;
  suppressionReason: string | null;
};
