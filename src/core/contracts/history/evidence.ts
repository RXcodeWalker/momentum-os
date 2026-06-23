import type { Timestamp, TrendDirection } from "../primitives";
import type { WindowKey, AggregationSnapshot } from "./snapshot";
import type { TrendMetricKey, TrendRecord } from "./trend";
import type { EvidenceConfidence } from "./confidence";
import type { BehavioralEvent } from "./event";
import type { BehavioralPeriod } from "./period";

export type DerivedMetrics = {
  executionScoreDelta: number;
  momentumDirection: TrendDirection;
  consistencyRate: number;
  dominantBlockerType: string | null;
  dominantDistractionType: string | null;
  streakAtRisk: boolean;
  recoveryDebtAccumulating: boolean;
};

export type EvidenceSummary = {
  totalCheckIns: number;
  oldestRecordDate: string;
  newestRecordDate: string;
  lastEvidenceDate: string;
  confidence: EvidenceConfidence;
  hasMinimumW7: boolean;
  hasMinimumW28: boolean;
  recentGapDays: number;
};

// ARCHITECTURE RULE: BehavioralEvidence is the only public intelligence interface.
// Intervention Intelligence, State Dynamics, Pattern Detection, and Behavioral Replay
// consume this bundle. They do NOT read snapshots, trends, or events from the store directly.
export type BehavioralEvidence = {
  generatedAt: Timestamp;
  summary: EvidenceSummary;
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>;
  trends: Partial<Record<TrendMetricKey, TrendRecord>>;
  activePeriod: BehavioralPeriod | null;
  recentEvents: BehavioralEvent[];
  derivedMetrics: DerivedMetrics;
};
