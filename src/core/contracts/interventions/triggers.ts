// Fix-1: BehavioralSignal now imported from signals/ (correct direction).
// Inline import() replaced with top-level import type for CooldownPolicy.perTypeOverrides.

import type { Scalar } from "../primitives";
import type { BehavioralSignal } from "../signals/behavioral-signals";
import type { InterventionType } from "./types";

export type CooldownPolicy = {
  defaultCooldownHours: number;
};

export type InterventionTrigger = {
  triggerType: InterventionType;
  requiredSignals: BehavioralSignal[];
  minimumConfidence: Scalar;
  cooldownPolicy: CooldownPolicy;
};
