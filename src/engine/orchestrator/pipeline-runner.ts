/**
 * Behavioral Pipeline Orchestrator
 *
 * Calls all engines in the correct sequence:
 *   Signal Engine → State Engine → Task Engine → Intervention Engine
 *
 * and assembles the result into a BehavioralPipeline. This is the single
 * integration point that bridges the Zustand store to the behavioral engines.
 * The orchestrator itself imports nothing from Zustand — it receives data as
 * plain parameters and returns a plain BehavioralPipeline.
 *
 * Task Engine integration is optional: the intervention engine requires a
 * SequencingDecision, but the store's simple Task[] cannot be directly fed
 * to the intelligence Task engine without enrichment. The orchestrator accepts
 * an optional `sequencing` override; if not provided, a neutral decision is
 * generated so the intervention engine can still fire.
 */

import type { BehavioralPipeline } from "@/core/contracts/pipeline/behavioral-pipeline";
import type { SessionEvidence } from "@/core/contracts/signals/session-evidence";
import type { SequencingDecision } from "@/core/contracts/tasks/sequencing";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import type { ReentryProtocol } from "@/core/contracts/reentry/protocol";
import type { UserMode } from "@/core/contracts/state/modes";
import type { StateEvaluationContext } from "@/core/contracts/state/evaluation";
import { generateSignalSnapshot } from "@/engine/signals/snapshot";
import { evaluate as evaluateState } from "@/engine/state/state-engine";
import { evaluateInterventions } from "@/engine/interventions/evaluate";
import { buildStateExplanation } from "@/engine/state/explainability/build-state-explanation";
import { generateAdaptation } from "@/engine/adaptation";

// ---------------------------------------------------------------------------
// Neutral sequencing decision — used when no Task Engine result is available
// ---------------------------------------------------------------------------

const NEUTRAL_SEQUENCING: SequencingDecision = {
  suppressedTaskIds: [],
  compressedTaskIds: [],
  sequencingReasoning: ["Task intelligence not available for this pipeline run."],
  reasoningTrace: { factors: [], confidenceBand: "LOW" },
  expectedRecoveryImpact: 50,
  expectedMomentumImpact: 50,
  sequencingConfidence: 0,
};

// ---------------------------------------------------------------------------
// Orchestrator input type
// ---------------------------------------------------------------------------

export type PipelineRunnerInput = {
  /** Pre-built SessionEvidence array (produced by the Evidence Bridge). */
  evidence: SessionEvidence[];
  /** Evaluation context for the State Engine run. */
  context: StateEvaluationContext;
  /** Recent intervention audit records for cooldown evaluation (last 7 days). */
  recentInterventions: InterventionAuditRecord[];
  /**
   * Optional pre-computed sequencing decision from the Task Engine.
   * If absent, a neutral decision is used. Downstream intervention eligibility
   * may still fire — sequencing saturation gates simply won't suppress anything.
   */
  sequencing?: SequencingDecision;
  /** Optional active reentry protocol (for intervention suppression). */
  activeReentryProtocol?: ReentryProtocol;
};

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export function runBehavioralPipeline(input: PipelineRunnerInput): BehavioralPipeline {
  const { evidence, context, recentInterventions, sequencing, activeReentryProtocol } = input;

  // ── 1. Signal Engine ─────────────────────────────────────────────────────
  // Extract DailyInputs from the evidence array — the signal engine accepts
  // both forms. Using evidence.inputs avoids a second parse of the same data.
  const dailyInputs = evidence.map((e) => e.inputs);

  const signalSnapshot = generateSignalSnapshot(evidence, dailyInputs, {
    capturedAt: resolveRunTimestamp(evidence),
  });

  // ── 2. State Engine ───────────────────────────────────────────────────────
  const previousMode: UserMode | undefined = context.previousMode;
  const stateResult = evaluateState({
    evidence,
    signalSnapshots: [signalSnapshot],
    previousMode,
  });

  const { state, transition } = stateResult;

  // ── 3. Task Engine ────────────────────────────────────────────────────────
  // Omitted from this runner — Task Engine requires enriched Task objects that
  // must be constructed by the domain layer (not the store Task[]).
  // The caller may pass a pre-computed `sequencing` result if available.
  const resolvedSequencing = sequencing ?? NEUTRAL_SEQUENCING;

  // ── 4. Intervention Engine ────────────────────────────────────────────────
  const interventionResult = evaluateInterventions({
    state,
    signalSnapshot,
    sequencing: resolvedSequencing,
    context: {
      flowPhase: context.flowPhase,
      recentInterventions,
      activeReentryProtocol,
    },
  });

  // ── 5. State Explanation ──────────────────────────────────────────────────
  // Engine-authored interpretation copy — the hook layer passes these strings
  // through verbatim; no user-facing copy is authored outside the engine.
  const stateExplanation = buildStateExplanation(
    state,
    transition ? context.previousMode : undefined,
    context.flowPhase,
  );

  // ── 6. Adaptation Engine ──────────────────────────────────────────────────
  const adaptationGeneration = generateAdaptation({
    stateInterpretation: state,
    signalSnapshot,
    interventionEvaluation: interventionResult,
  });

  // ── 7. Assemble BehavioralPipeline ────────────────────────────────────────
  const pipeline: BehavioralPipeline = {
    inputCollection: dailyInputs[dailyInputs.length - 1] ?? emptyDailyInputs(),
    signalSnapshot,
    stateInterpretation: state,
    pendingTransition: transition,
    trajectoryAnalysis: state.currentTrajectory,
    taskEvaluation: [], // populated externally when Task Engine runs
    sequencingDecision: resolvedSequencing,
    interventionEvaluation: interventionResult,
    stateExplanation,
    adaptationGeneration,
  };

  return pipeline;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveRunTimestamp(evidence: SessionEvidence[]): string {
  if (evidence.length === 0) return new Date().toISOString();
  return [...evidence].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0].capturedAt;
}

function emptyDailyInputs() {
  return {
    capturedAt: new Date().toISOString(),
    recoveryInputs: { sleepQuality: 65, physicalEnergy: 65, mentalClarity: 65 },
    emotionalInputs: { overwhelm: 30, emotionalResistance: 30, stressPressure: 30 },
    executionInputs: {
      meaningfulAdvancementQuality: 65,
      deepWorkContinuity: 65,
      executionIntegrity: 65,
    },
    behavioralInputs: {
      fragmentationLevel: 25,
      distractionPatterns: 25,
      avoidancePressure: 25,
      pacingQuality: 70,
    },
  };
}
