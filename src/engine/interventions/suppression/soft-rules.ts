import type { UserState } from "@/core/contracts/state/user-state";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { SequencingDecision } from "@/core/contracts/tasks/sequencing";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import type { InterventionLevel } from "@/core/contracts/interventions/types";
import type { SuppressionAdvisory } from "@/core/contracts/interventions/intelligence";
import type {
  EligibilityAssessment,
  SuppressionVerdict,
  InterventionCandidate,
} from "../types/internal";
import { sequencingIsSaturated } from "../shared/sequencing-saturation";

// ---------------------------------------------------------------------------
// Soft suppression rules — downgrade level or merge to level-0 rather than eliminate
// ---------------------------------------------------------------------------

function lowConfidenceDowngrade(
  snapshot: SignalSnapshot,
  maxLevel: InterventionLevel,
): InterventionLevel | null {
  if (snapshot.confidence === "LOW" && maxLevel > 1) return 1;
  return null;
}

function interventionFatigue(
  recent: InterventionAuditRecord[],
  maxLevel: InterventionLevel,
  nowMs: number,
): InterventionLevel | null {
  const cutoff = nowMs - 24 * 60 * 60 * 1000;
  const last24h = recent.filter((r) => new Date(r.firedAt).getTime() > cutoff && r.level >= 1);
  if (last24h.length >= 1 && maxLevel > 1) return 1;
  return null;
}

/**
 * Compute DEMOTE downgrade level from intelligence advisory.
 * DEMOTE caps the max level at maxLevel − 1 (min 1 — type never fully zeroed by advisor).
 */
function intelligenceDemote(
  type: InterventionCandidate["type"],
  maxLevel: InterventionLevel,
  suppressionAdvisories: SuppressionAdvisory[] | undefined,
): InterventionLevel | null {
  if (!suppressionAdvisories) return null;
  const advisory = suppressionAdvisories.find((a) => a.type === type);
  if (!advisory || advisory.action !== "DEMOTE") return null;
  // Cap at maxLevel − 1, floor at 1 (never zero-suppress via advisory)
  const demotedLevel = Math.max(1, maxLevel - 1) as InterventionLevel;
  return demotedLevel < maxLevel ? demotedLevel : null;
}

export function applySoftRules(
  candidates: InterventionCandidate[],
  assessments: EligibilityAssessment[],
  state: UserState,
  snapshot: SignalSnapshot,
  sequencing: SequencingDecision,
  recent: InterventionAuditRecord[],
  nowMs: number,
  suppressionAdvisories?: SuppressionAdvisory[],
): SuppressionVerdict[] {
  const saturated = sequencingIsSaturated(sequencing);

  return candidates.map((candidate) => {
    const assessment = assessments.find((a) => a.candidateType === candidate.type);
    const maxLevel = assessment?.maxAllowedLevel ?? 0;

    const demoteLevel = intelligenceDemote(candidate.type, maxLevel, suppressionAdvisories);

    const downgradeLevel: InterventionLevel | null =
      (saturated ? (0 as InterventionLevel) : null) ??
      lowConfidenceDowngrade(snapshot, maxLevel) ??
      interventionFatigue(recent, maxLevel, nowMs) ??
      demoteLevel;

    if (downgradeLevel !== null) {
      let rule: string;
      if (saturated) rule = "SEQUENCING_SATURATED";
      else if (demoteLevel !== null && downgradeLevel === demoteLevel) rule = "INTELLIGENCE_DEMOTE";
      else rule = "LOW_CONFIDENCE_OR_FATIGUE";

      return {
        type: candidate.type,
        suppressed: false,
        rule,
        hard: false,
        downgradeLevel,
      };
    }

    return { type: candidate.type, suppressed: false, rule: "", hard: false };
  });
}
