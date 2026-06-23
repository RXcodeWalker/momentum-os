import type { Scalar, Timestamp } from "../primitives";

export type ExecutionWeight = {
  meaningfulnessWeight: Scalar;
  executionQualityWeight: Scalar;
  momentumContributionWeight: Scalar;
  goalAlignmentWeight: Scalar;
  recoveryCompatibilityWeight: Scalar;
  finalExecutionWeight: Scalar;
};

export type ResistanceWeight = {
  emotionalResistanceWeight: Scalar;
  ambiguityWeight: Scalar;
  reversibilityWeight: Scalar;
  initiationDelayWeight: Scalar;
  finalResistanceWeight: Scalar;
};

export type RecoveryBurden = {
  cognitiveBurden: Scalar;
  depletionBurden: Scalar;
  fragmentationBurden: Scalar;
  totalBurdenScore: Scalar;
};

/** Unified per-task evaluation — primary Task Intelligence output. */
export type TaskScore = {
  taskId: string;
  execution: ExecutionWeight;
  resistance: ResistanceWeight;
  burden: RecoveryBurden;
  /** Net priority after sustainability weighting. */
  netPriority: Scalar;
  recoveryCompatibility?: import("./recovery-compatibility").RecoveryCompatibilityResult;
  evaluatedAt: Timestamp;
};

/** Per-task evaluation row in pipeline. */
export type TaskEvaluation = {
  task: import("./task").Task;
  score: TaskScore;
};
