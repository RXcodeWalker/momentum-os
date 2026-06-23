import type { CheckIn } from "@/lib/store";
import type { BehavioralEvent } from "@/core/contracts/history/event";
import type { AggregationSnapshot, WindowKey } from "@/core/contracts/history/snapshot";
import type { TrendRecord, TrendMetricKey } from "@/core/contracts/history/trend";
import type {
  EvidenceConfidence,
  EvidenceConfidenceFactors,
} from "@/core/contracts/history/confidence";
import type {
  BehavioralEvidence,
  EvidenceSummary,
  DerivedMetrics,
} from "@/core/contracts/history/evidence";
import type { BehavioralPeriod } from "@/core/contracts/history/period";
import type { TrendDirection } from "@/core/contracts/primitives";

function computeEvidenceConfidence(
  w7Snapshot: AggregationSnapshot | undefined,
  totalCheckIns: number,
): EvidenceConfidence {
  const evidenceDays = w7Snapshot?.evidenceDays ?? 0;
  const windowDays = w7Snapshot?.windowDays ?? 7;

  const historyDepth = Math.min(1, evidenceDays / 28);
  const sampleSize = Math.min(1, totalCheckIns / 14);
  const scoreStdDev = w7Snapshot?.metrics.scoreStdDev ?? 0;
  const signalConsistency = Math.max(0, Math.min(1, 1 - scoreStdDev / 30));
  const evidenceCompleteness = windowDays > 0 ? Math.min(1, evidenceDays / windowDays) : 0;

  const factors: EvidenceConfidenceFactors = {
    historyDepth: Math.round(historyDepth * 100) / 100,
    sampleSize: Math.round(sampleSize * 100) / 100,
    signalConsistency: Math.round(signalConsistency * 100) / 100,
    evidenceCompleteness: Math.round(evidenceCompleteness * 100) / 100,
  };

  const score = Math.round(
    historyDepth * 30 + sampleSize * 25 + signalConsistency * 25 + evidenceCompleteness * 20,
  );

  const band = score > 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

  // Recent gap: days since last evidence
  const lastEvidenceDate = w7Snapshot?.metrics.lastEvidenceDate;
  const recentGapDays = lastEvidenceDate
    ? Math.floor((Date.now() - new Date(lastEvidenceDate).getTime()) / (24 * 60 * 60 * 1000))
    : Infinity;

  const suppressionRecommended = recentGapDays > 3 || score < 30;

  return { score, band, factors, suppressionRecommended };
}

function buildDerivedMetrics(
  w7Snapshot: AggregationSnapshot | undefined,
  trends: Partial<Record<TrendMetricKey, TrendRecord>>,
): DerivedMetrics {
  const executionScoreDelta = w7Snapshot?.metrics.executionScoreDelta ?? 0;
  const scoreTrend = trends.executionScore;
  const momentumDirection: TrendDirection = scoreTrend?.direction ?? "STABLE";

  return {
    executionScoreDelta,
    momentumDirection,
    consistencyRate: w7Snapshot?.metrics.consistencyRate ?? 0,
    dominantBlockerType: w7Snapshot?.metrics.dominantBlockerType ?? null,
    dominantDistractionType: w7Snapshot?.metrics.dominantDistractionType ?? null,
    streakAtRisk: w7Snapshot?.metrics.streakAtRisk ?? false,
    recoveryDebtAccumulating: w7Snapshot?.metrics.recoveryDebtAccumulating ?? false,
  };
}

function buildTrendMap(trendRecords: TrendRecord[]): Partial<Record<TrendMetricKey, TrendRecord>> {
  const map: Partial<Record<TrendMetricKey, TrendRecord>> = {};
  for (const record of trendRecords) {
    const existing = map[record.metric];
    if (!existing || record.detectedAt > existing.detectedAt) {
      map[record.metric] = record;
    }
  }
  return map;
}

function buildSummary(
  checkIns: CheckIn[],
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>,
  confidence: EvidenceConfidence,
): EvidenceSummary {
  const allDates = checkIns.map((c) => c.date).sort();
  const w7 = snapshots.W7;

  const recentGapDays = w7?.metrics.lastEvidenceDate
    ? Math.floor(
        (Date.now() - new Date(w7.metrics.lastEvidenceDate).getTime()) / (24 * 60 * 60 * 1000),
      )
    : Infinity;

  return {
    totalCheckIns: checkIns.length,
    oldestRecordDate: allDates[0] ?? "",
    newestRecordDate: allDates[allDates.length - 1] ?? "",
    lastEvidenceDate: w7?.metrics.lastEvidenceDate ?? "",
    confidence,
    hasMinimumW7: (w7?.evidenceDays ?? 0) >= 5,
    hasMinimumW28: checkIns.length >= 14,
    recentGapDays: recentGapDays === Infinity ? 999 : recentGapDays,
  };
}

export function buildEvidence(
  events: BehavioralEvent[],
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>,
  trendRecords: TrendRecord[],
  checkIns: CheckIn[],
  behavioralPeriods: BehavioralPeriod[] = [],
): BehavioralEvidence {
  const trends = buildTrendMap(trendRecords);
  const w7 = snapshots.W7;
  const confidence = computeEvidenceConfidence(w7, checkIns.length);
  const summary = buildSummary(checkIns, snapshots, confidence);
  const derivedMetrics = buildDerivedMetrics(w7, trends);

  const activePeriod =
    behavioralPeriods.find((p) => p.endDate === null) ??
    (behavioralPeriods.length > 0 ? behavioralPeriods[behavioralPeriods.length - 1] : null);

  const recentEvents = events.filter((e) => !e.isBackfilled).slice(-30);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    snapshots,
    trends,
    activePeriod,
    recentEvents,
    derivedMetrics,
  };
}

export function buildEvidenceForPipeline(state: {
  behavioralEvents: BehavioralEvent[];
  aggregationSnapshots: Partial<Record<WindowKey, AggregationSnapshot>>;
  trendRecords: TrendRecord[];
  checkIns: CheckIn[];
  behavioralPeriods: BehavioralPeriod[];
}): BehavioralEvidence {
  return buildEvidence(
    state.behavioralEvents,
    state.aggregationSnapshots,
    state.trendRecords,
    state.checkIns,
    state.behavioralPeriods,
  );
}
