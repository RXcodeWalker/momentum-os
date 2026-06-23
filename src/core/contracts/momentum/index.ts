import type { Scalar, Timestamp } from "../primitives";
import type { UserTrajectory } from "../state/modes";

export type MomentumClassification = "expanding" | "stable" | "fragile" | "contracting";

export type MomentumVelocity = "accelerating" | "steady" | "decelerating" | "stalled";

export type MomentumQuality = {
  fragilityScore: Scalar;
  sustainabilityScore: Scalar;
  isStructurallySound: boolean;
};

export type MomentumSignal = {
  id: string;
  label: string;
  contribution: "fragility" | "stability";
  weight: number;
  rawValue: number;
  normalizedValue: number;
};

export type MomentumModel = {
  classification: MomentumClassification;
  velocity: MomentumVelocity;
  quality: MomentumQuality;
  confidence: "low" | "medium" | "high";
  signals: MomentumSignal[];
  underlyingTrajectory: UserTrajectory | null;
  summary: string;
  computedAt: Timestamp;
};
