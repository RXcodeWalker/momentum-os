import type { PatternWindowKey } from "./window";

export type PatternCategory =
  | "ANTECEDENT_CONSEQUENT"
  | "CONDITIONAL_RATE"
  | "TEMPORAL_RECURRENCE"
  | "SEQUENCE"
  | "CO_OCCURRENCE";

export type PatternPolarity = "RISK" | "PROTECTIVE" | "NEUTRAL";

export type ConditionCode =
  | "SLEEP_BELOW_6_5"
  | "SLEEP_ABOVE_7_5"
  | "NEXT_DAY_SCORE_DIP"
  | "NEXT_DAY_SCORE_HIGH"
  | "WEEKDAY_MONDAY"
  | "HIGH_PLANNED_LOAD"
  | "PRIOR_DAY_PEAK"
  | "PRIOR_DAY_RECOVERY"
  | "DISTRACTION_SPIKE"
  | "DISTRACTION_ABSENT"
  | "CONSECUTIVE_FOCUS_3"
  | "SCORE_DIP_TODAY"
  | "SCORE_HIGH_TODAY"
  | "RECOVERY_DAY"
  | "BLOCKER_PRESENT";

export type PatternExplanationCode =
  | "SLEEP_DEBT_PRECEDES_DIP"
  | "WEEKDAY_OVERLOAD"
  | "POST_PEAK_DISTRACTION"
  | "CONSECUTIVE_FOCUS_FATIGUE"
  | "RECOVERY_DAY_PROTECTS_NEXT"
  | "SLEEP_PROTECTS_EXECUTION"
  | "DISTRACTION_PRECEDES_DIP"
  | "MONDAY_OVERPLAN"
  | "BLOCKER_CHAINS";

export type PatternTemplate = {
  templateId: string;
  category: PatternCategory;
  label: string;
  antecedent: ConditionCode;
  consequent: ConditionCode;
  polarity: PatternPolarity;
  minSupport: number;
  minWindowDays: number;
  lookbackWindow: PatternWindowKey;
  explanationCode: PatternExplanationCode;
};
