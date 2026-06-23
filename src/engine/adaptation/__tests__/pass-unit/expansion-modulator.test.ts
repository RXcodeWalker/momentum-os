import { describe, it, expect } from "vitest";
import { applyModeBaseline } from "../../baseline/mode-baseline";
import { applyTrajectoryDelta } from "../../modulation/trajectory-modulator";
import { applyExpansionModulation } from "../../modulation/expansion-modulator";
import type { AdaptationContext } from "../../types/internal";
import { makeUserState } from "@/testing/fixtures/task-intelligence";
import type { ExpansionDirective } from "@/core/contracts/expansion";

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined };
}

function makeCtx(overrides: Partial<AdaptationContext>): AdaptationContext {
  const state = makeUserState("FOCUSED");
  return {
    mode: state.currentMode,
    trajectory: "STABLE",
    burnoutRisk: "LOW",
    overloadRisk: "LOW",
    avoidanceRisk: "LOW",
    collapseRisk: "LOW",
    adaptationReadiness: state.adaptationReadiness,
    recoveryDebt: state.recoveryDebt,
    cognitiveStrain: state.cognitiveStrain,
    executionStability: state.executionStability,
    emotionalFriction: state.emotionalFriction,
    activeSignalStrengths: {},
    resolvedDirectives: [],
    stateConfidence: state.confidence,
    ...overrides,
  };
}

const MAX_EXPANSION = 15;
const MAX_CONTRACTION = 15;

describe("applyExpansionModulation", () => {
  it("no-op when expansionDirective is absent", () => {
    const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
    // Apply trajectory first to set a baseline (EXPANDING adds +10)
    applyTrajectoryDelta(
      draft,
      makeCtx({ trajectory: "EXPANDING", mode: "FOCUSED" }),
      makeNoopRecorder(),
    );
    const before = draft.recommendedChallengeLevel;
    applyExpansionModulation(draft, makeCtx({}), makeNoopRecorder());
    expect(draft.recommendedChallengeLevel).toBe(before);
  });

  it("no-op when expansionPaceModifier is absent", () => {
    const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
    const before = draft.recommendedChallengeLevel;
    applyExpansionModulation(
      draft,
      makeCtx({ expansionDirective: "increase" }),
      makeNoopRecorder(),
    );
    expect(draft.recommendedChallengeLevel).toBe(before);
  });

  describe("directive: increase", () => {
    it("adds MAX_EXPANSION_DELTA × paceModifier at pace=1.0", () => {
      const draft = applyModeBaseline("FOCUSED", makeNoopRecorder()); // 60 baseline
      const before = draft.recommendedChallengeLevel;
      applyExpansionModulation(
        draft,
        makeCtx({ expansionDirective: "increase", expansionPaceModifier: 1.0 }),
        makeNoopRecorder(),
      );
      expect(draft.recommendedChallengeLevel).toBeCloseTo(before + MAX_EXPANSION);
    });

    it("adds half of MAX at pace=0.5", () => {
      const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
      const before = draft.recommendedChallengeLevel;
      applyExpansionModulation(
        draft,
        makeCtx({ expansionDirective: "increase", expansionPaceModifier: 0.5 }),
        makeNoopRecorder(),
      );
      expect(draft.recommendedChallengeLevel).toBeCloseTo(before + MAX_EXPANSION * 0.5);
    });
  });

  describe("directive: gradual_increase", () => {
    it("adds MAX × pace × 0.5 at pace=1.0", () => {
      const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
      const before = draft.recommendedChallengeLevel;
      applyExpansionModulation(
        draft,
        makeCtx({ expansionDirective: "gradual_increase", expansionPaceModifier: 1.0 }),
        makeNoopRecorder(),
      );
      expect(draft.recommendedChallengeLevel).toBeCloseTo(before + MAX_EXPANSION * 0.5);
    });

    it("gradual_increase gives less delta than increase at same pace", () => {
      const draftA = applyModeBaseline("FOCUSED", makeNoopRecorder());
      const draftB = applyModeBaseline("FOCUSED", makeNoopRecorder());
      applyExpansionModulation(
        draftA,
        makeCtx({ expansionDirective: "increase", expansionPaceModifier: 0.8 }),
        makeNoopRecorder(),
      );
      applyExpansionModulation(
        draftB,
        makeCtx({ expansionDirective: "gradual_increase", expansionPaceModifier: 0.8 }),
        makeNoopRecorder(),
      );
      expect(draftB.recommendedChallengeLevel).toBeLessThan(draftA.recommendedChallengeLevel);
    });
  });

  describe("directive: hold", () => {
    it("does not change recommendedChallengeLevel", () => {
      const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
      const before = draft.recommendedChallengeLevel;
      applyExpansionModulation(
        draft,
        makeCtx({ expansionDirective: "hold", expansionPaceModifier: 0.8 }),
        makeNoopRecorder(),
      );
      expect(draft.recommendedChallengeLevel).toBe(before);
    });
  });

  describe("directive: reduce", () => {
    it("subtracts at least 30% of MAX_CONTRACTION even at pace=1.0", () => {
      const draft = applyModeBaseline("EXPANDING", makeNoopRecorder()); // 80 baseline
      const before = draft.recommendedChallengeLevel;
      applyExpansionModulation(
        draft,
        makeCtx({ expansionDirective: "reduce", expansionPaceModifier: 1.0 }),
        makeNoopRecorder(),
      );
      const delta = before - draft.recommendedChallengeLevel;
      expect(delta).toBeGreaterThanOrEqual(MAX_CONTRACTION * 0.3 - 0.001);
    });

    it("reduction does not exceed MAX_CONTRACTION_DELTA", () => {
      const draft = applyModeBaseline("EXPANDING", makeNoopRecorder());
      const before = draft.recommendedChallengeLevel;
      applyExpansionModulation(
        draft,
        makeCtx({ expansionDirective: "reduce", expansionPaceModifier: 0.0 }),
        makeNoopRecorder(),
      );
      const delta = before - draft.recommendedChallengeLevel;
      expect(delta).toBeLessThanOrEqual(MAX_CONTRACTION + 0.001);
    });
  });

  it("records trace entry for increase", () => {
    const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
    const entries: unknown[] = [];
    const recorder = { record: (...args: unknown[]) => entries.push(args), flush: () => undefined };
    applyExpansionModulation(
      draft,
      makeCtx({ expansionDirective: "increase", expansionPaceModifier: 0.9 }),
      recorder,
    );
    const expansionEntries = (entries as unknown[][]).filter((e) => e[3] === "expansion");
    expect(expansionEntries.length).toBeGreaterThan(0);
  });

  it("appends a reasoning entry", () => {
    const draft = applyModeBaseline("FOCUSED", makeNoopRecorder());
    applyExpansionModulation(
      draft,
      makeCtx({ expansionDirective: "gradual_increase", expansionPaceModifier: 0.6 }),
      makeNoopRecorder(),
    );
    expect(draft.reasoning.some((r) => r.includes("Expansion modulator"))).toBe(true);
  });
});

// ── Capability Expansion Engine scenario tests ────────────────────────────────

import type { ExpansionEngineInput } from "@/core/contracts/expansion";
import type { MomentumModel } from "@/core/contracts/momentum";
import type { StateDynamics, StateDynamicsProfile } from "@/core/contracts/state/dynamics";
import { computeExpansionDecision } from "@/engine/expansion/capability-expansion-engine";

function makeMomentumModel(overrides: Partial<MomentumModel> = {}): MomentumModel {
  return {
    classification: "expanding",
    velocity: "steady",
    quality: { fragilityScore: 20, sustainabilityScore: 75, isStructurallySound: true },
    confidence: "high",
    signals: [],
    underlyingTrajectory: "EXPANDING",
    summary: "Test",
    computedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeStateDynamics(overrides: Partial<StateDynamics> = {}): StateDynamics {
  return {
    currentPeriod: "FOCUSED",
    recentTransitions: [],
    stability: {
      currentModeDays: 14,
      rating: "stable",
      longestStablePeriodDays: 21,
      longestStablePeriodType: "FOCUSED",
    },
    volatility: { score: 30, trend: "stable", scoreStdDev14d: 5, interpretation: "stable" },
    oscillation: {
      isOscillating: false,
      frequencyPer28Days: 0,
      dominantCyclePair: null,
      cycleCount: 0,
    },
    recoveryCycles: {
      count: 2,
      avgDurationDays: 3,
      lastDurationDays: 2,
      longestDurationDays: 5,
      successRate: 0.9,
    },
    trajectoryShifts: [],
    evidenceDays: 28,
    confidence: "high",
    ...overrides,
  };
}

function makeStateDynamicsProfile(
  overrides: Partial<StateDynamicsProfile> = {},
): StateDynamicsProfile {
  return {
    transitionMatrix: { paths: [], commonPaths: [], rarePaths: [], totalTransitions: 0 },
    stateStatistics: {},
    recoveryPathwayAnalysis: {
      pathways: [],
      failedRecoveries: 0,
      avgDaysToFocusedFromRecovery: null,
      mostCommonExitState: null,
      mostSuccessfulPathway: null,
    },
    instabilityHotspots: [],
    oscillation: {
      isOscillating: false,
      frequencyPer28Days: 0,
      dominantCyclePair: null,
      cycleCount: 0,
    },
    mostStableState: "FOCUSED",
    mostVolatileTransition: null,
    dominantPattern: "expanding",
    periodCount: 5,
    windowDays: 28,
    confidence: "high",
    computedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInput(overrides: Partial<ExpansionEngineInput> = {}): ExpansionEngineInput {
  return {
    momentumModel: makeMomentumModel(),
    stateDynamics: makeStateDynamics(),
    dynamicsProfile: makeStateDynamicsProfile(),
    avoidancePressure: 15,
    taskCompatibilityAvgScore: null,
    recoveryMode: false,
    streakAtRisk: false,
    consistency: 0.85,
    recoveryDebtAccumulating: false,
    checkInsCount: 21,
    ...overrides,
  };
}

describe("computeExpansionDecision — scenario matrix", () => {
  it("Scenario 1: Oscillating + volatile → hold (OSCILLATION_GATE + VOLATILITY_GATE block)", () => {
    const input = makeInput({
      stateDynamics: makeStateDynamics({
        volatility: {
          score: 80,
          trend: "increasing",
          scoreStdDev14d: 15,
          interpretation: "volatile",
        },
        oscillation: {
          isOscillating: true,
          frequencyPer28Days: 3,
          dominantCyclePair: null,
          cycleCount: 3,
        },
      }),
    });
    const decision = computeExpansionDecision(input, "EXPANDING", "EXPANDING");
    expect(decision.directive).toBe("hold");
    expect(decision.safetyConstraints.find((c) => c.id === "VOLATILITY_GATE")?.triggered).toBe(
      true,
    );
    expect(decision.safetyConstraints.find((c) => c.id === "OSCILLATION_GATE")?.triggered).toBe(
      true,
    );
  });

  it("Scenario 2: Expanding + structurally sound + consistency > 0.80 → increase", () => {
    const input = makeInput({
      momentumModel: makeMomentumModel({
        classification: "expanding",
        velocity: "accelerating",
        quality: { fragilityScore: 10, sustainabilityScore: 85, isStructurallySound: true },
      }),
      consistency: 0.9,
      avoidancePressure: 10,
    });
    const decision = computeExpansionDecision(input, "EXPANDING", "EXPANDING");
    expect(decision.directive).toBe("increase");
    expect(decision.paceModifier).toBeGreaterThan(0.7);
  });

  it("Scenario 3: Recovery mode → reduce", () => {
    const input = makeInput({ recoveryMode: true });
    const decision = computeExpansionDecision(input, "RECOVERY", "CONTRACTING");
    expect(["hold", "reduce"]).toContain(decision.directive);
    expect(decision.safetyConstraints.find((c) => c.id === "RECOVERY_MODE_GATE")?.triggered).toBe(
      true,
    );
  });

  it("Scenario 4: Avoidance pressure ≥ 65 with otherwise-expanding trajectory → hold", () => {
    const input = makeInput({
      avoidancePressure: 70,
      momentumModel: makeMomentumModel({ classification: "expanding" }),
    });
    const decision = computeExpansionDecision(input, "EXPANDING", "EXPANDING");
    expect(decision.directive).toBe("hold");
    expect(decision.safetyConstraints.find((c) => c.id === "AVOIDANCE_GATE")?.triggered).toBe(true);
  });

  it("all signal weights sum to approximately 1.0", () => {
    const input = makeInput();
    const decision = computeExpansionDecision(input, "FOCUSED", "STABLE");
    const totalWeight = decision.signals.reduce((sum, s) => sum + s.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 2);
  });

  it("normalizedValue is always in [0, 1] for all signals", () => {
    const input = makeInput({
      momentumModel: makeMomentumModel({ classification: "contracting", velocity: "stalled" }),
    });
    const decision = computeExpansionDecision(input, "RECOVERY", "CONTRACTING");
    for (const signal of decision.signals) {
      expect(signal.normalizedValue).toBeGreaterThanOrEqual(0);
      expect(signal.normalizedValue).toBeLessThanOrEqual(1);
    }
  });

  it("checkInsCount < 3 caps directive at hold", () => {
    const input = makeInput({
      checkInsCount: 2,
      momentumModel: makeMomentumModel({ classification: "expanding", velocity: "accelerating" }),
      consistency: 0.95,
    });
    const decision = computeExpansionDecision(input, "EXPANDING", "EXPANDING");
    expect(decision.directive).toBe("hold");
  });

  it("checkInsCount < 7 caps directive at gradual_increase (never increase)", () => {
    const input = makeInput({
      checkInsCount: 5,
      momentumModel: makeMomentumModel({ classification: "expanding", velocity: "accelerating" }),
      quality: { fragilityScore: 10, sustainabilityScore: 90, isStructurallySound: true },
      consistency: 0.95,
    } as Partial<ExpansionEngineInput>);
    const decision = computeExpansionDecision(input, "EXPANDING", "EXPANDING");
    expect(decision.directive).not.toBe("increase");
  });

  it("paceModifier is always in [0, 1]", () => {
    const inputs: ExpansionEngineInput[] = [
      makeInput(),
      makeInput({ avoidancePressure: 80, recoveryMode: true }),
      makeInput({
        momentumModel: makeMomentumModel({
          classification: "contracting",
          velocity: "stalled",
          quality: { fragilityScore: 80, sustainabilityScore: 20, isStructurallySound: false },
        }),
      }),
    ];
    for (const input of inputs) {
      const decision = computeExpansionDecision(input, "RECOVERY", "CONTRACTING");
      expect(decision.paceModifier).toBeGreaterThanOrEqual(0);
      expect(decision.paceModifier).toBeLessThanOrEqual(1);
    }
  });

  it("HOTSPOT_RISK dampens pace without changing directive tier", () => {
    const normalInput = makeInput();
    const hotspotInput = makeInput({
      dynamicsProfile: makeStateDynamicsProfile({
        instabilityHotspots: [
          { predecessorState: "FOCUSED", precedenceRate: 0.8, count: 5, riskSignal: "high" },
        ],
      }),
    });
    const normalDecision = computeExpansionDecision(normalInput, "FOCUSED", "STABLE");
    const hotspotDecision = computeExpansionDecision(hotspotInput, "FOCUSED", "STABLE");
    // Pace should be lower with hotspot
    expect(hotspotDecision.paceModifier).toBeLessThan(normalDecision.paceModifier + 0.001);
  });
});
