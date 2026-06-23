import type { UserState } from "@/core/contracts/state/user-state";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import type { ReentryProtocol } from "@/core/contracts/reentry/protocol";
import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type { SuppressionVerdict, InterventionCandidate } from "../types/internal";
import {
  FRICTION_CEILING,
  LEVEL2_FATIGUE_THRESHOLD,
  LEVEL2_FATIGUE_WINDOW_HOURS,
  HARD_SUPPRESSION_EXEMPT,
} from "../matrix/intervention-matrix-v1";

// ---------------------------------------------------------------------------
// Hard suppression rules — candidate eliminated entirely
// T0 (BURNOUT_PREVENTION) and T1 (RECOVERY_ENFORCEMENT) are exempt from
// frictionCeiling and level2Fatigue — see HARD_SUPPRESSION_EXEMPT in matrix.
// ---------------------------------------------------------------------------

function reentryLock(
  type: ActiveInterventionType,
  reentry: ReentryProtocol | undefined,
): string | null {
  if (!reentry) return null;
  const lockedStages: ReentryProtocol["currentStage"][] = ["ASSESSMENT", "MINIMUM_VIABLE_RESTART"];
  if (lockedStages.includes(reentry.currentStage) && type !== "RESTART_ASSISTANCE") {
    return "REENTRY_LOCK";
  }
  return null;
}

function frictionCeiling(type: ActiveInterventionType, state: UserState): string | null {
  if (HARD_SUPPRESSION_EXEMPT.includes(type)) return null;
  if (state.emotionalFriction > FRICTION_CEILING) return "FRICTION_CEILING";
  return null;
}

function level2Fatigue(
  type: ActiveInterventionType,
  recent: InterventionAuditRecord[],
  nowMs: number,
): string | null {
  if (HARD_SUPPRESSION_EXEMPT.includes(type)) return null;
  const windowStart = new Date(nowMs - LEVEL2_FATIGUE_WINDOW_HOURS * 60 * 60 * 1000);
  const highLevelCount = recent.filter(
    (r) => r.level >= 2 && new Date(r.firedAt) >= windowStart,
  ).length;
  if (highLevelCount >= LEVEL2_FATIGUE_THRESHOLD) return "RECENT_LEVEL2_FATIGUE";
  return null;
}

export function applyHardRules(
  candidates: InterventionCandidate[],
  state: UserState,
  recent: InterventionAuditRecord[],
  reentry: ReentryProtocol | undefined,
  nowMs: number,
): SuppressionVerdict[] {
  return candidates.map((candidate) => {
    const rule =
      reentryLock(candidate.type, reentry) ??
      frictionCeiling(candidate.type, state) ??
      level2Fatigue(candidate.type, recent, nowMs);

    if (rule) {
      return { type: candidate.type, suppressed: true, rule, hard: true };
    }
    return { type: candidate.type, suppressed: false, rule: "", hard: true };
  });
}
