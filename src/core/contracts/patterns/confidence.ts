import type { Scalar, ConfidenceBand } from "../primitives";

export type PatternConfidenceFactors = {
  supportWeight: number;
  liftWeight: number;
  consistencyWeight: number;
  coverageWeight: number;
  recencyWeight: number;
};

export type PatternConfidence = {
  score: Scalar;
  band: ConfidenceBand;
  factors: PatternConfidenceFactors;
  rateInterval: { low: number; high: number };
};
