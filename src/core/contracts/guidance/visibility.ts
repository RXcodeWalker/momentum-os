import type { ActiveInterventionType } from "../interventions/types";
import type { InterventionLevel } from "../interventions/types";

export type PromptSurface = "morning-card" | "midday-nudge" | "evening-wizard" | "in-session-tip";

export type PromptVisibilityDirective = {
  allowMorningPrompts: boolean;
  allowMiddayPrompts: boolean;
  allowEveningPrompts: boolean;
  allowInSessionNudges: boolean;
  maxPromptsPerSession: number;
  suppressedSurfaces: PromptSurface[];
};

export type InterventionVisibilityRule = {
  maxSurfaceLevel: InterventionLevel;
  suppressedTypes: ActiveInterventionType[];
  allowModal: boolean;
  allowBanner: boolean;
  requireAcknowledgement: boolean;
};
