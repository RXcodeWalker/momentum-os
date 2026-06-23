import { useMemo } from "react";
import { useApp } from "@/lib/store";
import type { BehavioralPipeline } from "@/core/contracts/pipeline/behavioral-pipeline";
import type { BehavioralExecutionView, AdvancementVisibility } from "./contracts";
import { orderTasks } from "@/engine/tasks/order-tasks";
import { applyVisibilityRules } from "@/engine/tasks/visibility-rules";
import { detectChallenge } from "@/engine/tasks/challenge-detector";

const ALL_VISIBLE: AdvancementVisibility = {
  showStreakPill: true,
  showMomentumDelta: true,
  showConsistencyPill: true,
  showSparkline: true,
};

const NO_PIPELINE_DEFAULT: BehavioralExecutionView = {
  ready: false,
  visibleTaskIds: [],
  hiddenCount: 0,
  compressionReason: "none",
  stretchOpportunity: null,
  deepWorkNudge: { show: false },
  advancement: ALL_VISIBLE,
  suppressTypeBalanceWarning: false,
};

export function useBehavioralExecution(): BehavioralExecutionView {
  const pipeline = useApp((s) => s.lastPipelineResult) as BehavioralPipeline | null;
  const storeTasks = useApp((s) => s.tasks);
  const acknowledgedInterventions = useApp((s) => s.acknowledgedInterventions);
  const focusEnvironment = useApp((s) => s.focusEnvironment);

  return useMemo((): BehavioralExecutionView => {
    if (!pipeline) return NO_PIPELINE_DEFAULT;

    const execution = pipeline.adaptationGeneration?.execution;
    const mode = pipeline.stateInterpretation?.currentMode;

    if (!execution) return NO_PIPELINE_DEFAULT;

    const incompleteTasks = storeTasks.filter((t) => !t.done);

    const orderedIds = orderTasks(incompleteTasks, execution);
    const { visibleTaskIds, hiddenCount, compressionReason } = applyVisibilityRules(
      orderedIds,
      execution,
    );

    const visibleTasks = incompleteTasks.filter((t) => visibleTaskIds.includes(t.id));
    const { stretchTaskId, stretchPrompt } = detectChallenge(visibleTasks, execution);

    // Deep work nudge
    const needsNudge =
      execution.deepWorkExpectation > 60 && incompleteTasks.length > 0 && !focusEnvironment?.active;

    const onCooldown = acknowledgedInterventions.some(
      (a) =>
        a.type === "DEEP_WORK_NUDGE" &&
        Date.now() - new Date(a.acknowledgedAt).getTime() < 86_400_000,
    );

    // Advancement visibility keyed on advancementWeighting (0–1 ratio)
    const w = execution.advancementWeighting;
    let advancement: AdvancementVisibility;
    if (w < 0.35) {
      advancement = {
        showStreakPill: false,
        showMomentumDelta: false,
        showConsistencyPill: false,
        showSparkline: false,
      };
    } else if (w < 0.55) {
      advancement = {
        showStreakPill: true,
        showMomentumDelta: false,
        showConsistencyPill: false,
        showSparkline: false,
      };
    } else {
      advancement = ALL_VISIBLE;
    }

    return {
      ready: true,
      visibleTaskIds,
      hiddenCount,
      compressionReason,
      stretchOpportunity:
        stretchTaskId && stretchPrompt ? { taskId: stretchTaskId, prompt: stretchPrompt } : null,
      deepWorkNudge: { show: needsNudge && !onCooldown },
      advancement,
      suppressTypeBalanceWarning: mode === "RECOVERY",
    };
  }, [pipeline, storeTasks, acknowledgedInterventions, focusEnvironment]);
}
