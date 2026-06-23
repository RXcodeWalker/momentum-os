import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type {
  InterventionCandidate,
  InterventionReasoningFactor,
  SuppressionVerdict,
  CooldownVerdict,
} from "../types/internal";
import type { PriorityResolution } from "../types/internal";

// ---------------------------------------------------------------------------
// Stage 8 — Build user-facing triggerReasoning strings (observational, no scores)
// ---------------------------------------------------------------------------

// Non-Partial: adding a new BehavioralSignal without an observation is a compile error.
const SIGNAL_OBSERVATIONS: Record<BehavioralSignal, string> = {
  RISING_FRAGMENTATION: "patterns suggest task switching has been increasing",
  DECLINING_EXECUTION_QUALITY: "recent execution quality may be declining",
  RECOVERY_COLLAPSE: "recovery patterns suggest significant depletion",
  AVOIDANCE_CLUSTERING: "patterns suggest meaningful tasks may be getting deferred",
  MEANINGFULNESS_DEFERRAL: "high-value tasks appear to be repeatedly postponed",
  OVERCOMMITMENT_EXPANSION: "commitment load may be exceeding sustainable capacity",
  DEEP_WORK_DEGRADATION: "deep focus continuity appears to be weakening",
  VOLATILITY_ACCELERATION: "behavioral patterns have become less stable",
  PLANNING_ESCAPE: "planning activity may be substituting for execution",
  PACING_INSTABILITY: "execution rhythm appears inconsistent",
};

const TYPE_GOALS: Record<ActiveInterventionType, { emotional: string; behavioral: string }> = {
  BURNOUT_PREVENTION: {
    emotional: "Protect sustainable capacity and prevent collapse",
    behavioral: "Shift to recovery-first sequencing and reduce cognitive load",
  },
  RECOVERY_ENFORCEMENT: {
    emotional: "Support the recovery process without pressure",
    behavioral: "Maintain recovery-aligned task sequencing",
  },
  OVERLOAD: {
    emotional: "Restore a manageable pace without self-judgment",
    behavioral: "Compress visible scope and protect pacing rhythm",
  },
  AVOIDANCE_INTERRUPTION: {
    emotional: "Acknowledge resistance without amplifying it",
    behavioral: "Surface one meaningful task and reduce initiation friction",
  },
  FRAGMENTATION_REDUCTION: {
    emotional: "Create space for sustained focus",
    behavioral: "Reduce task switching and protect continuity windows",
  },
  DEEP_WORK_PROTECTION: {
    emotional: "Protect conditions for meaningful work",
    behavioral: "Minimize interruptions during focus-eligible windows",
  },
  RESTART_ASSISTANCE: {
    emotional: "Make restarting feel achievable",
    behavioral: "Offer a minimal viable starting point without overwhelm",
  },
};

export function buildTriggerReasoning(
  candidate: InterventionCandidate,
  suppressedCandidates: PriorityResolution["suppressed"],
): string[] {
  const signalObservations = candidate.matchedSignals.map((sig) => SIGNAL_OBSERVATIONS[sig]);

  const durationNote =
    candidate.minSignalDuration >= 3
      ? `This pattern has been sustained for ${candidate.minSignalDuration}+ days.`
      : candidate.minSignalDuration >= 1
        ? "This pattern has appeared recently."
        : "This pattern was detected in current evidence.";

  return [...signalObservations, durationNote].filter(Boolean);
}

export function buildEvaluationNotes(
  hardVerdicts: SuppressionVerdict[],
  cooldownVerdicts: CooldownVerdict[],
  prioritySuppressed: PriorityResolution["suppressed"],
): string[] {
  const notes: string[] = [];

  for (const v of hardVerdicts.filter((v) => v.suppressed)) {
    notes.push(`${v.type}: suppressed by hard rule (${v.rule})`);
  }
  for (const v of cooldownVerdicts.filter((v) => v.blocked)) {
    notes.push(`${v.type}: cooldown active (${Math.round(v.remainingHours)}h remaining)`);
  }
  for (const s of prioritySuppressed) {
    notes.push(`${s.type}: ${s.reason}`);
  }

  return notes;
}

export function getGoals(type: ActiveInterventionType): { emotional: string; behavioral: string } {
  return TYPE_GOALS[type];
}
