import type {
  ReflectionOutput,
  EveningObservationCode,
  SurfaceableObservation,
  EveningReflectionRecord,
} from "@/core/contracts/flow/reflection";
import type { BehavioralPipeline } from "@/core/contracts/pipeline/behavioral-pipeline";
import type { ConfidenceBand } from "@/core/contracts/primitives";
import { obs, OBSERVATION_TEXTS } from "./observation-templates";
import { shouldSuppressObservation } from "./suppression-rules";
import { REFLECTION_CONFIG } from "./reflection-config";

type CandidateResult = {
  code: EveningObservationCode;
  eligible: boolean;
  deviationMagnitude: number;
  evidence: string[];
};

function getBand(
  historyDays: number,
  completeness: number,
  deviationMagnitude: number,
  signalConsistency: ConfidenceBand,
  code: EveningObservationCode,
  history: EveningReflectionRecord[],
): ConfidenceBand {
  const recentCodes = history
    .slice(-REFLECTION_CONFIG.repetitionSuppressionWindow)
    .flatMap((r) => r.observations.map((o) => o.code));
  if (recentCodes.includes(code)) return "LOW";

  if (
    historyDays >= REFLECTION_CONFIG.minHistoryDaysForObservations &&
    completeness >= REFLECTION_CONFIG.minCompletenessForHigh &&
    deviationMagnitude >= REFLECTION_CONFIG.minDeviationMagnitudeForHigh &&
    signalConsistency !== "LOW"
  ) {
    return "HIGH";
  }

  if (
    historyDays >= REFLECTION_CONFIG.minHistoryDaysForDeviation &&
    completeness >= REFLECTION_CONFIG.minCompletenessForMedium &&
    deviationMagnitude >= REFLECTION_CONFIG.minDeviationMagnitudeForMedium
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function evaluateCandidates(ro: ReflectionOutput, pipeline: BehavioralPipeline): CandidateResult[] {
  const { scalars, deviations } = ro;
  const activeSignals = pipeline.signalSnapshot.activeSignals;

  return [
    {
      code: "FRAGMENTATION_CONTINUITY_IMPROVEMENT" as const,
      eligible:
        ro.fragmentationImproved &&
        (deviations.fragmentationLevel ?? 0) < REFLECTION_CONFIG.fragmentationImprovedThreshold &&
        ro.historyDays >= REFLECTION_CONFIG.minHistoryDaysForSomeRules &&
        !activeSignals.includes("RISING_FRAGMENTATION"),
      deviationMagnitude: Math.abs(deviations.fragmentationLevel ?? 0),
      evidence: [
        `fragmentationLevel deviation: ${(deviations.fragmentationLevel ?? 0).toFixed(1)}`,
      ],
    },
    {
      code: "HIGH_RESISTANCE_COMPLETION" as const,
      eligible:
        ro.highResistanceCompleted &&
        scalars.emotionalFriction > REFLECTION_CONFIG.emotionalFrictionHighThreshold &&
        (deviations.executionQuality ?? 0) >= 0 &&
        !activeSignals.includes("DECLINING_EXECUTION_QUALITY") &&
        !activeSignals.includes("AVOIDANCE_CLUSTERING"),
      deviationMagnitude: Math.abs(deviations.executionQuality ?? 0),
      evidence: [
        `emotionalFriction: ${scalars.emotionalFriction.toFixed(1)}`,
        `executionQuality deviation: ${(deviations.executionQuality ?? 0).toFixed(1)}`,
      ],
    },
    {
      code: "MEANINGFUL_PROGRESS_ACHIEVED" as const,
      eligible:
        ro.meaningfulBreakthrough &&
        scalars.meaningfulProgress >= 60 &&
        !activeSignals.includes("MEANINGFULNESS_DEFERRAL"),
      deviationMagnitude: Math.abs(deviations.meaningfulProgress ?? 0),
      evidence: [`meaningfulProgress: ${scalars.meaningfulProgress}`],
    },
    {
      code: "RECOVERY_STABILITY_MAINTAINED" as const,
      eligible:
        ro.recoveryStable &&
        (deviations.recoveryQuality ?? 0) > REFLECTION_CONFIG.recoveryStableThreshold &&
        pipeline.stateInterpretation.currentMode !== "RECOVERY" &&
        !activeSignals.includes("RECOVERY_COLLAPSE"),
      deviationMagnitude: Math.abs(deviations.recoveryQuality ?? 0),
      evidence: [`recoveryQuality deviation: ${(deviations.recoveryQuality ?? 0).toFixed(1)}`],
    },
    {
      code: "PACING_PROTECTION_OBSERVED" as const,
      eligible:
        (deviations.pacingQuality ?? 0) > REFLECTION_CONFIG.pacingProtectionThreshold &&
        !activeSignals.includes("PACING_INSTABILITY") &&
        ro.historyDays >= REFLECTION_CONFIG.minHistoryDaysForObservations,
      deviationMagnitude: Math.abs(deviations.pacingQuality ?? 0),
      evidence: [`pacingQuality deviation: ${(deviations.pacingQuality ?? 0).toFixed(1)}`],
    },
    {
      code: "EXECUTION_CONTINUITY_HELD" as const,
      eligible:
        scalars.executionQuality > REFLECTION_CONFIG.executionQualityGoodThreshold &&
        (deviations.executionQuality ?? 0) >= 0 &&
        scalars.fragmentationLevel < REFLECTION_CONFIG.fragmentationLowThreshold &&
        !activeSignals.includes("DECLINING_EXECUTION_QUALITY"),
      deviationMagnitude: Math.abs(deviations.executionQuality ?? 0),
      evidence: [
        `executionQuality: ${scalars.executionQuality.toFixed(1)}`,
        `fragmentationLevel: ${scalars.fragmentationLevel.toFixed(1)}`,
      ],
    },
    {
      code: "EMOTIONAL_FRICTION_REDUCED" as const,
      eligible:
        (deviations.emotionalFriction ?? 0) < REFLECTION_CONFIG.emotionalFrictionReducedThreshold &&
        scalars.emotionalFriction <= REFLECTION_CONFIG.emotionalFrictionLowThreshold &&
        ro.historyDays >= REFLECTION_CONFIG.minHistoryDaysForSomeRules,
      deviationMagnitude: Math.abs(deviations.emotionalFriction ?? 0),
      evidence: [`emotionalFriction deviation: ${(deviations.emotionalFriction ?? 0).toFixed(1)}`],
    },
  ];
}

export function evaluatePatterns(
  reflectionOutput: ReflectionOutput,
  pipeline: BehavioralPipeline,
  reflectionHistory: EveningReflectionRecord[],
): {
  observations: SurfaceableObservation[];
  suppressionApplied: boolean;
  suppressedCodes: EveningObservationCode[];
} {
  const mode = pipeline.stateInterpretation.currentMode;
  const activeSignals = pipeline.signalSnapshot.activeSignals;
  const signalConsistency = pipeline.signalSnapshot.confidence;

  // Only surface if meaningfulProgress is not 'no'
  const mp = (reflectionOutput as ReflectionOutput & { _mpRaw?: "yes" | "partial" | "no" | null })
    ._mpRaw;
  // (mp flag used only for MEANINGFUL_PROGRESS gating via meaningfulBreakthrough already)

  const candidates = evaluateCandidates(reflectionOutput, pipeline);
  const eligible = candidates.filter((c) => c.eligible);

  const suppressedCodes: EveningObservationCode[] = [];
  const surfaced: SurfaceableObservation[] = [];

  // Sort eligible by deviation magnitude descending
  const sorted = [...eligible].sort((a, b) => b.deviationMagnitude - a.deviationMagnitude);

  for (const candidate of sorted) {
    if (surfaced.length >= REFLECTION_CONFIG.maxObservations) break;

    // Compute confidence band for this candidate
    const band = getBand(
      reflectionOutput.historyDays,
      reflectionOutput.evidenceCompleteness,
      candidate.deviationMagnitude,
      signalConsistency,
      candidate.code,
      reflectionHistory,
    );

    // Suppress if not HIGH
    if (band !== "HIGH") {
      suppressedCodes.push(candidate.code);
      continue;
    }

    // Suppress based on mode/signals/repetition
    if (shouldSuppressObservation(candidate.code, activeSignals, mode, reflectionHistory)) {
      suppressedCodes.push(candidate.code);
      continue;
    }

    surfaced.push(
      obs(candidate.code, OBSERVATION_TEXTS[candidate.code], "HIGH", candidate.evidence),
    );
  }

  // Collect suppressed eligible candidates that weren't surfaced
  for (const candidate of sorted) {
    if (
      !surfaced.find((o) => o.code === candidate.code) &&
      !suppressedCodes.includes(candidate.code)
    ) {
      suppressedCodes.push(candidate.code);
    }
  }

  return {
    observations: surfaced,
    suppressionApplied: suppressedCodes.length > 0,
    suppressedCodes,
  };
}
