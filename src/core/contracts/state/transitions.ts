import type { Scalar, Timestamp } from "../primitives";
import type { UserMode } from "./modes";

export type StateTransition = {
  from: UserMode;
  to: UserMode;
  confidence: Scalar;
  supportingFactors: string[];
  sustainedSignalDurationDays: number;
  reversible: boolean;
  occurredAt: Timestamp;
};
