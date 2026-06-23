import type { Timestamp } from "../primitives";
import type { GuidanceSurface, GuidanceMessage } from "./messages";
import type { ReflectionDepthDirective } from "./depth";
import type { PromptVisibilityDirective, InterventionVisibilityRule } from "./visibility";

export type TrustBoundaryRule =
  | "NO_DIAGNOSTIC_LANGUAGE"
  | "NO_DETERMINISTIC_PREDICTION"
  | "NO_LEVEL3_IN_RECOVERY_TONE"
  | "NO_PRESSURE_IN_RECOVERY"
  | "NO_PRODUCTIVITY_PUSH_IN_CALM"
  | "NO_BLAME_IN_REFLECTION"
  | "COLLAPSE_RISK_CANNOT_SUPPRESS";

export type TrustBoundaryViolation = {
  rule: TrustBoundaryRule;
  blocked: boolean;
  correction: string;
};

export type GuidanceGenerationOutput = {
  surfaceMessages: Partial<Record<GuidanceSurface, GuidanceMessage>>;
  checkInDirective: ReflectionDepthDirective;
  promptVisibility: PromptVisibilityDirective;
  interventionVisibility: InterventionVisibilityRule;
  trustViolations: TrustBoundaryViolation[];
  generationReasoning: string[];
  generatedAt: Timestamp;
};
