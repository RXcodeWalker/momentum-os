import type { UserMode, UserTrajectory } from "@/core/contracts/state/modes";
import type { ConfidenceBand } from "@/core/contracts/primitives";
import type { StateExplanation, StateExplanationCode } from "@/core/contracts/state/explanation";

// ---------------------------------------------------------------------------
// Trust contract enforcement
// ---------------------------------------------------------------------------

const FORMULA_PATTERN = /\b(weight|score\s*=|coefficient|0\.\d{2,}|recoveryDebt\s*[=<>]|×)\b/i;

/** Returns true if the observation string contains formula or score leakage. */
export function observationContainsFormulaLeak(observation: string): boolean {
  return FORMULA_PATTERN.test(observation);
}

// ---------------------------------------------------------------------------
// Observation builders — probabilistic, non-diagnostic, non-blaming
// ---------------------------------------------------------------------------

function obs(
  code: StateExplanationCode,
  observation: string,
  confidence: ConfidenceBand,
): StateExplanation {
  return { code, observation, confidence };
}

// ---------------------------------------------------------------------------
// Mode-primary observations
// ---------------------------------------------------------------------------

export const MODE_OBSERVATIONS: Record<UserMode, (conf: ConfidenceBand) => StateExplanation> = {
  RECOVERY: (conf) =>
    obs(
      "RECOVERY_DEMAND_ELEVATED",
      "Recent patterns suggest increased recovery demand. A lighter load may support sustained performance over the coming days.",
      conf,
    ),
  STABILIZING: (conf) =>
    obs(
      "EXECUTION_RHYTHM_BUILDING",
      "Current conditions appear to be in a stabilizing phase. Consistent, moderate effort tends to be most effective here.",
      conf,
    ),
  FOCUSED: (conf) =>
    obs(
      "EXECUTION_RHYTHM_BUILDING",
      "Conditions look supportive of focused, sustained work. Maintaining current habits appears to be working.",
      conf,
    ),
  EXPANDING: (conf) =>
    obs(
      "EXPANSION_CONDITIONS_PRESENT",
      "Current conditions appear supportive of higher-intensity work if you choose to pursue it. Recent patterns suggest available capacity.",
      conf,
    ),
};

// ---------------------------------------------------------------------------
// Trajectory observations
// ---------------------------------------------------------------------------

export const TRAJECTORY_OBSERVATIONS: Record<
  UserTrajectory,
  (conf: ConfidenceBand) => StateExplanation
> = {
  EXPANDING: (conf) =>
    obs(
      "TRAJECTORY_IMPROVING",
      "The recent pattern across recovery, execution, and focus dimensions shows a positive direction.",
      conf,
    ),
  STABLE: (conf) =>
    obs(
      "TRAJECTORY_STABLE",
      "The recent pattern appears consistent — neither meaningfully improving nor declining.",
      conf,
    ),
  FRAGILE: (conf) =>
    obs(
      "TRAJECTORY_DECLINING",
      "The recent 14-day pattern suggests some softening across performance dimensions. This is an observation, not a verdict.",
      conf,
    ),
  CONTRACTING: (conf) =>
    obs(
      "TRAJECTORY_DECLINING",
      "The recent pattern shows a sustained reduction in output across recovery and execution dimensions. Early attention to recovery inputs may be helpful.",
      conf,
    ),
};

// ---------------------------------------------------------------------------
// Morning-specific mode observations — prospective framing for orientation
// ---------------------------------------------------------------------------

export const MORNING_MODE_OBSERVATIONS: Record<
  UserMode,
  (conf: ConfidenceBand) => StateExplanation
> = {
  RECOVERY: (conf) =>
    obs(
      "MORNING_RECOVERY_INDICATED",
      "This morning appears to be a recovery-pattern start. A smaller, more protected agenda tends to serve better on days like this.",
      conf,
    ),
  STABILIZING: (conf) =>
    obs(
      "MORNING_FRICTION_ACKNOWLEDGED",
      "Some initiation friction is present this morning. Starting with one concrete, bounded task tends to help the day find its rhythm.",
      conf,
    ),
  FOCUSED: (conf) =>
    obs(
      "MORNING_CONDITIONS_SUPPORTIVE",
      "Conditions look steady this morning. Focused, sustained work on a clear priority tends to work well here.",
      conf,
    ),
  EXPANDING: (conf) =>
    obs(
      "MORNING_CAPACITY_OBSERVED",
      "This morning appears well-supported for deeper work. The combination of rest and readiness suggests available capacity if you choose to use it.",
      conf,
    ),
};

// ---------------------------------------------------------------------------
// Special-case observations
// ---------------------------------------------------------------------------

export const SPARSE_EVIDENCE_OBSERVATION: StateExplanation = obs(
  "EVIDENCE_SPARSE",
  "Available data is limited — these observations carry lower certainty and will become more reliable with continued check-ins.",
  "LOW",
);

export const TRANSITION_OBSERVATION = (from: UserMode, to: UserMode): StateExplanation =>
  obs(
    "TRANSITION_DETECTED",
    `Conditions have shifted from a ${modeLabel(from)} state toward a ${modeLabel(to)} state based on recent patterns.`,
    "MEDIUM",
  );

// ---------------------------------------------------------------------------
// Mode rationale strings (developer/debug — not for direct UI display)
// ---------------------------------------------------------------------------

export const MODE_RATIONALE: Record<UserMode, string> = {
  RECOVERY:
    "RECOVERY was selected because sustained recovery demand indicators exceeded the entry threshold. This reflects aggregate patterns across sleep quality, physical energy, and stress signals over recent days.",
  STABILIZING:
    "STABILIZING was selected because one or more dimension indicators fell below the healthy operating range without meeting the RECOVERY entry threshold.",
  FOCUSED:
    "FOCUSED was selected as the default operational mode — all primary dimensions are within healthy ranges and no escalating signals are active.",
  EXPANDING:
    "EXPANDING was selected because all four gate conditions (recovery debt, cognitive strain, execution stability, emotional friction) were simultaneously met for the required number of consecutive days, with no active negative behavioral signals.",
};

export const TRAJECTORY_RATIONALE: Record<UserTrajectory, string> = {
  EXPANDING:
    "EXPANDING trajectory reflects a statistically rising composite score (recovery + execution + behavioral noise) over the recent window, with sufficient history to distinguish signal from noise.",
  STABLE:
    "STABLE trajectory reflects a flat composite score trend — sustained performance without directional movement.",
  FRAGILE:
    "FRAGILE trajectory reflects a moderate declining trend in the composite score. The decline is present but not steep enough to classify as CONTRACTING.",
  CONTRACTING:
    "CONTRACTING trajectory reflects a steep declining trend — the gap between the recent mean and the early-window mean exceeds the CONTRACTING threshold.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function modeLabel(mode: UserMode): string {
  switch (mode) {
    case "RECOVERY":
      return "recovery-focused";
    case "STABILIZING":
      return "stabilizing";
    case "FOCUSED":
      return "focused";
    case "EXPANDING":
      return "expanding";
  }
}
