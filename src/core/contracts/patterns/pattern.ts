import type { Timestamp } from "../primitives";
import type { PatternCategory, PatternPolarity } from "./template";
import type { PatternEvidence } from "./evidence";
import type { PatternAssociation } from "./association";
import type { PatternConfidence } from "./confidence";
import type { PatternWindow } from "./window";
import type { PatternExplanation } from "./explanation";

export type PatternStatus = "EMERGING" | "ACTIVE" | "FADING" | "DORMANT" | "SUPPRESSED";

export type DetectedPattern = {
  patternId: string;
  templateId: string;
  category: PatternCategory;
  polarity: PatternPolarity;
  label: string;
  evidence: PatternEvidence;
  association: PatternAssociation;
  confidence: PatternConfidence;
  window: PatternWindow;
  status: PatternStatus;
  explanation: PatternExplanation;
  interventionEligible: boolean;
  firstObservedAt: Timestamp;
  lastObservedAt: Timestamp;
  computedAt: Timestamp;
};
