import type { ConfidenceBand, TrendDirection } from "../primitives";
import type { UserMode, UserTrajectory } from "../state/modes";
import type { BehavioralSignal } from "../signals/behavioral-signals";

export type BehavioralPeriodType =
  | "RECOVERY"
  | "STABILIZING"
  | "FOCUSED"
  | "EXPANDING"
  | "INSTABILITY";

export type BehavioralPeriod = {
  periodId: string;
  periodType: BehavioralPeriodType;
  startDate: string;
  endDate: string | null;
  durationDays: number;
  avgScore: number;
  scoreRange: { min: number; max: number };
  dominantMode: UserMode;
  trajectory: UserTrajectory;
  keySignals: BehavioralSignal[];
  confidence: ConfidenceBand;
  detectedBy: "pattern_engine" | "inferred";
};

// Suppress unused import warning — TrendDirection used transitively via UserTrajectory context
export type { TrendDirection };
