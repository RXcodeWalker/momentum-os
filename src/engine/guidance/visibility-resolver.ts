import type { Scalar } from "@/core/contracts/primitives";
import type { UserMode } from "@/core/contracts/state/modes";
import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type {
  PromptVisibilityDirective,
  PromptSurface,
  InterventionVisibilityRule,
} from "@/core/contracts/guidance/visibility";
import { FREQUENCY_THRESHOLDS } from "./config";

export function resolvePromptVisibility(
  interventionFrequency: Scalar,
  reasoning: string[],
): PromptVisibilityDirective {
  if (interventionFrequency <= FREQUENCY_THRESHOLDS.LOW_MAX) {
    reasoning.push(
      `Prompt visibility: LOW (frequency=${interventionFrequency}) — morning only, max 1/session.`,
    );
    return {
      allowMorningPrompts: true,
      allowMiddayPrompts: false,
      allowEveningPrompts: false,
      allowInSessionNudges: false,
      maxPromptsPerSession: 1,
      suppressedSurfaces: ["midday-nudge", "in-session-tip"] satisfies PromptSurface[],
    };
  }

  if (interventionFrequency <= FREQUENCY_THRESHOLDS.MODERATE_MAX) {
    reasoning.push(
      `Prompt visibility: MODERATE (frequency=${interventionFrequency}) — morning + evening, max 2/session.`,
    );
    return {
      allowMorningPrompts: true,
      allowMiddayPrompts: false,
      allowEveningPrompts: true,
      allowInSessionNudges: false,
      maxPromptsPerSession: 2,
      suppressedSurfaces: ["midday-nudge", "in-session-tip"] satisfies PromptSurface[],
    };
  }

  if (interventionFrequency <= FREQUENCY_THRESHOLDS.HIGH_MAX) {
    reasoning.push(
      `Prompt visibility: HIGH (frequency=${interventionFrequency}) — all surfaces except in-session, max 3/session.`,
    );
    return {
      allowMorningPrompts: true,
      allowMiddayPrompts: true,
      allowEveningPrompts: true,
      allowInSessionNudges: false,
      maxPromptsPerSession: 3,
      suppressedSurfaces: ["in-session-tip"] satisfies PromptSurface[],
    };
  }

  reasoning.push(
    `Prompt visibility: FULL (frequency=${interventionFrequency}) — all surfaces, unlimited.`,
  );
  return {
    allowMorningPrompts: true,
    allowMiddayPrompts: true,
    allowEveningPrompts: true,
    allowInSessionNudges: true,
    maxPromptsPerSession: Infinity,
    suppressedSurfaces: [],
  };
}

type InterventionVisibilityConfig = {
  maxSurfaceLevel: 0 | 1 | 2 | 3;
  suppressedTypes: ActiveInterventionType[];
  allowModal: boolean;
  allowBanner: boolean;
  requireAcknowledgement: boolean;
};

const MODE_INTERVENTION_VISIBILITY: Record<UserMode, InterventionVisibilityConfig> = {
  RECOVERY: {
    maxSurfaceLevel: 1,
    suppressedTypes: ["BURNOUT_PREVENTION", "AVOIDANCE_INTERRUPTION"],
    allowModal: false,
    allowBanner: false,
    requireAcknowledgement: false,
  },
  STABILIZING: {
    maxSurfaceLevel: 2,
    suppressedTypes: ["BURNOUT_PREVENTION"],
    allowModal: false,
    allowBanner: true,
    requireAcknowledgement: false,
  },
  FOCUSED: {
    maxSurfaceLevel: 2,
    suppressedTypes: [],
    allowModal: true,
    allowBanner: true,
    requireAcknowledgement: false,
  },
  EXPANDING: {
    maxSurfaceLevel: 2,
    suppressedTypes: ["RECOVERY_ENFORCEMENT"],
    allowModal: true,
    allowBanner: true,
    requireAcknowledgement: false,
  },
};

export function resolveInterventionVisibility(
  mode: UserMode,
  reasoning: string[],
): InterventionVisibilityRule {
  const config = MODE_INTERVENTION_VISIBILITY[mode];
  reasoning.push(
    `Intervention visibility: mode=${mode}, maxLevel=${config.maxSurfaceLevel}, modal=${config.allowModal}, banner=${config.allowBanner}.`,
  );
  return config;
}
