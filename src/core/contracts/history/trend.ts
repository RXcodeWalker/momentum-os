import type { Timestamp, TrendDirection, ConfidenceBand } from "../primitives";

export type TrendMetricKey =
  | "executionScore"
  | "sleepHours"
  | "focus"
  | "distractionCount"
  | "completionRate"
  | "consistency";

export type TrendRecord = {
  trendId: string;
  metric: TrendMetricKey;
  direction: TrendDirection;
  magnitude: number;
  velocity: number;
  persistence: number;
  consistency: number;
  durationDays: number;
  windowDays: number;
  detectedAt: Timestamp;
  periodStartDate: string;
  supportingDayCount: number;
  confidence: ConfidenceBand;
  priorWindowAvg: number;
  currentWindowAvg: number;
};

export type TrendSeries = {
  metric: TrendMetricKey;
  records: TrendRecord[];
  latestTrend: TrendRecord | null;
};
