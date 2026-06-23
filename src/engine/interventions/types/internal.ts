import type { Scalar } from "@/core/contracts/primitives";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type {
  ActiveInterventionType,
  InterventionLevel,
} from "@/core/contracts/interventions/types";

// ---------------------------------------------------------------------------
// Engine-internal types — NOT exported from core/contracts
// ---------------------------------------------------------------------------

/** A trigger rule that has been matched against the current SignalSnapshot. */
export type InterventionCandidate = {
  type: ActiveInterventionType;
  matchedSignals: BehavioralSignal[];
  minSignalDuration: number;
  evidenceScore: Scalar;
};

/** Per-candidate gate results from eligibility assessment. */
export type EligibilityAssessment = {
  candidateType: ActiveInterventionType;
  gate1_signalEvidence: boolean;
  gate2_stateCorroboration: boolean;
  gate3_sequencingSaturation: boolean;
  gate4_interruptionValue: boolean;
  gate5_constitutionalFilter: boolean;
  eligible: boolean;
  maxAllowedLevel: InterventionLevel;
  reason: string;
};

/** Cooldown gate result per candidate type. */
export type CooldownVerdict = {
  type: ActiveInterventionType;
  blocked: boolean;
  remainingHours: number;
  lastFiredAt?: string;
};

/** Suppression gate result per candidate. */
export type SuppressionVerdict = {
  type: ActiveInterventionType;
  suppressed: boolean;
  rule: string;
  hard: boolean;
  downgradeLevel?: InterventionLevel;
};

/** Priority resolution across all surviving candidates. */
export type PriorityResolution = {
  winner?: ActiveInterventionType;
  winnerTier: number;
  suppressed: Array<{ type: ActiveInterventionType; reason: string }>;
};

/** Internal EV estimate gating interruption worthiness. */
export type InterruptionCostEstimate = {
  expectedRegulatoryBenefit: Scalar;
  interruptionCost: Scalar;
  worthwhile: boolean;
};

/** Internal per-factor reasoning entry — not exposed publicly. */
export type InterventionReasoningFactor = {
  code: string;
  signal?: BehavioralSignal;
  observation: string;
  gate: "eligibility" | "suppression" | "cooldown" | "priority";
  influence: "qualifies" | "blocks" | "downgrades";
};
