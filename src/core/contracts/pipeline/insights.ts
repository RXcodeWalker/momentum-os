// Fix-1: BehavioralSignal now imported from signals/ — correct direction.
// Was previously imported from interventions/types.ts.

import type { ConfidenceBand } from "../primitives";
import type { BehavioralSignal } from "../signals/behavioral-signals";

export type BehavioralInsight = {
  observation: string;
  confidence: ConfidenceBand;
  supportingSignals: BehavioralSignal[];
  interventionEligible: boolean;
};
