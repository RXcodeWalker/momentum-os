// Fix-2: activeTransition and previousMode removed.
// StateTransition is now a separate pipeline event on BehavioralPipeline.pendingTransition?.
// Downstream engines always receive a stable, complete UserState.

import type { Scalar, Timestamp, TrendDirection, RiskLevel } from "../primitives";
import type { UserMode, UserTrajectory } from "./modes";
import type { StateConfidence } from "./confidence";

export type UserState = {
  // Derived scalars
  recoveryDebt: Scalar;
  cognitiveStrain: Scalar;
  executionStability: Scalar;
  emotionalFriction: Scalar;
  momentumIntegrity: Scalar;
  resilienceCapacity: Scalar;
  overwhelmLevel: Scalar;
  fragmentationLevel: Scalar;
  recoveryCapacity: Scalar;
  meaningfulEngagement: Scalar;
  deepWorkContinuity: Scalar;
  behavioralVolatility: Scalar;

  // Mode and trajectory
  currentMode: UserMode;
  currentTrajectory: UserTrajectory;

  // Risk assessment
  overloadRisk: RiskLevel;
  burnoutRisk: RiskLevel;
  avoidanceRisk: RiskLevel;
  collapseRisk: RiskLevel;

  // Readiness
  adaptationReadiness: Scalar;
  expansionReadiness: Scalar;

  // Trends
  consistencyTrend: TrendDirection;
  recoveryTrend: TrendDirection;
  engagementTrend: TrendDirection;

  // Confidence
  confidence: StateConfidence;

  lastUpdatedAt: Timestamp;
  // NOTE: No previousMode, no activeTransition — stable snapshot only.
};
