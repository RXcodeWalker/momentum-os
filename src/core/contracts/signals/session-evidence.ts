// Fix-3: SessionEvidence is the canonical evidence contract bridging persistence to the state engine.
// The state engine input is: interpretState(evidence: SessionEvidence[]): UserState
// Distinct from DailyInputs (single-day check-in bundle) — SessionEvidence is the persisted record
// that becomes part of the multi-day history the state engine processes.

import type { Timestamp, Percentage } from "../primitives";
import type { DailyInputs } from "./daily-inputs";

export type SessionEvidenceType = "CHECK_IN" | "TASK_COMPLETION" | "MANUAL_CALIBRATION";

export type SessionEvidence = {
  sessionId: string;
  capturedAt: Timestamp;
  evidenceType: SessionEvidenceType;
  inputs: DailyInputs;
  /** Fraction of expected fields present — fed into StateConfidence.evidenceCoverage */
  completeness: Percentage;
};
