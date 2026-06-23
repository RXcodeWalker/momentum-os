import type { UserState } from "@/core/contracts/state/user-state";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { AdaptationDirective } from "@/core/contracts/adaptation/directives";
import type { InterventionEvaluationResult } from "@/core/contracts/interventions/evaluation";
import type { AdaptationEngineInput } from "@/engine/adaptation/adaptation-engine";
import type { UserMode, UserTrajectory } from "@/core/contracts/state/modes";
import type { RiskLevel } from "@/core/contracts/primitives";
import { makeUserState } from "./task-intelligence";

// ---------------------------------------------------------------------------
// Default intervention evaluation result (no interventions / no directives)
// ---------------------------------------------------------------------------

function makeDefaultEvaluation(
  directives: AdaptationDirective[] = [],
): InterventionEvaluationResult {
  return {
    interventions:
      directives.length > 0
        ? [
            {
              id: "directive-injection",
              type: "BURNOUT_PREVENTION",
              level: 0,
              triggerReasoning: [],
              emotionalGoal: "",
              behavioralObjective: "",
              adaptationDirectives: directives,
              suppressionEligible: false,
              cooldownDurationHours: 0,
              generatedAt: "2026-01-01T00:00:00.000Z",
            },
          ]
        : [],
    evaluationNotes: [],
    restraintApplied: false,
    candidatesFound: 0,
    engineVersion: "v1",
  };
}

// ---------------------------------------------------------------------------
// Signal snapshot builder
// ---------------------------------------------------------------------------

function makeAdaptationSignalSnapshot(
  signals: BehavioralSignal[],
  strengths: Partial<Record<BehavioralSignal, number>> = {},
): SignalSnapshot {
  return {
    capturedAt: "2026-01-01T00:00:00.000Z",
    activeSignals: signals,
    signalStrengths: Object.fromEntries(signals.map((s) => [s, strengths[s] ?? 75])),
    signalDurations: Object.fromEntries(signals.map((s) => [s, 3])),
    confidence: "HIGH",
  };
}

function emptySignalSnapshot(): SignalSnapshot {
  return {
    capturedAt: "2026-01-01T00:00:00.000Z",
    activeSignals: [],
    signalStrengths: {},
    signalDurations: {},
    confidence: "HIGH",
  };
}

// ---------------------------------------------------------------------------
// Core input builder
// ---------------------------------------------------------------------------

export function makeAdaptationInput(overrides?: {
  state?: Partial<UserState>;
  signals?: BehavioralSignal[];
  signalStrengths?: Partial<Record<BehavioralSignal, number>>;
  directives?: AdaptationDirective[];
}): AdaptationEngineInput {
  const signals = overrides?.signals ?? [];
  const signalStrengths = overrides?.signalStrengths ?? {};
  const directives = overrides?.directives ?? [];

  const state = makeUserState("FOCUSED", overrides?.state ?? {});
  const signalSnapshot =
    signals.length > 0
      ? makeAdaptationSignalSnapshot(signals, signalStrengths)
      : { ...emptySignalSnapshot(), signalStrengths };

  return {
    stateInterpretation: state,
    signalSnapshot,
    interventionEvaluation: makeDefaultEvaluation(directives),
  };
}

// ---------------------------------------------------------------------------
// Scenario builder for mode × trajectory combinations
// ---------------------------------------------------------------------------

export function scenarioFor(
  mode: UserMode,
  trajectory: UserTrajectory,
  overrides?: Parameters<typeof makeAdaptationInput>[0],
): AdaptationEngineInput {
  const riskByMode: Record<UserMode, { burnoutRisk: RiskLevel; collapseRisk: RiskLevel }> = {
    RECOVERY: { burnoutRisk: "LOW", collapseRisk: "LOW" },
    STABILIZING: { burnoutRisk: "LOW", collapseRisk: "LOW" },
    FOCUSED: { burnoutRisk: "LOW", collapseRisk: "LOW" },
    EXPANDING: { burnoutRisk: "LOW", collapseRisk: "LOW" },
  };
  return makeAdaptationInput({
    ...overrides,
    state: {
      currentMode: mode,
      currentTrajectory: trajectory,
      overloadRisk: "LOW",
      avoidanceRisk: "LOW",
      ...riskByMode[mode],
      ...(overrides?.state ?? {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Risk overlays
// ---------------------------------------------------------------------------

export function withBurnoutCritical(input: AdaptationEngineInput): AdaptationEngineInput {
  return {
    ...input,
    stateInterpretation: { ...input.stateInterpretation, burnoutRisk: "CRITICAL" },
  };
}

export function withAllRisksCritical(input: AdaptationEngineInput): AdaptationEngineInput {
  return {
    ...input,
    stateInterpretation: {
      ...input.stateInterpretation,
      burnoutRisk: "CRITICAL",
      overloadRisk: "CRITICAL",
      avoidanceRisk: "CRITICAL",
      collapseRisk: "CRITICAL",
    },
  };
}

// ---------------------------------------------------------------------------
// Seeded LCG random generator
// ---------------------------------------------------------------------------

function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const MODES: UserMode[] = ["RECOVERY", "STABILIZING", "FOCUSED", "EXPANDING"];
const TRAJECTORIES: UserTrajectory[] = ["CONTRACTING", "FRAGILE", "STABLE", "EXPANDING"];
const RISK_LEVELS: RiskLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
const ALL_SIGNALS: BehavioralSignal[] = [
  "DEEP_WORK_DEGRADATION",
  "RISING_FRAGMENTATION",
  "VOLATILITY_ACCELERATION",
  "AVOIDANCE_CLUSTERING",
  "OVERCOMMITMENT_EXPANSION",
  "PLANNING_ESCAPE",
  "MEANINGFULNESS_DEFERRAL",
  "DECLINING_EXECUTION_QUALITY",
  "PACING_INSTABILITY",
];

export function generateRandomInput(seed = 0): AdaptationEngineInput {
  const rand = lcg(seed);
  const mode = MODES[Math.floor(rand() * MODES.length)];
  const trajectory = TRAJECTORIES[Math.floor(rand() * TRAJECTORIES.length)];
  const burnoutRisk = RISK_LEVELS[Math.floor(rand() * RISK_LEVELS.length)];
  const overloadRisk = RISK_LEVELS[Math.floor(rand() * RISK_LEVELS.length)];
  const avoidanceRisk = RISK_LEVELS[Math.floor(rand() * RISK_LEVELS.length)];
  const collapseRisk = RISK_LEVELS[Math.floor(rand() * RISK_LEVELS.length)];

  const activeSignals = ALL_SIGNALS.filter(() => rand() > 0.6);
  const signalStrengths: Partial<Record<BehavioralSignal, number>> = {};
  for (const s of activeSignals) {
    signalStrengths[s] = Math.floor(rand() * 100);
  }

  return makeAdaptationInput({
    state: {
      currentMode: mode,
      currentTrajectory: trajectory,
      burnoutRisk,
      overloadRisk,
      avoidanceRisk,
      collapseRisk,
    },
    signals: activeSignals,
    signalStrengths,
  });
}

// ---------------------------------------------------------------------------
// 16 named scenario presets (4 modes × 4 trajectories)
// ---------------------------------------------------------------------------

export const SCENARIO_RECOVERY_CONTRACTING = scenarioFor("RECOVERY", "CONTRACTING");
export const SCENARIO_RECOVERY_FRAGILE = scenarioFor("RECOVERY", "FRAGILE");
export const SCENARIO_RECOVERY_STABLE = scenarioFor("RECOVERY", "STABLE");
export const SCENARIO_RECOVERY_EXPANDING = scenarioFor("RECOVERY", "EXPANDING");

export const SCENARIO_STABILIZING_CONTRACTING = scenarioFor("STABILIZING", "CONTRACTING");
export const SCENARIO_STABILIZING_FRAGILE = scenarioFor("STABILIZING", "FRAGILE");
export const SCENARIO_STABILIZING_STABLE = scenarioFor("STABILIZING", "STABLE");
export const SCENARIO_STABILIZING_EXPANDING = scenarioFor("STABILIZING", "EXPANDING");

export const SCENARIO_FOCUSED_CONTRACTING = scenarioFor("FOCUSED", "CONTRACTING");
export const SCENARIO_FOCUSED_FRAGILE = scenarioFor("FOCUSED", "FRAGILE");
export const SCENARIO_FOCUSED_STABLE = scenarioFor("FOCUSED", "STABLE");
export const SCENARIO_FOCUSED_EXPANDING = scenarioFor("FOCUSED", "EXPANDING");

export const SCENARIO_EXPANDING_CONTRACTING = scenarioFor("EXPANDING", "CONTRACTING");
export const SCENARIO_EXPANDING_FRAGILE = scenarioFor("EXPANDING", "FRAGILE");
export const SCENARIO_EXPANDING_STABLE = scenarioFor("EXPANDING", "STABLE");
export const SCENARIO_EXPANDING_EXPANDING = scenarioFor("EXPANDING", "EXPANDING");
