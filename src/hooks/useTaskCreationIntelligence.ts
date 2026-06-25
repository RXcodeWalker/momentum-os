import { useMemo } from "react";
import { useApp, useTaskIntelligence, useUserState } from "@/lib/store";
import type { Task } from "@/lib/store";

export type WarningKind = "recovery-conflict" | "overloaded";

type TaskType = Task["type"];

const DEFAULT_ORDER: TaskType[] = ["deep", "shallow", "movement", "admin", "wind-down"];
const RECOVERY_ORDER: TaskType[] = ["movement", "shallow", "admin", "wind-down", "deep"];

export function useTaskCreationIntelligence({
  type,
  labelFocused,
}: {
  type: TaskType;
  labelFocused: boolean;
}) {
  const { state } = useUserState();
  const taskIntel = useTaskIntelligence();
  const taskCount = useApp((s) => s.tasks.length);

  return useMemo(() => {
    const { todayLoadRisk, rescheduleAlerts, actual, recommended, suggestedCap } = taskIntel;
    const inRecovery = state === "recovery";
    const inBurnout = state === "burnout";

    // Tier 1 — silent adaptation
    const orderedTypes: TaskType[] = inRecovery || inBurnout ? RECOVERY_ORDER : DEFAULT_ORDER;

    const degradedTypes: TaskType[] = [];
    if ((actual.deep ?? 0) >= (recommended.deep ?? 1)) {
      degradedTypes.push("deep");
    }

    // Tier 2 — positive signal (only if label not focused)
    let positiveSignal: string | null = null;
    if (!labelFocused) {
      if (inRecovery && type === "movement") {
        positiveSignal = "Recovery-compatible — builds momentum without depleting reserves.";
      } else if (inBurnout && type === "shallow") {
        positiveSignal = "Good fit for today — low cognitive cost, real completion.";
      } else if (todayLoadRisk === "overloaded" && (type === "movement" || type === "shallow")) {
        positiveSignal = "This keeps your load in range.";
      }
    }

    // Tier 3 — subtle guidance (only if no positive signal and label not focused)
    let guidanceSignal: string | null = null;
    if (!positiveSignal && !labelFocused) {
      if (type === "deep" && (actual.deep ?? 0) >= (recommended.deep ?? 1)) {
        guidanceSignal = `${actual.deep} deep tasks already planned — ${recommended.deep} is your sweet spot for ${state} days.`;
      } else if (taskCount === suggestedCap - 1) {
        guidanceSignal = "Last slot at your recommended capacity.";
      }
    }

    // Tier 4 — explicit warnings
    let activeWarning: WarningKind | null = null;
    if (inRecovery && type === "deep") {
      activeWarning = "recovery-conflict";
    } else if (todayLoadRisk === "overloaded" && taskCount >= suggestedCap) {
      activeWarning = "overloaded";
    }

    // Avoidance prompt — structural, not label-matched
    const highRescheduled = rescheduleAlerts.filter((a) => a.count >= 3);
    const avoidancePrompt =
      highRescheduled.length > 0
        ? `You have ${highRescheduled.length} task${highRescheduled.length > 1 ? "s" : ""} that keeps getting deferred — worth a look before adding more.`
        : null;

    // Capacity
    const atHardCap = taskCount >= 5;

    return {
      orderedTypes,
      degradedTypes,
      positiveSignal,
      guidanceSignal,
      activeWarning,
      avoidancePrompt,
      capacityFill: Math.min(taskCount, suggestedCap),
      suggestedCap,
      atHardCap,
    };
  }, [type, labelFocused, state, taskIntel, taskCount]);
}
