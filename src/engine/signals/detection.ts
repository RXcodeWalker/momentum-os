import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { DailyInputs } from "@/core/contracts/signals/daily-inputs";
import type { SessionEvidence } from "@/core/contracts/signals/session-evidence";
import type { ConfidenceBand, Scalar } from "@/core/contracts/primitives";
import { movingAverage, calculateTrend } from "@/engine/shared";
import {
  DEFAULT_SMOOTHING_WINDOW,
  MIN_TIMELINE_DAYS,
  STRONG_SIGNAL_MIN_DAYS,
  SUSTAINED_SIGNAL_MIN_DAYS,
  THRESHOLDS,
} from "./config";
import {
  averageCompleteness,
  buildMetricTimeline,
  seriesFromTimeline,
  type MetricTimeline,
} from "./evidence";

export type SignalDetectionOptions = {
  smoothingWindow?: number;
};

export type DetectedSignal = {
  signal: BehavioralSignal;
  strength: Scalar;
  sustainedDays: number;
};

function countTrailingSustained(values: number[], predicate: (value: number) => boolean): number {
  let count = 0;
  for (let index = values.length - 1; index >= 0; index--) {
    if (!predicate(values[index])) break;
    count++;
  }
  return count;
}

function countTrailingPaired(
  primary: number[],
  secondary: number[],
  predicate: (primaryValue: number, secondaryValue: number) => boolean,
): number {
  let count = 0;
  for (let index = primary.length - 1; index >= 0; index--) {
    if (!predicate(primary[index], secondary[index])) break;
    count++;
  }
  return count;
}

function meanDayToDayVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const deltas = [];
  for (let index = 1; index < values.length; index++) {
    deltas.push(Math.abs(values[index] - values[index - 1]));
  }
  return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
}

function countTrailingVolatility(series: number[], threshold: number): number {
  let count = 0;
  for (let index = series.length - 1; index >= 1; index--) {
    if (Math.abs(series[index] - series[index - 1]) >= threshold * 0.65) count++;
    else break;
  }
  return count;
}

function strengthFromLevel(
  level: number,
  threshold: number,
  direction: "above" | "below",
  sustainedDays: number,
): Scalar {
  const distance =
    direction === "above" ? Math.max(0, level - threshold) : Math.max(0, threshold - level);
  const base = Math.min(100, (distance / Math.max(1, threshold)) * 100);
  const durationBoost = Math.min(1.5, 1 + (sustainedDays - 1) * 0.1);
  return Math.min(100, base * durationBoost);
}

function detectFromTimeline(timeline: MetricTimeline, smoothingWindow: number): DetectedSignal[] {
  if (timeline.points.length < MIN_TIMELINE_DAYS) return [];

  const rawFragmentation = seriesFromTimeline(timeline, "fragmentation");
  const rawExecutionQuality = seriesFromTimeline(timeline, "executionQuality");
  const rawRecoveryCapacity = seriesFromTimeline(timeline, "recoveryCapacity");
  const rawAvoidancePressure = seriesFromTimeline(timeline, "avoidancePressure");
  const rawDeepWorkContinuity = seriesFromTimeline(timeline, "deepWorkContinuity");
  const rawPacingQuality = seriesFromTimeline(timeline, "pacingQuality");
  const rawMeaningfulness = seriesFromTimeline(timeline, "meaningfulness");
  const rawBehavioralComposite = seriesFromTimeline(timeline, "behavioralComposite");

  const fragmentation = movingAverage(rawFragmentation, smoothingWindow);
  const executionQuality = movingAverage(rawExecutionQuality, smoothingWindow);
  const recoveryCapacity = movingAverage(rawRecoveryCapacity, smoothingWindow);
  const avoidancePressure = movingAverage(rawAvoidancePressure, smoothingWindow);
  const deepWorkContinuity = movingAverage(rawDeepWorkContinuity, smoothingWindow);
  const pacingQuality = movingAverage(rawPacingQuality, smoothingWindow);
  const meaningfulness = movingAverage(rawMeaningfulness, smoothingWindow);
  const behavioralComposite = movingAverage(rawBehavioralComposite, smoothingWindow);

  const detected: DetectedSignal[] = [];
  const last = <T>(series: T[]): T => series[series.length - 1];

  const fragmentationTrend = calculateTrend(fragmentation);
  const fragmentationSustained = countTrailingSustained(
    rawFragmentation,
    (value) => value >= THRESHOLDS.fragmentationElevated,
  );
  if (
    fragmentationTrend === "RISING" &&
    fragmentationSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    last(fragmentation) >= THRESHOLDS.fragmentationElevated
  ) {
    detected.push({
      signal: "RISING_FRAGMENTATION",
      strength: strengthFromLevel(
        last(fragmentation),
        THRESHOLDS.fragmentationElevated,
        "above",
        fragmentationSustained,
      ),
      sustainedDays: fragmentationSustained,
    });
  }

  const executionTrend = calculateTrend(executionQuality);
  const executionSustained = countTrailingSustained(
    rawExecutionQuality,
    (value) => value <= THRESHOLDS.executionDeclining,
  );
  if (
    executionTrend === "DECLINING" &&
    executionSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    last(executionQuality) <= THRESHOLDS.executionDeclining
  ) {
    detected.push({
      signal: "DECLINING_EXECUTION_QUALITY",
      strength: strengthFromLevel(
        last(executionQuality),
        THRESHOLDS.executionDeclining,
        "below",
        executionSustained,
      ),
      sustainedDays: executionSustained,
    });
  }

  const recoveryTrend = calculateTrend(recoveryCapacity);
  const recoverySustained = countTrailingSustained(
    rawRecoveryCapacity,
    (value) => value <= THRESHOLDS.recoveryCollapsed,
  );
  if (
    recoveryTrend === "DECLINING" &&
    recoverySustained >= STRONG_SIGNAL_MIN_DAYS &&
    last(recoveryCapacity) <= THRESHOLDS.recoveryCollapsed
  ) {
    detected.push({
      signal: "RECOVERY_COLLAPSE",
      strength: strengthFromLevel(
        last(recoveryCapacity),
        THRESHOLDS.recoveryCollapsed,
        "below",
        recoverySustained,
      ),
      sustainedDays: recoverySustained,
    });
  }

  const avoidanceTrend = calculateTrend(avoidancePressure);
  const avoidanceSustained = countTrailingSustained(
    rawAvoidancePressure,
    (value) => value >= THRESHOLDS.avoidanceElevated,
  );
  if (
    avoidanceTrend === "RISING" &&
    avoidanceSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    last(avoidancePressure) >= THRESHOLDS.avoidanceElevated
  ) {
    detected.push({
      signal: "AVOIDANCE_CLUSTERING",
      strength: strengthFromLevel(
        last(avoidancePressure),
        THRESHOLDS.avoidanceElevated,
        "above",
        avoidanceSustained,
      ),
      sustainedDays: avoidanceSustained,
    });
  }

  const meaningfulnessTrend = calculateTrend(meaningfulness);
  const meaningfulnessSustained = countTrailingSustained(
    rawMeaningfulness,
    (value) => value <= THRESHOLDS.executionDeclining,
  );
  if (
    meaningfulnessTrend === "DECLINING" &&
    avoidanceSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    meaningfulnessSustained >= SUSTAINED_SIGNAL_MIN_DAYS
  ) {
    detected.push({
      signal: "MEANINGFULNESS_DEFERRAL",
      strength: strengthFromLevel(
        last(meaningfulness),
        THRESHOLDS.executionDeclining,
        "below",
        meaningfulnessSustained,
      ),
      sustainedDays: meaningfulnessSustained,
    });
  }

  const deepWorkTrend = calculateTrend(deepWorkContinuity);
  const deepWorkSustained = countTrailingSustained(
    rawDeepWorkContinuity,
    (value) => value <= THRESHOLDS.deepWorkDegraded,
  );
  if (
    deepWorkTrend === "DECLINING" &&
    deepWorkSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    last(deepWorkContinuity) <= THRESHOLDS.deepWorkDegraded
  ) {
    detected.push({
      signal: "DEEP_WORK_DEGRADATION",
      strength: strengthFromLevel(
        last(deepWorkContinuity),
        THRESHOLDS.deepWorkDegraded,
        "below",
        deepWorkSustained,
      ),
      sustainedDays: deepWorkSustained,
    });
  }

  const pacingTrend = calculateTrend(pacingQuality);
  const pacingSustained = countTrailingSustained(
    rawPacingQuality,
    (value) => value <= THRESHOLDS.pacingUnstable,
  );
  if (
    pacingTrend === "DECLINING" &&
    pacingSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    last(pacingQuality) <= THRESHOLDS.pacingUnstable
  ) {
    detected.push({
      signal: "PACING_INSTABILITY",
      strength: strengthFromLevel(
        last(pacingQuality),
        THRESHOLDS.pacingUnstable,
        "below",
        pacingSustained,
      ),
      sustainedDays: pacingSustained,
    });
  }

  if (timeline.points.length >= STRONG_SIGNAL_MIN_DAYS + 1) {
    const recentWindow = rawBehavioralComposite.slice(-3);
    const priorWindow = rawBehavioralComposite.slice(
      Math.max(0, rawBehavioralComposite.length - 6),
      Math.max(0, rawBehavioralComposite.length - 3),
    );
    const recentVolatility = meanDayToDayVolatility(recentWindow);
    const priorVolatility =
      priorWindow.length >= 2 ? meanDayToDayVolatility(priorWindow) : recentVolatility;
    const volatilitySustained = countTrailingVolatility(
      rawBehavioralComposite,
      THRESHOLDS.volatilityElevated,
    );

    if (
      recentVolatility >= THRESHOLDS.volatilityElevated &&
      priorVolatility > 0 &&
      recentVolatility >= priorVolatility * THRESHOLDS.volatilityAccelerationRatio
    ) {
      detected.push({
        signal: "VOLATILITY_ACCELERATION",
        strength: Math.min(
          100,
          (recentVolatility / THRESHOLDS.volatilityElevated) *
            50 *
            Math.min(1.5, 1 + (volatilitySustained - 1) * 0.15),
        ),
        sustainedDays: Math.max(SUSTAINED_SIGNAL_MIN_DAYS, volatilitySustained),
      });
    }
  }

  const planningEscapeSustained = countTrailingPaired(
    rawMeaningfulness,
    rawFragmentation,
    (meaning, frag) => meaning <= THRESHOLDS.executionDeclining && frag >= 50,
  );
  if (
    fragmentationTrend === "RISING" &&
    meaningfulnessTrend !== "RISING" &&
    planningEscapeSustained >= SUSTAINED_SIGNAL_MIN_DAYS &&
    last(meaningfulness) <= THRESHOLDS.executionDeclining &&
    last(fragmentation) >= 50
  ) {
    detected.push({
      signal: "PLANNING_ESCAPE",
      strength: strengthFromLevel(last(fragmentation), 50, "above", planningEscapeSustained),
      sustainedDays: planningEscapeSustained,
    });
  }

  const overcommitSustained = countTrailingPaired(
    rawExecutionQuality,
    rawRecoveryCapacity,
    (execution, recovery) => execution >= 58 && recovery <= 52,
  );
  if (
    recoveryTrend === "DECLINING" &&
    executionTrend === "RISING" &&
    timeline.points.length >= STRONG_SIGNAL_MIN_DAYS &&
    last(rawExecutionQuality) >= 58 &&
    last(rawRecoveryCapacity) <= 52 &&
    overcommitSustained >= SUSTAINED_SIGNAL_MIN_DAYS
  ) {
    detected.push({
      signal: "OVERCOMMITMENT_EXPANSION",
      strength: strengthFromLevel(100 - last(recoveryCapacity), 45, "above", overcommitSustained),
      sustainedDays: overcommitSustained,
    });
  }

  return detected;
}

/** Detect sustained behavioral signals from raw evidence timelines. */
export function detectBehavioralSignals(
  evidence: SessionEvidence[],
  dailyInputs: DailyInputs[],
  options?: SignalDetectionOptions,
): BehavioralSignal[] {
  return detectBehavioralSignalsDetailed(evidence, dailyInputs, options).map(
    (entry) => entry.signal,
  );
}

/** Full detection output including strength and duration metadata. */
export function detectBehavioralSignalsDetailed(
  evidence: SessionEvidence[],
  dailyInputs: DailyInputs[],
  options?: SignalDetectionOptions,
): DetectedSignal[] {
  const timeline = buildMetricTimeline(evidence, dailyInputs);
  const smoothingWindow = options?.smoothingWindow ?? DEFAULT_SMOOTHING_WINDOW;
  return detectFromTimeline(timeline, smoothingWindow);
}

export function resolveConfidenceBand(
  timeline: MetricTimeline,
  detectedCount: number,
): ConfidenceBand {
  const days = timeline.points.length;
  const completeness = averageCompleteness(timeline);

  if (days >= 5 && completeness >= 0.75 && detectedCount > 0) return "HIGH";
  if (days >= 3 && completeness >= 0.55) return "MEDIUM";
  return "LOW";
}
