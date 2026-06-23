import type { Scalar, Timestamp, ConfidenceBand } from "../primitives";
import type { UserMode, UserTrajectory } from "../state/modes";

export type ReflectionScalars = {
  executionQuality: Scalar;
  pacingQuality: Scalar;
  meaningfulProgress: Scalar;
  fragmentationLevel: Scalar;
  recoveryQuality: Scalar;
  emotionalFriction: Scalar;
};

export type ReflectionOutput = {
  scalars: ReflectionScalars;
  deviations: Partial<Record<keyof ReflectionScalars, number>>;
  fragmentationImproved: boolean;
  meaningfulBreakthrough: boolean;
  recoveryStable: boolean;
  highResistanceCompleted: boolean;
  evidenceCompleteness: number;
  historyDays: number;
  capturedAt: Timestamp;
};

export type EveningObservationCode =
  | "FRAGMENTATION_CONTINUITY_IMPROVEMENT"
  | "HIGH_RESISTANCE_COMPLETION"
  | "MEANINGFUL_PROGRESS_ACHIEVED"
  | "RECOVERY_STABILITY_MAINTAINED"
  | "PACING_PROTECTION_OBSERVED"
  | "EXECUTION_CONTINUITY_HELD"
  | "EMOTIONAL_FRICTION_REDUCED";

export type SurfaceableObservation = {
  code: EveningObservationCode;
  text: string;
  confidence: ConfidenceBand;
  evidence: string[];
};

export type EveningReflectionRecord = {
  date: string;
  reflectionScalars: ReflectionScalars;
  observations: SurfaceableObservation[];
  suppressionApplied: boolean;
  suppressedCodes: EveningObservationCode[];
  workloadGuidance: "REDUCE" | "HOLD" | "EXPAND";
  confidenceContext: {
    band: ConfidenceBand;
    historyDays: number;
    reflectionCompleteness: number;
  };
  generatedAt: Timestamp;
  pipelineSnapshotMode: UserMode;
  pipelineSnapshotTrajectory: UserTrajectory;
};
