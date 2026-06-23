import type { Scalar, Timestamp } from "../primitives";
import type { UserMode } from "../state/modes";
import type { StateConfidence } from "../state/confidence";
import type { EnvironmentalAdaptation } from "./environmental";
import type { ExecutionAdaptation } from "./execution";
import type { GuidanceAdaptation } from "./guidance";
import type { AdaptationTrace } from "./trace";

export type AdaptationOutput = {
  environmental: EnvironmentalAdaptation;
  execution: ExecutionAdaptation;
  guidance: GuidanceAdaptation;
  adaptationReasoning: string[];
  adaptationIntensity: Scalar;
  /** Lightweight state reference — avoids embedding full UserState. */
  stateMode: UserMode;
  stateConfidence: StateConfidence;
  generatedAt: Timestamp;
  /** Populated only in dev builds — undefined in production. */
  adaptationTrace?: AdaptationTrace;
};
