export type PatternConfounderKind =
  | "CO_VARYING_FACTOR"
  | "SMALL_SAMPLE"
  | "WEAK_LIFT"
  | "HIGH_BASE_RATE"
  | "RECENT_REVERSAL"
  | "SPARSE_COVERAGE";

export type PatternConfounder = {
  kind: PatternConfounderKind;
  note: string;
};

export type PatternAssociation = {
  conditionalRate: number;
  baseRate: number;
  lift: number;
  riskDifference: number;
  avgMagnitude: number | null;
  sampleSize: number;
  meetsMinSupport: boolean;
  directionStable: boolean;
  confounders: PatternConfounder[];
};
