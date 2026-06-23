import type { AdaptationOutput } from "@/core/contracts/adaptation/output";
import type { UserMode } from "@/core/contracts/state/modes";
import type {
  EnvironmentTokens,
  EnvironmentBands,
  EnvironmentBand,
  EnvironmentOverride,
  CommittedEnvironmentSnapshot,
} from "./types";
import { computeEnvironmentTokens } from "./compute-tokens";

const HYSTERESIS_THRESHOLD = 0.05;

const SSR_TOKENS: EnvironmentTokens = {
  density: 0.6,
  spacing: 1.0,
  motion: 0.5,
  hierarchy: 0.6,
  pressure: 0.4,
};

const SSR_BANDS: EnvironmentBands = {
  density: "moderate",
  spacing: "moderate",
  motion: "moderate",
  hierarchy: "moderate",
  pressure: "moderate",
};

export const SSR_ENVIRONMENT_SNAPSHOT: CommittedEnvironmentSnapshot = {
  tokens: SSR_TOKENS,
  bands: SSR_BANDS,
  resolvedMode: null,
  activeOverrideIds: [],
  dataEnvAttributes: {
    "data-env-density": "moderate",
    "data-env-spacing": "moderate",
    "data-env-motion": "moderate",
    "data-env-hierarchy": "moderate",
    "data-env-pressure": "moderate",
    "data-mode": "focused",
  },
  committedAt: 0,
  changed: false,
};

function toBand(value: number): EnvironmentBand {
  if (value < 0.3) return "low";
  if (value < 0.55) return "moderate";
  if (value < 0.75) return "elevated";
  return "high";
}

function deriveBands(tokens: EnvironmentTokens): EnvironmentBands {
  const spacingNormalized = (tokens.spacing - 0.75) / 0.75;
  return {
    density: toBand(tokens.density),
    spacing: toBand(spacingNormalized),
    motion: toBand(tokens.motion),
    hierarchy: toBand(tokens.hierarchy),
    pressure: toBand(tokens.pressure),
  };
}

function modeToDataAttr(mode: UserMode | null): string {
  if (!mode) return "focused";
  return mode.toLowerCase();
}

export type EnvironmentResolutionInput = {
  adaptationGeneration: AdaptationOutput | null;
  activeOverrides: EnvironmentOverride[];
  prefersReducedMotion: boolean;
  previousSnapshot: CommittedEnvironmentSnapshot | null;
};

export function resolveEnvironment(
  input: EnvironmentResolutionInput,
): CommittedEnvironmentSnapshot {
  const { adaptationGeneration, activeOverrides, prefersReducedMotion, previousSnapshot } = input;
  const prev = previousSnapshot ?? SSR_ENVIRONMENT_SNAPSHOT;

  // Pass 1 — Engine base or SSR fallback
  let tokens: EnvironmentTokens;
  if (adaptationGeneration === null) {
    tokens = { ...SSR_TOKENS };
  } else {
    const computed = computeEnvironmentTokens(adaptationGeneration.environmental);
    tokens = { ...computed.tokens };
  }

  // Pass 2 — Override merge (highest priority wins per-token, no blending)
  const now = Date.now();
  const activeNonExpired = activeOverrides
    .filter((o) => o.expiresAt === 0 || o.expiresAt > now)
    .sort((a, b) => b.priority - a.priority);

  const activeOverrideIds: string[] = [];
  const tokenKeys = ["density", "spacing", "motion", "hierarchy", "pressure"] as const;
  const overriddenTokens = { ...tokens };

  for (const override of activeNonExpired) {
    let applied = false;
    for (const key of tokenKeys) {
      if (override.tokens[key] !== undefined && overriddenTokens[key] === tokens[key]) {
        // Only apply if not already overridden by a higher-priority override
        overriddenTokens[key] = override.tokens[key]!;
        applied = true;
      }
    }
    if (applied) activeOverrideIds.push(override.id);
  }
  tokens = overriddenTokens;

  // Pass 3 — Reduced-motion clamp (unconditional — overrides cannot restore motion)
  if (prefersReducedMotion) {
    tokens = { ...tokens, motion: 0 };
  }

  // Pass 4 — Threshold hysteresis (token-level)
  const maxDelta = Math.max(...tokenKeys.map((k) => Math.abs(tokens[k] - prev.tokens[k])));
  if (maxDelta < HYSTERESIS_THRESHOLD) {
    return { ...prev, changed: false };
  }

  // Pass 5 — Mode hysteresis
  const rawMode: UserMode | null = adaptationGeneration?.stateMode ?? null;
  let resolvedMode = prev.resolvedMode;
  let pendingMode = prev._pendingMode;

  if (rawMode !== resolvedMode) {
    if (prev.resolvedMode === null) {
      // First run — promote immediately
      resolvedMode = rawMode;
      pendingMode = undefined;
    } else if (pendingMode && pendingMode.mode === rawMode) {
      // Second consecutive run with same new mode — promote
      resolvedMode = rawMode;
      pendingMode = undefined;
    } else {
      // First sighting of this mode — hold as pending
      pendingMode = rawMode !== null ? { mode: rawMode, since: now } : undefined;
    }
  } else {
    // Mode confirmed — clear any stale pending
    pendingMode = undefined;
  }

  // Pass 6 — Finalize
  const bands = deriveBands(tokens);

  const snapshot: CommittedEnvironmentSnapshot = {
    tokens,
    bands,
    resolvedMode,
    activeOverrideIds,
    dataEnvAttributes: {
      "data-env-density": bands.density,
      "data-env-spacing": bands.spacing,
      "data-env-motion": bands.motion,
      "data-env-hierarchy": bands.hierarchy,
      "data-env-pressure": bands.pressure,
      "data-mode": modeToDataAttr(resolvedMode),
    },
    committedAt: now,
    changed: true,
    _pendingMode: pendingMode,
  };

  return snapshot;
}
