import type { Timestamp } from "../primitives";
import type { UserState } from "./user-state";

/**
 * Frozen, versioned snapshot of UserState distributed to downstream engines.
 * Distinct from UserState so the snapshot contract can be versioned independently
 * without requiring all consumers to update simultaneously.
 * The `explanation` field is optional — not every pipeline run requires UI text.
 */
export type StateSnapshot = {
  readonly state: Readonly<UserState>;
  readonly capturedAt: Timestamp;
  readonly engineVersion: string;
  readonly explanation?: import("./explanation").StateExplanationResult;
};
