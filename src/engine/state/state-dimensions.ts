import type { SessionEvidence } from "@/core/contracts/signals/session-evidence";
import type {
  StateDimensions,
  RecoveryDebtModel,
  CognitiveStrainModel,
  ExecutionStabilityModel,
  EmotionalFrictionModel,
} from "@/core/contracts/state/dimensions";
import type { TrendDirection } from "@/core/contracts/primitives";
import { movingAverage, weightedAverage, calculateTrend } from "@/engine/shared";
import {
  DIMENSION_SMOOTHING_WINDOW,
  EVIDENCE_DEFAULTS,
  EXHAUSTION_SCALE_FACTOR,
  EXHAUSTION_SLEEP_FLOOR,
  EXPANSION_READINESS_AMPLIFIER,
  THRESHOLDS,
  VOLATILITY_SCALE_FACTOR,
} from "./config";

// ---------------------------------------------------------------------------
// Internal series types — all values 0–100
// ---------------------------------------------------------------------------

type RawSeries = {
  sleepQuality: number[];
  physicalEnergy: number[];
  mentalClarity: number[];
  overwhelm: number[];
  emotionalResistance: number[];
  stressPressure: number[];
  meaningfulAdvancementQuality: number[];
  deepWorkContinuity: number[];
  executionIntegrity: number[];
  fragmentationLevel: number[];
  distractionPatterns: number[];
  avoidancePressure: number[];
  pacingQuality: number[];
};

type SmoothedSeries = RawSeries;

type RecentValues = {
  sleepQuality: number;
  physicalEnergy: number;
  mentalClarity: number;
  overwhelm: number;
  emotionalResistance: number;
  stressPressure: number;
  meaningfulAdvancementQuality: number;
  deepWorkContinuity: number;
  executionIntegrity: number;
  fragmentationLevel: number;
  distractionPatterns: number;
  avoidancePressure: number;
  pacingQuality: number;
};

// ---------------------------------------------------------------------------
// Public output type
// ---------------------------------------------------------------------------

export type DimensionResult = {
  core: StateDimensions;
  // Primary scalars (UserState fields)
  recoveryDebt: number;
  cognitiveStrain: number;
  executionStability: number;
  emotionalFriction: number;
  // Secondary scalars (UserState fields)
  momentumIntegrity: number;
  resilienceCapacity: number;
  overwhelmLevel: number;
  fragmentationLevel: number;
  recoveryCapacity: number;
  meaningfulEngagement: number;
  deepWorkContinuity: number;
  behavioralVolatility: number;
  // Readiness
  adaptationReadiness: number;
  expansionReadiness: number;
  // Trend directions
  consistencyTrend: TrendDirection;
  recoveryTrend: TrendDirection;
  engagementTrend: TrendDirection;
  /** Consecutive trailing days all EXPANDING dimension gates were satisfied. */
  expandingGateSustainedDays: number;
};

// ---------------------------------------------------------------------------
// Evidence extraction
// ---------------------------------------------------------------------------

function extractRawSeries(sorted: SessionEvidence[]): RawSeries {
  return {
    sleepQuality: sorted.map((e) => e.inputs.recoveryInputs.sleepQuality),
    physicalEnergy: sorted.map((e) => e.inputs.recoveryInputs.physicalEnergy),
    mentalClarity: sorted.map((e) => e.inputs.recoveryInputs.mentalClarity),
    overwhelm: sorted.map((e) => e.inputs.emotionalInputs.overwhelm),
    emotionalResistance: sorted.map((e) => e.inputs.emotionalInputs.emotionalResistance),
    stressPressure: sorted.map((e) => e.inputs.emotionalInputs.stressPressure),
    meaningfulAdvancementQuality: sorted.map(
      (e) => e.inputs.executionInputs.meaningfulAdvancementQuality,
    ),
    deepWorkContinuity: sorted.map((e) => e.inputs.executionInputs.deepWorkContinuity),
    executionIntegrity: sorted.map((e) => e.inputs.executionInputs.executionIntegrity),
    fragmentationLevel: sorted.map((e) => e.inputs.behavioralInputs.fragmentationLevel),
    distractionPatterns: sorted.map((e) => e.inputs.behavioralInputs.distractionPatterns),
    avoidancePressure: sorted.map((e) => e.inputs.behavioralInputs.avoidancePressure),
    pacingQuality: sorted.map((e) => e.inputs.behavioralInputs.pacingQuality),
  };
}

function applySmoothing(raw: RawSeries): SmoothedSeries {
  const w = DIMENSION_SMOOTHING_WINDOW;
  return {
    sleepQuality: movingAverage(raw.sleepQuality, w),
    physicalEnergy: movingAverage(raw.physicalEnergy, w),
    mentalClarity: movingAverage(raw.mentalClarity, w),
    overwhelm: movingAverage(raw.overwhelm, w),
    emotionalResistance: movingAverage(raw.emotionalResistance, w),
    stressPressure: movingAverage(raw.stressPressure, w),
    meaningfulAdvancementQuality: movingAverage(raw.meaningfulAdvancementQuality, w),
    deepWorkContinuity: movingAverage(raw.deepWorkContinuity, w),
    executionIntegrity: movingAverage(raw.executionIntegrity, w),
    fragmentationLevel: movingAverage(raw.fragmentationLevel, w),
    distractionPatterns: movingAverage(raw.distractionPatterns, w),
    avoidancePressure: movingAverage(raw.avoidancePressure, w),
    pacingQuality: movingAverage(raw.pacingQuality, w),
  };
}

function last(series: number[]): number {
  return series[series.length - 1];
}

function getRecentValues(smooth: SmoothedSeries): RecentValues {
  return {
    sleepQuality: last(smooth.sleepQuality),
    physicalEnergy: last(smooth.physicalEnergy),
    mentalClarity: last(smooth.mentalClarity),
    overwhelm: last(smooth.overwhelm),
    emotionalResistance: last(smooth.emotionalResistance),
    stressPressure: last(smooth.stressPressure),
    meaningfulAdvancementQuality: last(smooth.meaningfulAdvancementQuality),
    deepWorkContinuity: last(smooth.deepWorkContinuity),
    executionIntegrity: last(smooth.executionIntegrity),
    fragmentationLevel: last(smooth.fragmentationLevel),
    distractionPatterns: last(smooth.distractionPatterns),
    avoidancePressure: last(smooth.avoidancePressure),
    pacingQuality: last(smooth.pacingQuality),
  };
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** 0–100; 100 = perfectly consistent, 0 = wildly inconsistent. */
function consistency(values: number[]): number {
  return Math.max(0, 100 - stddev(values) * 2.5);
}

/** Day-to-day mean absolute variation in a composite behavioral index. */
function computeBehavioralVolatility(smooth: SmoothedSeries): number {
  const composite = smooth.fragmentationLevel.map(
    (f, i) => f * 0.4 + smooth.avoidancePressure[i] * 0.35 + (100 - smooth.pacingQuality[i]) * 0.25,
  );
  if (composite.length < 2) return 0;
  const deltas: number[] = [];
  for (let i = 1; i < composite.length; i++) {
    deltas.push(Math.abs(composite[i] - composite[i - 1]));
  }
  const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  return Math.min(100, avg * VOLATILITY_SCALE_FACTOR);
}

/** Captures high execution demand while recovery is declining — risk proxy. */
function computeSustainedIntensity(smooth: SmoothedSeries): number {
  const execLast = last(smooth.executionIntegrity);
  const recovLast =
    last(smooth.sleepQuality) * 0.4 +
    last(smooth.physicalEnergy) * 0.3 +
    last(smooth.mentalClarity) * 0.3;
  return Math.min(100, execLast * (1 - recovLast / 100));
}

/** Recency-weighted accumulated deficit below a recovery threshold. */
function computeExhaustionAccumulation(sleepSeries: number[]): number {
  const window = sleepSeries.slice(-7);
  if (window.length === 0) return 0;
  let acc = 0;
  for (let i = 0; i < window.length; i++) {
    const weight = (i + 1) / window.length;
    if (window[i] < EXHAUSTION_SLEEP_FLOOR) {
      acc += ((EXHAUSTION_SLEEP_FLOOR - window[i]) / EXHAUSTION_SLEEP_FLOOR) * weight;
    }
  }
  return Math.min(100, (acc / window.length) * EXHAUSTION_SCALE_FACTOR);
}

// ---------------------------------------------------------------------------
// Sub-model builders
// ---------------------------------------------------------------------------

function buildRecoveryDebtModel(
  recent: RecentValues,
  raw: RawSeries,
  smooth: SmoothedSeries,
): RecoveryDebtModel {
  return {
    sleepQuality: recent.sleepQuality,
    sleepConsistency: consistency(raw.sleepQuality),
    sustainedIntensity: computeSustainedIntensity(smooth),
    recoveryBehaviorQuality: weightedAverage(
      [recent.physicalEnergy, recent.mentalClarity],
      [0.5, 0.5],
    ),
    exhaustionAccumulation: computeExhaustionAccumulation(raw.sleepQuality),
  };
}

function deepWorkTrendFactor(trend: TrendDirection): number {
  if (trend === "RISING") return 0.5;
  if (trend === "STABLE") return 0.75;
  return 1.0;
}

function buildCognitiveStrainModel(
  recent: RecentValues,
  smooth: SmoothedSeries,
): CognitiveStrainModel {
  const deepWorkTrend = calculateTrend(smooth.deepWorkContinuity);
  const deepWorkDegradation =
    Math.max(0, 100 - last(smooth.deepWorkContinuity)) * deepWorkTrendFactor(deepWorkTrend);

  return {
    taskSwitchingRate: weightedAverage(
      [recent.fragmentationLevel, recent.distractionPatterns],
      [0.6, 0.4],
    ),
    ambiguityExposure: weightedAverage(
      [recent.stressPressure, 100 - recent.executionIntegrity],
      [0.5, 0.5],
    ),
    interruptionDensity: recent.distractionPatterns,
    activeCommitmentLoad: weightedAverage(
      [recent.executionIntegrity, recent.fragmentationLevel],
      [0.5, 0.5],
    ),
    deepWorkDegradation: Math.min(100, deepWorkDegradation),
  };
}

function buildExecutionStabilityModel(
  recent: RecentValues,
  raw: RawSeries,
  smooth: SmoothedSeries,
): ExecutionStabilityModel {
  return {
    meaningfulCompletionIntegrity: recent.meaningfulAdvancementQuality,
    rhythmConsistency: consistency(raw.executionIntegrity),
    followThroughReliability: recent.executionIntegrity,
    pacingStability: recent.pacingQuality,
    volatilityResistance: Math.max(0, 100 - computeBehavioralVolatility(smooth)),
  };
}

function buildEmotionalFrictionModel(recent: RecentValues): EmotionalFrictionModel {
  return {
    initiationResistance: weightedAverage(
      [recent.avoidancePressure, recent.emotionalResistance],
      [0.6, 0.4],
    ),
    avoidancePressure: recent.avoidancePressure,
    perfectionismPressure: weightedAverage(
      [recent.stressPressure, 100 - recent.executionIntegrity],
      [0.55, 0.45],
    ),
    overwhelmWeight: recent.overwhelm,
    uncertaintyResistance: weightedAverage(
      [recent.stressPressure, recent.emotionalResistance],
      [0.55, 0.45],
    ),
  };
}

// ---------------------------------------------------------------------------
// Scalar collapses
// ---------------------------------------------------------------------------

function collapseRecoveryDebt(m: RecoveryDebtModel): number {
  // sleepQuality and recoveryBehaviorQuality are the primary direct indicators;
  // exhaustionAccumulation captures multi-day accumulation. sustainedIntensity and
  // sleepConsistency remain on the sub-model for interpretability but are not
  // collapsed here to avoid over-dampening acute recovery deficits.
  return weightedAverage(
    [
      100 - m.sleepQuality, // direct sleep deficit
      100 - m.recoveryBehaviorQuality, // energy + mental clarity deficit
      m.exhaustionAccumulation, // accumulated multi-day fatigue
    ],
    [0.45, 0.35, 0.2],
  );
}

function collapseCognitiveStrain(m: CognitiveStrainModel): number {
  return weightedAverage(
    [
      m.taskSwitchingRate,
      m.ambiguityExposure,
      m.interruptionDensity,
      m.activeCommitmentLoad,
      m.deepWorkDegradation,
    ],
    [0.25, 0.2, 0.25, 0.15, 0.15],
  );
}

function collapseExecutionStability(m: ExecutionStabilityModel): number {
  return weightedAverage(
    [
      m.meaningfulCompletionIntegrity,
      m.rhythmConsistency,
      m.followThroughReliability,
      m.pacingStability,
      m.volatilityResistance,
    ],
    [0.3, 0.25, 0.2, 0.15, 0.1],
  );
}

function collapseEmotionalFriction(m: EmotionalFrictionModel): number {
  return weightedAverage(
    [
      m.initiationResistance,
      m.avoidancePressure,
      m.perfectionismPressure,
      m.overwhelmWeight,
      m.uncertaintyResistance,
    ],
    [0.25, 0.25, 0.15, 0.25, 0.1],
  );
}

/**
 * Checks whether all EXPANDING gate conditions are met using the smoothed value
 * at position `i` as the "recent" anchor. The consistency and exhaustion sub-
 * components still reference the full raw series — this is an intentional
 * approximation: rhythm and accumulated fatigue are inherently longitudinal and
 * don't need to be re-sliced per-day for a trailing count.
 */
function satisfiesExpandingGatesAtIndex(
  i: number,
  raw: RawSeries,
  smooth: SmoothedSeries,
): boolean {
  // Build a RecentValues snapshot from position i in the pre-computed smooth series
  const recentAtDay: RecentValues = {
    sleepQuality: smooth.sleepQuality[i],
    physicalEnergy: smooth.physicalEnergy[i],
    mentalClarity: smooth.mentalClarity[i],
    overwhelm: smooth.overwhelm[i],
    emotionalResistance: smooth.emotionalResistance[i],
    stressPressure: smooth.stressPressure[i],
    meaningfulAdvancementQuality: smooth.meaningfulAdvancementQuality[i],
    deepWorkContinuity: smooth.deepWorkContinuity[i],
    executionIntegrity: smooth.executionIntegrity[i],
    fragmentationLevel: smooth.fragmentationLevel[i],
    distractionPatterns: smooth.distractionPatterns[i],
    avoidancePressure: smooth.avoidancePressure[i],
    pacingQuality: smooth.pacingQuality[i],
  };

  const recoveryDebt = collapseRecoveryDebt(buildRecoveryDebtModel(recentAtDay, raw, smooth));
  const cognitiveStrain = collapseCognitiveStrain(buildCognitiveStrainModel(recentAtDay, smooth));
  const executionStability = collapseExecutionStability(
    buildExecutionStabilityModel(recentAtDay, raw, smooth),
  );
  const emotionalFriction = collapseEmotionalFriction(buildEmotionalFrictionModel(recentAtDay));

  return (
    recoveryDebt <= THRESHOLDS.expandingRecoveryDebt &&
    cognitiveStrain <= THRESHOLDS.expandingCognitiveStrain &&
    executionStability >= THRESHOLDS.expandingExecutionStability &&
    emotionalFriction <= THRESHOLDS.expandingEmotionalFriction
  );
}

/**
 * Counts consecutive trailing days on which all EXPANDING gate conditions were
 * satisfied. O(n) — uses pre-computed smooth series, not per-day re-smoothing.
 */
function computeExpandingGateSustainedDays(raw: RawSeries, smooth: SmoothedSeries): number {
  const n = smooth.sleepQuality.length;
  let count = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (satisfiesExpandingGatesAtIndex(i, raw, smooth)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Secondary scalars
// ---------------------------------------------------------------------------

function computeMomentumIntegrity(smooth: SmoothedSeries): number {
  // Use last() for the execution and meaningfulness components so the scalar
  // reflects recent performance, not an all-time mean anchored to old history.
  // Consistency uses the full window — rhythm is inherently longitudinal.
  const execRecent = last(smooth.executionIntegrity);
  const execConsistency = consistency(smooth.executionIntegrity);
  const meaningRecent = last(smooth.meaningfulAdvancementQuality);
  return weightedAverage([execRecent, execConsistency, meaningRecent], [0.4, 0.35, 0.25]);
}

function computeResilienceCapacity(
  recoveryCapacity: number,
  emotionalFriction: number,
  cognitiveStrain: number,
): number {
  const frictionFactor = 1 - emotionalFriction / 100;
  const strainFactor = 1 - cognitiveStrain / 100;
  return Math.min(100, recoveryCapacity * frictionFactor * strainFactor * 1.6);
}

// ---------------------------------------------------------------------------
// Default result (empty evidence)
// ---------------------------------------------------------------------------

/**
 * Synthesise a single neutral SessionEvidence entry from EVIDENCE_DEFAULTS so
 * that the default DimensionResult is always derived from the same collapse
 * pipeline as real evidence. This prevents the defaults from drifting when
 * weights or formulas change.
 */
function buildSyntheticDefaultEvidence(): SessionEvidence {
  const d = EVIDENCE_DEFAULTS;
  return {
    sessionId: "default-synthetic",
    capturedAt: new Date(0).toISOString(),
    evidenceType: "CHECK_IN",
    completeness: 1,
    inputs: {
      capturedAt: new Date(0).toISOString(),
      recoveryInputs: {
        sleepQuality: d.sleepQuality,
        physicalEnergy: d.physicalEnergy,
        mentalClarity: d.mentalClarity,
      },
      emotionalInputs: {
        overwhelm: d.overwhelm,
        emotionalResistance: d.emotionalResistance,
        stressPressure: d.stressPressure,
      },
      executionInputs: {
        meaningfulAdvancementQuality: d.meaningfulAdvancementQuality,
        deepWorkContinuity: d.deepWorkContinuity,
        executionIntegrity: d.executionIntegrity,
      },
      behavioralInputs: {
        fragmentationLevel: d.fragmentationLevel,
        distractionPatterns: d.distractionPatterns,
        avoidancePressure: d.avoidancePressure,
        pacingQuality: d.pacingQuality,
      },
    },
  };
}

function buildDefaultDimensions(): DimensionResult {
  // Run the real pipeline on one synthetic neutral evidence point so defaults
  // automatically stay consistent with whatever the collapse functions produce.
  return computeDimensions([buildSyntheticDefaultEvidence()]);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function computeDimensions(evidence: SessionEvidence[]): DimensionResult {
  if (evidence.length === 0) return buildDefaultDimensions();

  const sorted = [...evidence].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const raw = extractRawSeries(sorted);
  const smooth = applySmoothing(raw);
  const recent = getRecentValues(smooth);

  const recoveryDebtModel = buildRecoveryDebtModel(recent, raw, smooth);
  const cognitiveStrainModel = buildCognitiveStrainModel(recent, smooth);
  const execStabilityModel = buildExecutionStabilityModel(recent, raw, smooth);
  const emotionalFrictionModel = buildEmotionalFrictionModel(recent);

  const recoveryDebt = collapseRecoveryDebt(recoveryDebtModel);
  const cognitiveStrain = collapseCognitiveStrain(cognitiveStrainModel);
  const executionStability = collapseExecutionStability(execStabilityModel);
  const emotionalFriction = collapseEmotionalFriction(emotionalFrictionModel);

  const recoveryCapacity = weightedAverage(
    [recent.sleepQuality, recent.physicalEnergy, recent.mentalClarity],
    [0.4, 0.3, 0.3],
  );
  const overwhelmLevel = weightedAverage(
    [recent.overwhelm, recent.stressPressure, recent.emotionalResistance],
    [0.55, 0.25, 0.2],
  );
  const fragmentationLevel = weightedAverage(
    [recent.fragmentationLevel, recent.distractionPatterns],
    [0.6, 0.4],
  );
  const behavioralVolatility = computeBehavioralVolatility(smooth);
  const momentumIntegrity = computeMomentumIntegrity(smooth);
  const resilienceCapacity = computeResilienceCapacity(
    recoveryCapacity,
    emotionalFriction,
    cognitiveStrain,
  );
  const adaptationReadiness = Math.min(
    100,
    (recoveryCapacity / 100) * (1 - emotionalFriction / 100) * 100,
  );
  const expansionReadiness = Math.min(
    100,
    ((100 - recoveryDebt) / 100) *
      (executionStability / 100) *
      (1 - emotionalFriction / 100) *
      (1 - cognitiveStrain / 100) *
      EXPANSION_READINESS_AMPLIFIER,
  );
  const expandingGateSustainedDays = computeExpandingGateSustainedDays(raw, smooth);

  return {
    core: {
      recoveryDebt: recoveryDebtModel,
      cognitiveStrain: cognitiveStrainModel,
      executionStability: execStabilityModel,
      emotionalFriction: emotionalFrictionModel,
    },
    recoveryDebt,
    cognitiveStrain,
    executionStability,
    emotionalFriction,
    momentumIntegrity,
    resilienceCapacity,
    overwhelmLevel,
    fragmentationLevel,
    recoveryCapacity,
    meaningfulEngagement: recent.meaningfulAdvancementQuality,
    deepWorkContinuity: recent.deepWorkContinuity,
    behavioralVolatility,
    adaptationReadiness,
    expansionReadiness,
    consistencyTrend: calculateTrend(smooth.executionIntegrity),
    recoveryTrend: calculateTrend(smooth.sleepQuality),
    engagementTrend: calculateTrend(smooth.meaningfulAdvancementQuality),
    expandingGateSustainedDays,
  };
}
