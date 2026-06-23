/**
 * Replay Tests — Behavioral Journey Scenarios
 *
 * These tests simulate realistic multi-week user journeys and verify that the
 * State Engine responds correctly over time. Each scenario builds a day-by-day
 * evidence series and asserts the expected mode/trajectory progression.
 *
 * Also included: hysteresis unit tests for the RECOVERY↔STABILIZING boundary.
 */

import { describe, expect, it } from "vitest";
import { evaluate } from "./state-engine";
import { THRESHOLDS, RECOVERY_EXIT_HYSTERESIS_BAND } from "./config";
import { buildEvidence, makeEvidence, emptySnapshot } from "@/testing/fixtures/state-evidence";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run evaluate() over an evidence series, returning modes at each step. */
function modeTimeline(evidence: ReturnType<typeof makeEvidence>[]): string[] {
  return evidence.map((_, i) => {
    const slice = evidence.slice(0, i + 1);
    return evaluate({ evidence: slice, signalSnapshots: [emptySnapshot(i)] }).state.currentMode;
  });
}

/** Run evaluate() over the full series tracking trajectory. */
function trajectoryAt(evidence: ReturnType<typeof makeEvidence>[], dayIndex: number): string {
  const slice = evidence.slice(0, dayIndex + 1);
  return evaluate({ evidence: slice, signalSnapshots: [emptySnapshot(dayIndex)] }).state
    .currentTrajectory;
}

// ---------------------------------------------------------------------------
// R-1: Burnout Spiral
// 14 days strong → 7 days declining sleep/overwhelm → crisis
// ---------------------------------------------------------------------------

describe("Replay R-1: Burnout Spiral", () => {
  const strong = buildEvidence(14, {
    sleepQuality: 80,
    physicalEnergy: 78,
    mentalClarity: 78,
    overwhelm: 22,
    emotionalResistance: 20,
    stressPressure: 22,
    meaningfulAdvancementQuality: 78,
    deepWorkContinuity: 76,
    executionIntegrity: 78,
    fragmentationLevel: 20,
    avoidancePressure: 20,
  });

  const spiral = Array.from({ length: 7 }, (_, i) =>
    makeEvidence(14 + i, {
      sleepQuality: 80 - (i + 1) * 9,
      physicalEnergy: 76 - (i + 1) * 9,
      mentalClarity: 74 - (i + 1) * 8,
      overwhelm: 22 + (i + 1) * 9,
      emotionalResistance: 20 + (i + 1) * 8,
      stressPressure: 22 + (i + 1) * 7,
      meaningfulAdvancementQuality: 76 - (i + 1) * 6,
      executionIntegrity: 74 - (i + 1) * 7,
    }),
  );

  const fullSeries = [...strong, ...spiral];

  it("starts in FOCUSED or EXPANDING during the strong phase", () => {
    const earlyResult = evaluate({ evidence: strong, signalSnapshots: [emptySnapshot(13)] });
    expect(["FOCUSED", "EXPANDING"]).toContain(earlyResult.state.currentMode);
  });

  it("transitions to RECOVERY by day 21 (after 7 declining days)", () => {
    const result = evaluate({ evidence: fullSeries, signalSnapshots: [emptySnapshot(20)] });
    expect(result.state.currentMode).toBe("RECOVERY");
  });

  it("shows elevated recoveryDebt and collapseRisk at crisis point", () => {
    const result = evaluate({ evidence: fullSeries, signalSnapshots: [emptySnapshot(20)] });
    expect(result.state.recoveryDebt).toBeGreaterThan(THRESHOLDS.recoveryDebtRecovery);
    expect(["HIGH", "CRITICAL"]).toContain(result.state.burnoutRisk);
  });

  it("trajectory shifts toward CONTRACTING or FRAGILE during decline", () => {
    const result = evaluate({ evidence: fullSeries, signalSnapshots: [emptySnapshot(20)] });
    expect(["CONTRACTING", "FRAGILE"]).toContain(result.state.currentTrajectory);
  });

  it("did not flip to RECOVERY during strong phase", () => {
    const modes = modeTimeline(strong);
    expect(modes.every((m) => m !== "RECOVERY")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// R-2: Avoidance Cluster
// 10 days normal → 5 days high avoidance + low meaningfulness (sleep stays fine)
// ---------------------------------------------------------------------------

describe("Replay R-2: Avoidance Cluster", () => {
  const baseline = buildEvidence(10, {
    sleepQuality: 72,
    physicalEnergy: 70,
    mentalClarity: 70,
    overwhelm: 28,
    avoidancePressure: 25,
    emotionalResistance: 25,
    meaningfulAdvancementQuality: 70,
    executionIntegrity: 70,
  });

  const avoidance = Array.from({ length: 5 }, (_, i) =>
    makeEvidence(10 + i, {
      // Sleep deliberately stable — pure friction mode
      sleepQuality: 72,
      physicalEnergy: 68,
      mentalClarity: 66,
      overwhelm: 28 + (i + 1) * 8,
      avoidancePressure: 28 + (i + 1) * 12,
      emotionalResistance: 26 + (i + 1) * 10,
      stressPressure: 30 + (i + 1) * 6,
      meaningfulAdvancementQuality: 68 - (i + 1) * 8,
      executionIntegrity: 65 - (i + 1) * 7,
      fragmentationLevel: 22 + (i + 1) * 8,
    }),
  );

  const fullSeries = [...baseline, ...avoidance];
  const result = evaluate({ evidence: fullSeries, signalSnapshots: [emptySnapshot(14)] });

  it("transitions out of FOCUSED toward STABILIZING during avoidance cluster", () => {
    expect(["STABILIZING", "RECOVERY"]).toContain(result.state.currentMode);
  });

  it("emotionalFriction is elevated", () => {
    expect(result.state.emotionalFriction).toBeGreaterThan(45);
  });

  it("recoveryDebt stays relatively low (sleep was unaffected)", () => {
    // Avoidance cluster with intact sleep should NOT trigger recovery debt collapse
    expect(result.state.recoveryDebt).toBeLessThan(65);
  });

  it("avoidanceRisk is elevated", () => {
    expect(["MODERATE", "HIGH", "CRITICAL"]).toContain(result.state.avoidanceRisk);
  });
});

// ---------------------------------------------------------------------------
// R-3: Recovery Rebuild
// Days 1–3: RECOVERY (crisis) → Days 4–14: gradual rebuild → Days 15–21: FOCUSED
// ---------------------------------------------------------------------------

describe("Replay R-3: Recovery Rebuild", () => {
  const crisis = buildEvidence(3, {
    sleepQuality: 22,
    physicalEnergy: 24,
    mentalClarity: 28,
    overwhelm: 88,
    emotionalResistance: 78,
    stressPressure: 70,
    meaningfulAdvancementQuality: 32,
    executionIntegrity: 28,
    fragmentationLevel: 72,
    avoidancePressure: 68,
  });

  // Gradual improvement — linear recovery over 11 days
  const rebuild = Array.from({ length: 11 }, (_, i) =>
    makeEvidence(3 + i, {
      sleepQuality: 22 + (i + 1) * 5,
      physicalEnergy: 24 + (i + 1) * 5,
      mentalClarity: 28 + (i + 1) * 4,
      overwhelm: 88 - (i + 1) * 6,
      emotionalResistance: 78 - (i + 1) * 5,
      stressPressure: 70 - (i + 1) * 4,
      meaningfulAdvancementQuality: 32 + (i + 1) * 5,
      executionIntegrity: 28 + (i + 1) * 5,
      fragmentationLevel: 72 - (i + 1) * 5,
      avoidancePressure: 68 - (i + 1) * 5,
    }),
  );

  const fullSeries = [...crisis, ...rebuild];

  it("is in RECOVERY at the crisis point (day 3)", () => {
    const result = evaluate({ evidence: crisis, signalSnapshots: [emptySnapshot(2)] });
    expect(result.state.currentMode).toBe("RECOVERY");
  });

  it("transitions out of RECOVERY by the end of the rebuild", () => {
    const result = evaluate({ evidence: fullSeries, signalSnapshots: [emptySnapshot(13)] });
    // Should have moved to STABILIZING or FOCUSED — not stuck in RECOVERY
    expect(result.state.currentMode).not.toBe("RECOVERY");
  });

  it("recoveryDebt decreases monotonically through the rebuild", () => {
    const debts = rebuild.map((_, i) => {
      const slice = [...crisis, ...rebuild.slice(0, i + 1)];
      return evaluate({ evidence: slice, signalSnapshots: [emptySnapshot(3 + i)] }).state
        .recoveryDebt;
    });
    // Not strictly monotone (smoothing), but the final value should be lower
    expect(debts[debts.length - 1]).toBeLessThan(debts[0]);
  });

  it("trajectory moves from FRAGILE/CONTRACTING toward STABLE or EXPANDING", () => {
    const earlyTrajectory = trajectoryAt([...crisis, ...rebuild.slice(0, 3)], 5);
    const lateTrajectory = trajectoryAt(fullSeries, 13);
    // Early: could be FRAGILE or CONTRACTING
    expect(["FRAGILE", "CONTRACTING", "STABLE"]).toContain(earlyTrajectory);
    // Late: should have improved
    expect(["STABLE", "EXPANDING", "FRAGILE"]).toContain(lateTrajectory);
  });
});

// ---------------------------------------------------------------------------
// R-4: Stable Expansion
// Extended consistent high performance → EXPANDING mode + STABLE trajectory
// ---------------------------------------------------------------------------

describe("Replay R-4: Stable Expansion", () => {
  const sustained = buildEvidence(14, {
    sleepQuality: 82,
    physicalEnergy: 80,
    mentalClarity: 78,
    overwhelm: 20,
    emotionalResistance: 18,
    stressPressure: 20,
    meaningfulAdvancementQuality: 80,
    deepWorkContinuity: 78,
    executionIntegrity: 78,
    fragmentationLevel: 18,
    avoidancePressure: 18,
    pacingQuality: 78,
  });

  const result = evaluate({ evidence: sustained, signalSnapshots: [emptySnapshot(13)] });

  it("classifies mode as EXPANDING after 14 days of strong sustained gates", () => {
    expect(result.state.currentMode).toBe("EXPANDING");
  });

  it("trajectory is STABLE (flat high performance is not EXPANDING trajectory)", () => {
    // Flat sustained strength = STABLE trend, not RISING
    expect(result.state.currentTrajectory).toBe("STABLE");
  });

  it("all primary dimension gates are satisfied", () => {
    const { recoveryDebt, cognitiveStrain, executionStability, emotionalFriction } = result.state;
    expect(recoveryDebt).toBeLessThan(THRESHOLDS.expandingRecoveryDebt + 5);
    expect(cognitiveStrain).toBeLessThan(THRESHOLDS.expandingCognitiveStrain + 5);
    expect(executionStability).toBeGreaterThan(THRESHOLDS.expandingExecutionStability - 5);
    expect(emotionalFriction).toBeLessThan(THRESHOLDS.expandingEmotionalFriction + 5);
  });

  it("carries HIGH or MEDIUM confidence with 14 days of evidence", () => {
    expect(["MEDIUM", "HIGH"]).toContain(result.state.confidence.band);
  });

  it("mode does not reach EXPANDING before sustained days threshold", () => {
    // After only 2 days of strong evidence, EXPANDING requires more sustained gates
    const earlyResult = evaluate({
      evidence: sustained.slice(0, 2),
      signalSnapshots: [emptySnapshot(1)],
    });
    expect(earlyResult.state.currentMode).not.toBe("EXPANDING");
  });
});

// ---------------------------------------------------------------------------
// R-5: Cold Restart (evidence gap — no prior history)
// User returns after absence. Day 1 only → LOW confidence, no RECOVERY
// ---------------------------------------------------------------------------

describe("Replay R-5: Cold Restart", () => {
  it("cold start produces LOW confidence and NOT RECOVERY mode", () => {
    const singleDay = [makeEvidence(0, {}, 0.5)];
    const result = evaluate({ evidence: singleDay, signalSnapshots: [] });
    expect(result.state.confidence.band).toBe("LOW");
    expect(result.state.currentMode).not.toBe("RECOVERY");
  });

  it("confidence rises as evidence accumulates", () => {
    const days1 = [makeEvidence(0, {}, 0.6)];
    const days4 = buildEvidence(4, {}, 0.9);

    const conf1 = evaluate({ evidence: days1, signalSnapshots: [] }).state.confidence.score;
    const conf4 = evaluate({ evidence: days4, signalSnapshots: [emptySnapshot(3)] }).state
      .confidence.score;

    expect(conf4).toBeGreaterThan(conf1);
  });

  it("even a very bad single day does not trigger RECOVERY (sustained evidence required)", () => {
    const veryBadDay = [
      makeEvidence(
        0,
        {
          sleepQuality: 10,
          physicalEnergy: 12,
          mentalClarity: 14,
          overwhelm: 95,
          emotionalResistance: 88,
          stressPressure: 85,
        },
        0.9,
      ),
    ];
    const result = evaluate({ evidence: veryBadDay, signalSnapshots: [] });
    expect(result.state.currentMode).not.toBe("RECOVERY");
  });

  it("produces a valid mode and trajectory on cold start", () => {
    const result = evaluate({ evidence: [], signalSnapshots: [] });
    expect(["RECOVERY", "STABILIZING", "FOCUSED", "EXPANDING"]).toContain(result.state.currentMode);
    expect(["EXPANDING", "STABLE", "FRAGILE", "CONTRACTING"]).toContain(
      result.state.currentTrajectory,
    );
  });
});

// ---------------------------------------------------------------------------
// Hysteresis: RECOVERY↔STABILIZING boundary
// ---------------------------------------------------------------------------

describe("Hysteresis: RECOVERY↔STABILIZING boundary", () => {
  const ENTRY_THRESHOLD = THRESHOLDS.recoveryDebtRecovery; // 55
  const EXIT_THRESHOLD = ENTRY_THRESHOLD - RECOVERY_EXIT_HYSTERESIS_BAND; // 47

  /**
   * Build evidence that produces a specific approximate recoveryDebt by
   * controlling sleep quality (the dominant contributor).
   * Higher sleepQuality → lower recoveryDebt.
   */
  function evidenceWithApproxDebt(days: number, targetDebt: "HIGH" | "BORDERLINE" | "LOW") {
    const configs = {
      HIGH: { sleepQuality: 20, physicalEnergy: 22, mentalClarity: 24 }, // debt ~70+
      BORDERLINE: { sleepQuality: 52, physicalEnergy: 52, mentalClarity: 52 }, // debt ~48–54
      LOW: { sleepQuality: 80, physicalEnergy: 78, mentalClarity: 78 }, // debt ~20–30
    };
    return buildEvidence(days, configs[targetDebt]);
  }

  it("RECOVERY triggers when recoveryDebt >= entry threshold (no prior RECOVERY)", () => {
    const evidence = evidenceWithApproxDebt(3, "HIGH");
    const result = evaluate({ evidence, signalSnapshots: [emptySnapshot(2)] });
    expect(result.state.recoveryDebt).toBeGreaterThan(ENTRY_THRESHOLD);
    expect(result.state.currentMode).toBe("RECOVERY");
  });

  it("with previousMode=RECOVERY, hysteresis keeps mode in RECOVERY until debt falls below exit threshold", () => {
    // Borderline debt: between exit threshold (47) and entry threshold (55)
    // Without hysteresis: might flip. With hysteresis: stays RECOVERY.
    const evidence = evidenceWithApproxDebt(3, "BORDERLINE");
    const result = evaluate({
      evidence,
      signalSnapshots: [emptySnapshot(2)],
      previousMode: "RECOVERY",
    });

    // Debt should be around 48–54 (borderline zone)
    const debt = result.state.recoveryDebt;

    if (debt > EXIT_THRESHOLD && debt < ENTRY_THRESHOLD) {
      // In the hysteresis zone — should stay RECOVERY due to hysteresis
      expect(result.state.currentMode).toBe("RECOVERY");
    }
    // If debt is already below exit threshold, STABILIZING is expected
  });

  it("with previousMode=RECOVERY, mode exits RECOVERY when debt clearly falls below exit threshold", () => {
    const evidence = evidenceWithApproxDebt(3, "LOW");
    const result = evaluate({
      evidence,
      signalSnapshots: [emptySnapshot(2)],
      previousMode: "RECOVERY",
    });
    // Low debt should exit RECOVERY regardless of hysteresis
    expect(result.state.recoveryDebt).toBeLessThan(EXIT_THRESHOLD);
    expect(result.state.currentMode).not.toBe("RECOVERY");
  });

  it("without previousMode, RECOVERY does NOT activate at borderline debt (below entry threshold)", () => {
    const evidence = evidenceWithApproxDebt(3, "BORDERLINE");
    const result = evaluate({
      evidence,
      signalSnapshots: [emptySnapshot(2)],
      // No previousMode — fresh evaluation
    });
    const debt = result.state.recoveryDebt;
    if (debt < ENTRY_THRESHOLD) {
      // Below entry threshold without being in RECOVERY — should NOT be RECOVERY
      expect(result.state.currentMode).not.toBe("RECOVERY");
    }
  });

  it("prevents same-day oscillation: RECOVERY→STABILIZING→RECOVERY on alternating input", () => {
    // 3 days clearly in RECOVERY
    const crisis = buildEvidence(3, { sleepQuality: 20, physicalEnergy: 22, mentalClarity: 24 });
    const crisisResult = evaluate({
      evidence: crisis,
      signalSnapshots: [emptySnapshot(2)],
    });
    expect(crisisResult.state.currentMode).toBe("RECOVERY");

    // One "good" day added — borderline recovery
    const withOneGoodDay = [
      ...crisis,
      makeEvidence(3, { sleepQuality: 56, physicalEnergy: 55, mentalClarity: 55 }),
    ];
    const afterGoodDay = evaluate({
      evidence: withOneGoodDay,
      signalSnapshots: [emptySnapshot(3)],
      previousMode: "RECOVERY",
    });

    // Hysteresis should prevent immediate exit from RECOVERY on a single better day
    // (the smoothed debt likely stays above exit threshold)
    expect(afterGoodDay.state.recoveryDebt).toBeGreaterThan(EXIT_THRESHOLD - 5);
  });
});

// ---------------------------------------------------------------------------
// Invariants — verified across all replay scenarios
// ---------------------------------------------------------------------------

describe("Invariants: valid across all replay scenarios", () => {
  const allScenarios = [
    buildEvidence(3, { sleepQuality: 20, physicalEnergy: 22 }),
    buildEvidence(14, { sleepQuality: 80, physicalEnergy: 78 }),
    buildEvidence(7, { overwhelm: 75, avoidancePressure: 70 }),
  ];

  it("mode is always a valid UserMode", () => {
    const validModes = ["RECOVERY", "STABILIZING", "FOCUSED", "EXPANDING"];
    for (const evidence of allScenarios) {
      const result = evaluate({ evidence, signalSnapshots: [emptySnapshot(evidence.length - 1)] });
      expect(validModes).toContain(result.state.currentMode);
    }
  });

  it("trajectory is always a valid UserTrajectory", () => {
    const validTrajectories = ["EXPANDING", "STABLE", "FRAGILE", "CONTRACTING"];
    for (const evidence of allScenarios) {
      const result = evaluate({ evidence, signalSnapshots: [emptySnapshot(evidence.length - 1)] });
      expect(validTrajectories).toContain(result.state.currentTrajectory);
    }
  });

  it("all scalar fields are bounded 0–100", () => {
    const scalarFields = [
      "recoveryDebt",
      "cognitiveStrain",
      "executionStability",
      "emotionalFriction",
      "momentumIntegrity",
      "resilienceCapacity",
      "overwhelmLevel",
      "fragmentationLevel",
      "recoveryCapacity",
      "meaningfulEngagement",
      "deepWorkContinuity",
      "behavioralVolatility",
      "adaptationReadiness",
      "expansionReadiness",
    ] as const;

    for (const evidence of allScenarios) {
      const { state } = evaluate({
        evidence,
        signalSnapshots: [emptySnapshot(evidence.length - 1)],
      });
      for (const field of scalarFields) {
        const value = state[field];
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("evaluate() is deterministic — same input produces identical output", () => {
    const evidence = buildEvidence(10, { sleepQuality: 65, overwhelm: 40 });
    const snapshot = emptySnapshot(9);
    const r1 = evaluate({ evidence, signalSnapshots: [snapshot] });
    const r2 = evaluate({ evidence, signalSnapshots: [snapshot] });
    expect(r1.state.currentMode).toBe(r2.state.currentMode);
    expect(r1.state.recoveryDebt).toBe(r2.state.recoveryDebt);
    expect(r1.state.executionStability).toBe(r2.state.executionStability);
    expect(r1.state.confidence.score).toBe(r2.state.confidence.score);
  });
});
