import type { UserMode } from "@/core/contracts/state/modes";
import type { ResolvedTask, ActiveInterventionView } from "@/hooks/internal/contracts";

export type FocusEntrySource = "manual" | "automatic" | "intervention";
export type FocusExitReason = "completion" | "interruption" | "inactivity" | "state-transition";
export type FocusSuppressionLevel = "none" | "partial" | "full";

export type FocusEnvironmentState = {
  active: boolean;
  enteredAt: string | null;
  entrySource: FocusEntrySource | null;
  lastManualDismissAt: string | null;
  /** Level-2 interventions held during focus, surfaced on exit. Cleared on dismiss or re-entry. */
  pendingPostFocusInterventions: ActiveInterventionView[];
  /** Engine-recommended focus window at session start, for session record. */
  sessionWindowMs: number | null;
  /** User mode at session start, for session record. */
  sessionEntryMode: string | null;
};

export type FocusEnvironmentView = {
  active: boolean;
  /** false under BURNOUT_PREVENTION L2+, OVERLOAD L1+; in RECOVERY only when primaryTask !== null */
  entryAllowed: boolean;
  /** true when DWP or FRAGMENTATION_REDUCTION fired AND lastManualDismissAt is null or > 4h ago */
  entryAutoSuggested: boolean;
  primaryTask: ResolvedTask | null;
  secondaryTask: ResolvedTask | null;
  /** 0 in RECOVERY expression */
  hiddenCount: number;
  suppressionLevel: FocusSuppressionLevel;
  navigationReduced: boolean;
  motionReduced: boolean;
  /** false in RECOVERY expression (hero absent entirely) */
  heroCompressed: boolean;
  /** level-2 interventions held during focus, shown on exit */
  heldInterventions: ActiveInterventionView[];
  mode: UserMode;
};
