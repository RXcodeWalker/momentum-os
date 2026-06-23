/**
 * today-priority.ts — pure scoring logic for the Adaptive Daily Command Engine.
 * No React, no side-effects. All functions are deterministic given their inputs.
 */

import type { BehavioralView } from "@/hooks/internal/contracts";
import type { BehavioralIntelligence } from "@/lib/behavioral-intelligence";
import type { MorningCalibrationHook } from "@/hooks/useMorningCalibration";
import type { FocusEnvironmentView } from "@/core/contracts/focus/environment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardKey =
  | "intervention"
  | "recovery"
  | "aiAlert"
  | "committedTask"
  | "briefing"
  | "velocity"
  | "insight"
  | "blocker"
  | "yesterday"
  | "avoidance"
  | "expansion";

export type CardClass = "safety" | "degradation" | "optimization" | "info";

export type DirectiveKind =
  | "recovery-protocol"
  | "calibrate"
  | "check-in"
  | "focus-task"
  | "plan-tasks"
  | "onboarding";

export type PrimaryDirective = {
  kind: DirectiveKind;
  label: string;
  detail?: string;
  taskId?: string;
};

export type ScoredCard = {
  key: CardKey;
  score: number;
  class: CardClass;
};

// ---------------------------------------------------------------------------
// Severity bases
// ---------------------------------------------------------------------------

const SEVERITY_BASE: Record<CardClass, number> = {
  safety: 1000,
  degradation: 600,
  optimization: 300,
  info: 100,
};

// ---------------------------------------------------------------------------
// Context type used by both functions
// ---------------------------------------------------------------------------

export type PriorityContext = {
  behavioral: BehavioralView;
  intelligence: BehavioralIntelligence;
  morningCal: MorningCalibrationHook;
  focusEnv: FocusEnvironmentView;
  phase: "morning" | "midday" | "evening";
  hasCheckedInToday: boolean;
  dismissedYesterday: boolean;
  yesterdayCheckIn: { reflection?: string; tomorrowFocus?: string } | null;
  aiAlert: { detected: boolean; title?: string; body?: string; confidence?: number | string };
  velocityDeclining: boolean;
  velocityDropPts: number;
  velocityDayCount: number;
  hasCommittedInsight: boolean;
  hasBlockerStreak: boolean;
  blockerStreakDays: number;
};

// ---------------------------------------------------------------------------
// selectPrimaryDirective
// ---------------------------------------------------------------------------

export function selectPrimaryDirective(ctx: PriorityContext): PrimaryDirective {
  const { behavioral, morningCal, phase, hasCheckedInToday, intelligence } = ctx;

  // 1. Not onboarded / cold start
  if (!intelligence.dataReadiness.hasMinimumData) {
    return {
      kind: "onboarding",
      label: "Complete your first check-in",
      detail: "Takes 2 minutes — unlocks your behavioral profile.",
    };
  }

  // 2. Recovery mode
  if (behavioral.state.mode === "RECOVERY") {
    return {
      kind: "recovery-protocol",
      label: "View your recovery protocol",
      detail: "Smaller surface, faster reps.",
    };
  }

  // 3. Morning, not calibrated
  if (phase === "morning" && !morningCal.isComplete && !morningCal.wasSkipped) {
    return {
      kind: "calibrate",
      label: "Calibrate your day",
      detail: "Set your anchor task and intention.",
    };
  }

  // 4. Evening, not reflected
  if (phase === "evening" && !hasCheckedInToday) {
    return {
      kind: "check-in",
      label: "Start evening reflection",
      detail: "Close the loop — unlock tomorrow's briefing.",
    };
  }

  // 5. Committed task from morning calibration
  if (morningCal.isComplete && morningCal.committedTask) {
    return {
      kind: "focus-task",
      label: morningCal.committedTask.label,
      detail: "Your committed anchor for today.",
      taskId: morningCal.committedTask.id,
    };
  }

  // 6. Primary task from behavioral pipeline
  const primaryTask = behavioral.tasks.primaryTask;
  if (primaryTask) {
    return {
      kind: "focus-task",
      label: primaryTask.label,
      detail:
        behavioral.state.guidance.tone === "challenging"
          ? "Push the depth here."
          : "One thing done well.",
      taskId: primaryTask.id,
    };
  }

  // Fallback
  return {
    kind: "plan-tasks",
    label: "Plan your first 3 priorities",
    detail: "Build your execution surface for today.",
  };
}

// ---------------------------------------------------------------------------
// scoreAndRankCards
// ---------------------------------------------------------------------------

export function scoreAndRankCards(ctx: PriorityContext): ScoredCard[] {
  const {
    behavioral,
    intelligence,
    morningCal,
    focusEnv,
    phase,
    aiAlert,
    velocityDeclining,
    hasCommittedInsight,
    hasBlockerStreak,
    blockerStreakDays,
    dismissedYesterday,
    yesterdayCheckIn,
  } = ctx;

  if (focusEnv.active) return [];

  const { shell } = behavioral;
  const mode = behavioral.state.mode;
  const traj = behavioral.state.trajectory;
  const conf = intelligence.composite.systemConfidence;

  const isRecovery = mode === "RECOVERY";
  const surfaceLevel = shell.surfaceLevel;

  // Candidate eligibility + raw score
  const candidates: Array<{ key: CardKey; class: CardClass; eligible: boolean; base?: number }> = [
    {
      key: "intervention",
      class: "safety",
      eligible:
        behavioral.interventions.highestLevel >= 1 && behavioral.interventions.highestLevel < 3,
    },
    {
      key: "recovery",
      class: "safety",
      eligible: !!(behavioral.state.mode === "RECOVERY"),
    },
    {
      key: "aiAlert",
      class: "optimization",
      eligible: !!(aiAlert.detected && surfaceLevel !== "minimal"),
    },
    {
      key: "velocity",
      class: "degradation",
      eligible: !!(
        velocityDeclining &&
        behavioral.tasks.workload.guidance === "reduce" &&
        surfaceLevel !== "minimal"
      ),
    },
    {
      key: "blocker",
      class: "degradation",
      eligible: !!(surfaceLevel === "full" && hasBlockerStreak && blockerStreakDays >= 3),
    },
    {
      key: "avoidance",
      class: "degradation",
      eligible: !!(
        intelligence.avoidance &&
        intelligence.avoidance.activePatterns.length > 0 &&
        conf !== "LOW" &&
        !isRecovery &&
        surfaceLevel !== "minimal"
      ),
    },
    {
      key: "expansion",
      class: "optimization",
      eligible: !!(
        intelligence.expansion &&
        (intelligence.expansion.directive === "increase" ||
          intelligence.expansion.directive === "reduce") &&
        !isRecovery &&
        !intelligence.avoidance?.activePatterns.length &&
        surfaceLevel === "full"
      ),
    },
    {
      key: "committedTask",
      class: "optimization",
      eligible: !!(morningCal.isComplete && morningCal.committedTask),
    },
    {
      key: "briefing",
      class: "optimization",
      eligible: !!(surfaceLevel !== "minimal" && behavioral.state.mode !== "RECOVERY"),
      // Will be further gated by caller with tomorrowBriefing.hasPlan
    },
    {
      key: "insight",
      class: "optimization",
      eligible: !!(surfaceLevel !== "minimal" && hasCommittedInsight),
    },
    {
      key: "yesterday",
      class: "info",
      eligible: !!(
        surfaceLevel !== "minimal" &&
        phase === "morning" &&
        !morningCal.isComplete &&
        !dismissedYesterday &&
        yesterdayCheckIn &&
        (yesterdayCheckIn.reflection || yesterdayCheckIn.tomorrowFocus)
      ),
    },
  ];

  const scored: ScoredCard[] = [];

  for (const c of candidates) {
    if (!c.eligible) continue;

    let score = SEVERITY_BASE[c.class];

    // Confidence boost (degradation/avoidance require MEDIUM+)
    if (c.class === "degradation" || c.key === "avoidance") {
      if (conf === "HIGH") score += 120;
      else if (conf === "MEDIUM") score += 60;
    } else if (c.class === "optimization") {
      if (conf === "HIGH") score += 80;
      else if (conf === "MEDIUM") score += 40;
    }

    // State relevance boost
    if (c.key === "recovery" && isRecovery) score += 150;
    if (c.key === "velocity" && traj === "CONTRACTING") score += 100;
    if (c.key === "avoidance" && (traj === "CONTRACTING" || traj === "FRAGILE")) score += 80;
    if (c.key === "expansion" && mode === "EXPANDING") score += 80;
    if (c.key === "expansion" && traj === "EXPANDING") score += 60;
    if (c.key === "blocker" && traj === "CONTRACTING") score += 80;

    // Phase boost (time-sensitive cards)
    if (c.key === "briefing" && phase === "morning") score += 60;
    if (c.key === "yesterday" && phase === "morning") score += 30;

    // Staleness penalty for info cards
    if (c.key === "yesterday" && phase !== "morning") score -= 100;

    // Recovery mode: suppress optimization / info
    if (isRecovery && (c.class === "optimization" || c.class === "info") && c.key !== "recovery") {
      score -= 500; // effectively suppresses below safety floor
    }

    scored.push({ key: c.key, score, class: c.class });
  }

  return scored.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// resolveBudget
// ---------------------------------------------------------------------------

export function resolveBudget(
  surfaceLevel: "minimal" | "reduced" | "full",
  mode: string,
  overwhelmLevel?: number,
): number {
  if (surfaceLevel === "minimal" || mode === "RECOVERY" || (overwhelmLevel ?? 0) >= 2) return 1;
  if (surfaceLevel === "reduced") return 2;
  return 3;
}
