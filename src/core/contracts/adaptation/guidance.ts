import type { Scalar } from "../primitives";

export type MessagingTone =
  | "CALM"
  | "STEADY"
  | "FOCUSED"
  | "CHALLENGING"
  | "STABILIZING"
  | "OBSERVATIONAL";

export type GuidanceAdaptation = {
  messagingTone: MessagingTone;
  interventionFrequency: Scalar;
  reflectionDepth: Scalar;
  strategicGuidanceWeight: Scalar;
  emotionalPressureLevel: Scalar;
  clarityOrientation: Scalar;
};
