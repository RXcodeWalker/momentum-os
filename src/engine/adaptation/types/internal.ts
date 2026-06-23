import type { UserMode, UserTrajectory } from "@/core/contracts/state/modes";
import type { RiskLevel, Scalar } from "@/core/contracts/primitives";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { StateConfidence } from "@/core/contracts/state/confidence";
import type { AdaptationDirective } from "@/core/contracts/adaptation/directives";
import type { ExpansionDirective } from "@/core/contracts/expansion";

/** Mutable working copy mutated in-place by each pass. */
export type AdaptationDraft = {
  // Environmental
  interfaceDensity: number;
  spacingIntensity: number;
  visualNoiseLevel: number;
  motionIntensity: number;
  pacingFeel: number;
  hierarchySharpness: number;
  contrastStrength: number;
  visibleComplexity: number;
  deepWorkProtectionEnabled: boolean;
  dashboardCompressionLevel: number;
  // Execution
  visibleTaskLimit: number;
  recommendedChallengeLevel: number;
  workloadCompressionRatio: number;
  pacingRecommendation: string;
  deepWorkExpectation: number;
  recoveryWeighting: number;
  advancementWeighting: number;
  focusProtectionStrength: number;
  // Guidance
  messagingTone: string;
  interventionFrequency: number;
  reflectionDepth: number;
  strategicGuidanceWeight: number;
  emotionalPressureLevel: number;
  clarityOrientation: number;
  // Audit
  reasoning: string[];
};

/** Read-only context passed alongside draft to every pass. */
export type AdaptationContext = {
  readonly mode: UserMode;
  readonly trajectory: UserTrajectory;
  readonly burnoutRisk: RiskLevel;
  readonly overloadRisk: RiskLevel;
  readonly avoidanceRisk: RiskLevel;
  readonly collapseRisk: RiskLevel;
  readonly adaptationReadiness: Scalar;
  readonly recoveryDebt: Scalar;
  readonly cognitiveStrain: Scalar;
  readonly executionStability: Scalar;
  readonly emotionalFriction: Scalar;
  readonly activeSignalStrengths: Partial<Record<BehavioralSignal, Scalar>>;
  readonly resolvedDirectives: AdaptationDirective[];
  readonly stateConfidence: StateConfidence;
  readonly expansionDirective?: ExpansionDirective;
  readonly expansionPaceModifier?: number;
};
