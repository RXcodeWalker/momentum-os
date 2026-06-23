import type { UserMode } from "@/core/contracts/state/modes";

export type EnvironmentTokens = {
  density: number; // 0–1
  spacing: number; // 0.75–1.50 (spacing multiplier)
  motion: number; // 0–1
  hierarchy: number; // 0–1
  pressure: number; // 0–1
};

export type EnvironmentBand = "low" | "moderate" | "elevated" | "high";

export type EnvironmentBands = {
  density: EnvironmentBand;
  spacing: EnvironmentBand; // bands computed from (spacing - 0.75) / 0.75
  motion: EnvironmentBand;
  hierarchy: EnvironmentBand;
  pressure: EnvironmentBand;
};

export type EnvironmentOverride = {
  id: string;
  source: "intervention" | "user" | "focus";
  tokens: Partial<EnvironmentTokens>;
  expiresAt: number; // ms timestamp, 0 = permanent until cleared
  priority: number; // higher wins when multiple active
};

export type CommittedEnvironmentSnapshot = {
  tokens: EnvironmentTokens;
  bands: EnvironmentBands;
  resolvedMode: UserMode | null;
  activeOverrideIds: string[];
  dataEnvAttributes: {
    "data-env-density": EnvironmentBand;
    "data-env-spacing": EnvironmentBand;
    "data-env-motion": EnvironmentBand;
    "data-env-hierarchy": EnvironmentBand;
    "data-env-pressure": EnvironmentBand;
    "data-mode": string;
  };
  committedAt: number;
  changed: boolean;
  /** Internal — tracks mode pending promotion through hysteresis. */
  _pendingMode?: { mode: UserMode; since: number };
};
