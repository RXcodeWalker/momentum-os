import type { Timestamp } from "../primitives";
import type { ReplayWindowScope } from "./window";
import type { ReplayNarrative } from "./narrative";
import type { ReplayAttribution } from "./attribution";
import type { ReplayTransitionSummary } from "./transition";
import type { ReplayForecast } from "./forecast";

export type ReplaySection = "narrative" | "attribution" | "transition" | "forecast";

export type TrustViolation = {
  section: ReplaySection;
  rule: string;
  correction: string;
};

export type ReplayTrustBoundary = {
  causalGuardFired: boolean;
  diagnosticGuardFired: boolean;
  formulaGuardFired: boolean;
  suppressedSections: ReplaySection[];
  violations: TrustViolation[];
};

export const REPLAY_SECTION_EVIDENCE_GATES = {
  narrative: { minimumCheckIns: 5, additionalGate: "evidenceDays >= 4" },
  attribution: { minimumCheckIns: 7, additionalGate: "confidence !== LOW" },
  transition: { minimumCheckIns: 10, additionalGate: "W7_PRIOR exists" },
  forecast: { minimumCheckIns: 21, additionalGate: "confidence MEDIUM or HIGH" },
} as const;

export type ReplayResult = {
  windowScope: ReplayWindowScope;
  generatedAt: Timestamp;
  narrative: ReplayNarrative;
  attribution: ReplayAttribution;
  transitionSummary: ReplayTransitionSummary;
  forecast: ReplayForecast;
  trustBoundary: ReplayTrustBoundary;
};
