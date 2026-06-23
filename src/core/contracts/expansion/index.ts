import type { ConfidenceBand, Scalar, Timestamp } from "../primitives";
import type { MomentumModel } from "../momentum";
import type { StateDynamics, StateDynamicsProfile } from "../state/dynamics";

export type ExpansionDirective = "hold" | "gradual_increase" | "increase" | "reduce";

export type ExpansionSignal = {
  id: string;
  label: string;
  direction: "supports_expansion" | "supports_hold" | "supports_reduction";
  /** Contribution weight — all signal weights sum ≈ 1.0 */
  weight: number;
  /** Normalized contribution in 0–1 space */
  normalizedValue: number;
  description: string;
};

export type SafetyConstraintId =
  | "VOLATILITY_GATE"
  | "RECOVERY_DEBT_GATE"
  | "AVOIDANCE_GATE"
  | "OSCILLATION_GATE"
  | "HOTSPOT_RISK"
  | "RECOVERY_MODE_GATE"
  | "STREAK_FRAGILITY_GATE";

export type SafetyConstraint = {
  id: SafetyConstraintId;
  triggered: boolean;
  /** blocking = vetos increase; dampening = reduces pace modifier only */
  severity: "blocking" | "dampening";
  description: string;
};

export type ChallengeBaseline = {
  /** modeBaseline + trajectoryAdjustment */
  currentLevel: number;
  /** Raw baseline by mode: RECOVERY=10, STABILIZING=30, FOCUSED=60, EXPANDING=80 */
  modeBaseline: number;
  /** Applied delta from trajectory: EXPANDING=+10, others=0 */
  trajectoryAdjustment: number;
};

export type ExpansionDecision = {
  directive: ExpansionDirective;
  /** 0–1; how aggressively to step in the directive's direction */
  paceModifier: number;
  challengeBaseline: ChallengeBaseline;
  /** Raw composite readiness score before gate evaluation: -100 to 100 */
  readinessScore: number;
  signals: ExpansionSignal[];
  safetyConstraints: SafetyConstraint[];
  confidence: ConfidenceBand;
  rationale: string;
  computedAt: Timestamp;
};

export type ExpansionEngineInput = {
  momentumModel: MomentumModel;
  stateDynamics: StateDynamics;
  dynamicsProfile: StateDynamicsProfile;
  /** overallAvoidancePressure from AvoidanceProfile: 0–100 */
  avoidancePressure: Scalar;
  /** Aggregate avg compatibility score across current tasks — null when no tasks */
  taskCompatibilityAvgScore: Scalar | null;
  recoveryMode: boolean;
  streakAtRisk: boolean;
  /** 7-day execution consistency: 0–1 */
  consistency: number;
  recoveryDebtAccumulating: boolean;
  checkInsCount: number;
};
