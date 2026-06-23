import { describe, it, expect } from "vitest";
import { generateAdaptation } from "../adaptation-engine";
import { makeAdaptationInput, withAllRisksCritical } from "@/testing/fixtures/adaptation-engine";
import type { AdaptationDirective } from "@/core/contracts/adaptation/directives";

describe("Conflict resolution: all 4 risks CRITICAL simultaneously (RECOVERY/STABLE)", () => {
  const input = withAllRisksCritical(
    makeAdaptationInput({
      state: {
        currentMode: "RECOVERY",
        currentTrajectory: "STABLE",
      },
    }),
  );
  const output = generateAdaptation(input);

  it("visibleTaskLimit = 2 (RECOVERY baseline wins over risk gate ceilings)", () => {
    // RECOVERY baseline: 2; burnoutRisk CRITICAL ceil(3) → 2 stays; overload CRITICAL ceil(4) → 2 stays
    expect(output.execution.visibleTaskLimit).toBe(2);
  });

  it("workloadCompressionRatio ≤ 0.50 (burnout CRITICAL gate)", () => {
    // RECOVERY baseline: 0.40; burnout CRITICAL ceil(0.50) → no change since 0.40 < 0.50
    expect(output.execution.workloadCompressionRatio).toBeLessThanOrEqual(0.5);
  });

  it("interventionFrequency ≥ 70 (collapseRisk CRITICAL floor)", () => {
    // RECOVERY baseline: 80; collapse CRITICAL floor(70) → stays at 80 since 80 > 70
    expect(output.guidance.interventionFrequency).toBeGreaterThanOrEqual(70);
  });

  it("interfaceDensity ≤ 40 (burnoutRisk CRITICAL gate wins over RECOVERY 30)", () => {
    // RECOVERY baseline: 30; burnout CRITICAL ceil(40) → 30 stays (already ≤ 40)
    expect(output.environmental.interfaceDensity).toBeLessThanOrEqual(40);
  });

  it("deepWorkExpectation ≤ 20 (collapseRisk CRITICAL gate)", () => {
    // RECOVERY baseline: 10; collapse CRITICAL ceil(20) → stays at 10
    expect(output.execution.deepWorkExpectation).toBeLessThanOrEqual(20);
  });
});

describe("Conflict resolution: directive overrides risk gate", () => {
  it("burnout CRITICAL + directive sets interfaceDensity=90 → final output is 90", () => {
    const directives: AdaptationDirective[] = [
      { field: "environmental.interfaceDensity", suggestedValue: 90, reason: "test directive" },
    ];
    const input = makeAdaptationInput({
      state: {
        currentMode: "FOCUSED",
        currentTrajectory: "STABLE",
        burnoutRisk: "CRITICAL",
      },
      directives,
    });
    const output = generateAdaptation(input);
    // Risk gate set it to ≤ 40, then directive set it to 90 (no clamp after directives)
    expect(output.environmental.interfaceDensity).toBe(90);
  });

  it("trace: risk layer wrote ≤ 40, directive layer wrote 90 (last entry wins)", () => {
    const directives: AdaptationDirective[] = [
      { field: "environmental.interfaceDensity", suggestedValue: 90, reason: "test directive" },
    ];
    const input = makeAdaptationInput({
      state: {
        currentMode: "FOCUSED",
        currentTrajectory: "STABLE",
        burnoutRisk: "CRITICAL",
      },
      directives,
    });
    const output = generateAdaptation(input);
    const trace = output.adaptationTrace!;
    const densityEntries = trace.entries.filter((e) => e.field.includes("interfaceDensity"));
    // There should be a directive entry for interfaceDensity
    const directiveEntry = densityEntries.find((e) => e.layer === "directive");
    expect(directiveEntry).toBeDefined();
    expect(directiveEntry!.newValue).toBe(90);
    // The last density entry should be the directive
    const lastEntry = densityEntries[densityEntries.length - 1];
    expect(lastEntry.layer).toBe("directive");
    expect(lastEntry.newValue).toBe(90);
  });
});

describe("Conflict resolution: AVOIDANCE_CLUSTERING at exactly threshold", () => {
  it("strength=55: visibleTaskLimit is NOT reduced (at-threshold = no fire)", () => {
    const input = makeAdaptationInput({
      state: { currentMode: "FOCUSED", currentTrajectory: "STABLE" },
      signals: ["AVOIDANCE_CLUSTERING"],
      signalStrengths: { AVOIDANCE_CLUSTERING: 55 },
    });
    const baseInput = makeAdaptationInput({
      state: { currentMode: "FOCUSED", currentTrajectory: "STABLE" },
    });
    const withSignal = generateAdaptation(input);
    const withoutSignal = generateAdaptation(baseInput);
    // At exactly threshold, signal should NOT fire
    expect(withSignal.execution.visibleTaskLimit).toBe(withoutSignal.execution.visibleTaskLimit);
  });

  it("strength=56: visibleTaskLimit reduced by 1", () => {
    const input = makeAdaptationInput({
      state: { currentMode: "FOCUSED", currentTrajectory: "STABLE" },
      signals: ["AVOIDANCE_CLUSTERING"],
      signalStrengths: { AVOIDANCE_CLUSTERING: 56 },
    });
    const baseInput = makeAdaptationInput({
      state: { currentMode: "FOCUSED", currentTrajectory: "STABLE" },
    });
    const withSignal = generateAdaptation(input);
    const withoutSignal = generateAdaptation(baseInput);
    expect(withSignal.execution.visibleTaskLimit).toBe(
      withoutSignal.execution.visibleTaskLimit - 1,
    );
  });
});

describe("Conflict resolution: signal tuning below risk gate minimum", () => {
  it("overloadRisk CRITICAL caps visualNoiseLevel at 35; RISING_FRAGMENTATION at 90 then subtracts further", () => {
    const input = makeAdaptationInput({
      state: {
        currentMode: "EXPANDING", // starts at visualNoiseLevel 70
        currentTrajectory: "STABLE",
        overloadRisk: "CRITICAL",
      },
      signals: ["RISING_FRAGMENTATION"],
      signalStrengths: { RISING_FRAGMENTATION: 90 },
    });
    const output = generateAdaptation(input);
    // Risk gate: 70 → 35; Signal: 35 - (90-60)*0.3 = 35 - 9 = 26; signals run after risk, no re-gate
    expect(output.environmental.visualNoiseLevel).toBeLessThan(35);
    expect(output.environmental.visualNoiseLevel).toBeGreaterThanOrEqual(0);
  });
});

describe("Conflict resolution: signal + overloadRisk CRITICAL on task limit", () => {
  it("FOCUSED/STABLE baseline (6) → overload CRITICAL (≤4) → AVOIDANCE_CLUSTERING at 80 (−1) → 3", () => {
    const input = makeAdaptationInput({
      state: {
        currentMode: "FOCUSED",
        currentTrajectory: "STABLE",
        overloadRisk: "CRITICAL",
      },
      signals: ["AVOIDANCE_CLUSTERING"],
      signalStrengths: { AVOIDANCE_CLUSTERING: 80 },
    });
    const output = generateAdaptation(input);
    expect(output.execution.visibleTaskLimit).toBe(3);
  });
});
