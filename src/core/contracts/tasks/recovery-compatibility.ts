import type { Scalar, Timestamp } from "../primitives";
import type { ConfidenceBand } from "../primitives";

export type RecoveryCompatibilityTier = "excellent" | "good" | "moderate" | "poor" | "harmful";

export type RecoveryCompatibilityFlag =
  | "COGNITIVE_OVERLOAD"
  | "EMOTIONAL_FRICTION_HIGH"
  | "RECOVERY_DEBT_AMPLIFIER"
  | "RESILIENCE_BUFFER_INSUFFICIENT"
  | "HISTORICAL_RECOVERY_FAILURE"
  | "FRAGMENTATION_RISK"
  | "MOMENTUM_SAFE"
  | "CAPACITY_ALIGNED";

export type RecoveryCompatibilityComponents = {
  recoveryDebtLoad: Scalar;
  cognitiveStrainLoad: Scalar;
  emotionalFrictionLoad: Scalar;
  resilienceBuffer: Scalar;
  historicalSuccessRate: Scalar;
};

export type RecoveryCompatibilityResult = {
  taskId: string;
  tier: RecoveryCompatibilityTier;
  score: Scalar;
  components: RecoveryCompatibilityComponents;
  flags: RecoveryCompatibilityFlag[];
  rationale: string;
  adaptationHint: string;
  confidence: ConfidenceBand;
  evaluatedAt: Timestamp;
};
