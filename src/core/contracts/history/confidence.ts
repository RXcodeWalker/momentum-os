import type { ConfidenceBand } from "../primitives";

export type EvidenceConfidenceFactors = {
  historyDepth: number;
  sampleSize: number;
  signalConsistency: number;
  evidenceCompleteness: number;
};

export type EvidenceConfidence = {
  score: number;
  band: ConfidenceBand;
  factors: EvidenceConfidenceFactors;
  suppressionRecommended: boolean;
};
