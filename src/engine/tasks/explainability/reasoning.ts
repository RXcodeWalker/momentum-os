import type { ConfidenceBand } from "@/core/contracts/primitives";
import type { ReasoningFactor, ReasoningTrace } from "@/core/contracts/tasks/reasoning";
import type { SequencingDecision } from "@/core/contracts/tasks/sequencing";
import type { Task } from "@/core/contracts/tasks/task";
import { lowerConfidence } from "../analysis/types";
import type { SequencingContext } from "../decision/sequencing-context";

// ---------------------------------------------------------------------------
// Explainability — translates analysis + decisions into observational language
// ---------------------------------------------------------------------------

function confidenceBandToScalar(band: ConfidenceBand): number {
  switch (band) {
    case "HIGH":
      return 80;
    case "MEDIUM":
      return 55;
    case "LOW":
      return 30;
  }
}

function resolveTraceConfidence(context: SequencingContext): ConfidenceBand {
  const bands: ConfidenceBand[] = [
    context.portfolioObservation.confidenceBand,
    context.state.confidence.band,
  ];
  if (bands.includes("LOW")) return "LOW";
  if (bands.every((b) => b === "HIGH")) return "HIGH";
  return "MEDIUM";
}

function primarySelectionFactor(task: Task, context: SequencingContext): ReasoningFactor {
  const mode = context.state.currentMode;

  switch (mode) {
    case "RECOVERY":
      return {
        code: "RECOVERY_ALIGNMENT",
        observation: "This task may align with current recovery capacity based on recent patterns.",
        influence: "supports",
      };
    case "STABILIZING":
      return {
        code: "RHYTHM_REBUILDING",
        observation:
          "This task may support rhythm rebuilding with manageable resistance and ambiguity.",
        influence: "supports",
      };
    case "FOCUSED":
      return {
        code: "DEEP_WORK_FIT",
        observation:
          "This task may support sustained, meaningful work based on current focus conditions.",
        influence: "supports",
      };
    case "EXPANDING":
      return {
        code: "STRETCH_OPPORTUNITY",
        observation:
          "This task may offer a sustainable stretch opportunity given current expansion readiness.",
        influence: "supports",
      };
  }
}

function buildPortfolioFactors(context: SequencingContext): ReasoningFactor[] {
  return context.portfolioObservation.observations.map((observation, index) => ({
    code: `PORTFOLIO_PATTERN_${context.portfolioObservation.patterns[index] ?? "UNKNOWN"}`,
    observation,
    influence: "cautions" as const,
  }));
}

function buildSuppressionFactors(
  suppressedIds: string[],
  context: SequencingContext,
): ReasoningFactor[] {
  return suppressedIds.map((id) => {
    const compat = context.compatibilities.find((c) => c.taskId === id);
    const task = context.tasks.find((t) => t.id === id);
    return {
      code: "MODE_INCOMPATIBLE",
      observation:
        compat?.band === "HARMFUL"
          ? `Task "${task?.title ?? id}" may be incompatible with the current ${context.state.currentMode.toLowerCase()} operating condition.`
          : `Task "${task?.title ?? id}" was held back based on current operating conditions.`,
      influence: "suppresses" as const,
    };
  });
}

function buildCompressionFactors(
  compressedIds: string[],
  context: SequencingContext,
): ReasoningFactor[] {
  return compressedIds.map((id) => {
    const task = context.tasks.find((t) => t.id === id);
    return {
      code: "BURDEN_COMPRESSION",
      observation: `Scope for "${task?.title ?? id}" may benefit from compression relative to current recovery capacity.`,
      influence: "cautions" as const,
    };
  });
}

export function buildReasoningTrace(
  context: SequencingContext,
  decision: Omit<SequencingDecision, "reasoningTrace" | "sequencingReasoning">,
): ReasoningTrace {
  const factors: ReasoningFactor[] = [];

  if (decision.recommendedPrimaryTaskId) {
    const primary = context.tasks.find((t) => t.id === decision.recommendedPrimaryTaskId);
    if (primary) factors.push(primarySelectionFactor(primary, context));
  }

  factors.push(...buildPortfolioFactors(context));
  factors.push(...buildSuppressionFactors(decision.suppressedTaskIds, context));
  factors.push(...buildCompressionFactors(decision.compressedTaskIds, context));

  if (context.state.currentTrajectory === "CONTRACTING") {
    factors.push({
      code: "TRAJECTORY_CAUTION",
      observation:
        "Recent trajectory patterns suggest pacing caution even when stretch tasks are available.",
      influence: "cautions",
    });
  }

  if (factors.length === 0) {
    factors.push({
      code: "INSUFFICIENT_EVIDENCE",
      observation: "Available task evidence is limited; recommendations carry lower certainty.",
      influence: "neutral",
    });
  }

  let confidenceBand = resolveTraceConfidence(context);
  if (context.tasks.length < 3) {
    confidenceBand = lowerConfidence(confidenceBand, "LOW");
  }

  return { factors, confidenceBand };
}

export function attachReasoning(
  context: SequencingContext,
  decision: Omit<SequencingDecision, "reasoningTrace" | "sequencingReasoning">,
): SequencingDecision {
  const reasoningTrace = buildReasoningTrace(context, decision);
  return {
    ...decision,
    reasoningTrace,
    sequencingReasoning: reasoningTrace.factors.map((f) => f.observation),
  };
}

/** Exported for tests — ensures no formula leakage in observations. */
export function observationsContainFormulaLeak(trace: ReasoningTrace): boolean {
  const formulaPattern = /\b(weight|score\s*=|coefficient|0\.\d+)\b/i;
  return trace.factors.some((f) => formulaPattern.test(f.observation));
}

export { confidenceBandToScalar };
