import { useApp } from "@/lib/store";
import type { ReentryProtocol, RestartFriction } from "@/core/contracts/reentry";

export type ReentryTier = "short" | "medium" | "extended";

export type MomentumMemory = {
  statement: string;
  source: "northStar" | "tomorrowFocus" | "protocol" | "lastSession";
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function gapDaysFromLastCheckIn(lastCheckInDate: string): number {
  const today = new Date(todayStr());
  const last = new Date(lastCheckInDate);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

function tierFromGap(gap: number): ReentryTier | null {
  if (gap <= 1) return null;
  if (gap <= 2) return "short";
  if (gap <= 6) return "medium";
  return "extended";
}

function frictionForTier(tier: ReentryTier): RestartFriction[] {
  if (tier === "short") return ["UNCERTAINTY"];
  if (tier === "medium") return ["UNCERTAINTY", "AVOIDANCE"];
  return ["OVERWHELM", "SHAME", "COGNITIVE_CHAOS"];
}

export function buildReentryProtocol(gapDays: number): ReentryProtocol {
  const tier = tierFromGap(gapDays);
  if (!tier || tier === "short") {
    return {
      currentStage: "ASSESSMENT",
      backlogCompressionEnabled: false,
      visibleScopeReduction: 0.3,
      restartFrictionFactors: ["UNCERTAINTY"],
      recoveryPriorityWeight: 0.5,
      rhythmRebuildIntensity: 0.7,
    };
  }
  if (tier === "medium") {
    return {
      currentStage: "COMPRESSION",
      backlogCompressionEnabled: true,
      visibleScopeReduction: 0.6,
      restartFrictionFactors: ["UNCERTAINTY", "AVOIDANCE"],
      recoveryPriorityWeight: 0.7,
      rhythmRebuildIntensity: 0.5,
    };
  }
  return {
    currentStage: "MINIMUM_VIABLE_RESTART",
    backlogCompressionEnabled: true,
    visibleScopeReduction: 0.85,
    restartFrictionFactors: ["OVERWHELM", "SHAME", "COGNITIVE_CHAOS"],
    recoveryPriorityWeight: 0.9,
    rhythmRebuildIntensity: 0.3,
  };
}

export function useDormancyDetection(): {
  tier: ReentryTier | null;
  gapDays: number;
  lastActiveDate: string | null;
  frictionFactors: RestartFriction[];
} {
  const checkIns = useApp((s) => s.checkIns);
  const reentryAcknowledgedAt = useApp((s) => s.reentryAcknowledgedAt);

  if (checkIns.length === 0) {
    return { tier: null, gapDays: 0, lastActiveDate: null, frictionFactors: [] };
  }

  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = sorted[0].date;
  const gapDays = gapDaysFromLastCheckIn(lastDate);

  // Already acknowledged today — suppress
  if (reentryAcknowledgedAt) {
    const acknowledgedDate = reentryAcknowledgedAt.slice(0, 10);
    if (acknowledgedDate === todayStr()) {
      return { tier: null, gapDays, lastActiveDate: lastDate, frictionFactors: [] };
    }
  }

  const tier = tierFromGap(gapDays);
  return {
    tier,
    gapDays,
    lastActiveDate: lastDate,
    frictionFactors: tier ? frictionForTier(tier) : [],
  };
}

export function useMomentumMemory(): MomentumMemory | null {
  const tomorrowPlan = useApp((s) => s.tomorrowPlan);
  const checkIns = useApp((s) => s.checkIns);
  const recoveryPlan = useApp((s) => s.recoveryPlan);
  const history = useApp((s) => s.history);
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);
  const firstCheckInAt = useApp((s) => s.firstCheckInAt);

  // No memory for demo mode or fresh users
  if (dataIsSeeded) return null;
  if (!firstCheckInAt) return null;

  // Priority 1: tomorrowPlan.northStar
  if (tomorrowPlan?.northStar) {
    return {
      statement: `Your last north star: "${tomorrowPlan.northStar}"`,
      source: "northStar",
    };
  }

  // Priority 2: last check-in tomorrowFocus
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  const lastCheckIn = sorted[0];
  if (lastCheckIn?.tomorrowFocus) {
    return {
      statement: `Your last intention: "${lastCheckIn.tomorrowFocus}"`,
      source: "tomorrowFocus",
    };
  }

  // Priority 3: active recovery protocol
  if (recoveryPlan?.protocol) {
    const name =
      recoveryPlan.protocol.charAt(0).toUpperCase() + recoveryPlan.protocol.slice(1);
    return {
      statement: `You were following the ${name} recovery protocol`,
      source: "protocol",
    };
  }

  // Priority 4: last session fact
  if (history.length > 0) {
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
    const last = sortedHistory[0];
    const gapDays = gapDaysFromLastCheckIn(last.date);
    return {
      statement: `Your last session: ${last.completed} task${last.completed !== 1 ? "s" : ""} completed ${gapDays} day${gapDays !== 1 ? "s" : ""} ago`,
      source: "lastSession",
    };
  }

  return null;
}
