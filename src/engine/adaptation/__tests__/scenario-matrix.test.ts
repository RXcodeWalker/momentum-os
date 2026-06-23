import { describe, it, expect } from "vitest";
import { generateAdaptation } from "../adaptation-engine";
import { scenarioFor } from "@/testing/fixtures/adaptation-engine";

type MatrixRow = {
  label: string;
  mode: "RECOVERY" | "STABILIZING" | "FOCUSED" | "EXPANDING";
  trajectory: "CONTRACTING" | "FRAGILE" | "STABLE" | "EXPANDING";
};

const MATRIX: MatrixRow[] = [
  { label: "RECOVERY × CONTRACTING", mode: "RECOVERY", trajectory: "CONTRACTING" },
  { label: "RECOVERY × FRAGILE", mode: "RECOVERY", trajectory: "FRAGILE" },
  { label: "RECOVERY × STABLE", mode: "RECOVERY", trajectory: "STABLE" },
  { label: "RECOVERY × EXPANDING", mode: "RECOVERY", trajectory: "EXPANDING" },
  { label: "STABILIZING × CONTRACTING", mode: "STABILIZING", trajectory: "CONTRACTING" },
  { label: "STABILIZING × FRAGILE", mode: "STABILIZING", trajectory: "FRAGILE" },
  { label: "STABILIZING × STABLE", mode: "STABILIZING", trajectory: "STABLE" },
  { label: "STABILIZING × EXPANDING", mode: "STABILIZING", trajectory: "EXPANDING" },
  { label: "FOCUSED × CONTRACTING", mode: "FOCUSED", trajectory: "CONTRACTING" },
  { label: "FOCUSED × FRAGILE", mode: "FOCUSED", trajectory: "FRAGILE" },
  { label: "FOCUSED × STABLE", mode: "FOCUSED", trajectory: "STABLE" },
  { label: "FOCUSED × EXPANDING", mode: "FOCUSED", trajectory: "EXPANDING" },
  { label: "EXPANDING × CONTRACTING", mode: "EXPANDING", trajectory: "CONTRACTING" },
  { label: "EXPANDING × FRAGILE", mode: "EXPANDING", trajectory: "FRAGILE" },
  { label: "EXPANDING × STABLE", mode: "EXPANDING", trajectory: "STABLE" },
  { label: "EXPANDING × EXPANDING", mode: "EXPANDING", trajectory: "EXPANDING" },
];

// Pre-run all 16 outputs
const OUTPUTS = MATRIX.map((row) => ({
  ...row,
  output: generateAdaptation(scenarioFor(row.mode, row.trajectory)),
}));

describe("Scenario matrix: universal invariants (all 16 rows)", () => {
  it.each(MATRIX)("$label: visibleTaskLimit ≥ 1", ({ mode, trajectory }) => {
    const output = generateAdaptation(scenarioFor(mode, trajectory));
    expect(output.execution.visibleTaskLimit).toBeGreaterThanOrEqual(1);
  });

  it.each(MATRIX)("$label: adaptationTrace is defined (non-prod build)", ({ mode, trajectory }) => {
    const output = generateAdaptation(scenarioFor(mode, trajectory));
    expect(output.adaptationTrace).toBeDefined();
  });

  it.each(MATRIX)(
    "$label: recoveryWeighting + advancementWeighting ≈ 1.0",
    ({ mode, trajectory }) => {
      const output = generateAdaptation(scenarioFor(mode, trajectory));
      expect(
        output.execution.recoveryWeighting + output.execution.advancementWeighting,
      ).toBeCloseTo(1.0, 3);
    },
  );

  it.each(MATRIX)("$label: adaptationReasoning not empty", ({ mode, trajectory }) => {
    const output = generateAdaptation(scenarioFor(mode, trajectory));
    expect(output.adaptationReasoning.length).toBeGreaterThan(0);
  });
});

describe("Scenario matrix: mode ordering invariants", () => {
  it("RECOVERY always has lowest interfaceDensity vs STABILIZING vs FOCUSED vs EXPANDING (same STABLE trajectory)", () => {
    const get = (mode: MatrixRow["mode"]) =>
      OUTPUTS.find((o) => o.mode === mode && o.trajectory === "STABLE")!.output.environmental
        .interfaceDensity;
    expect(get("RECOVERY")).toBeLessThan(get("STABILIZING"));
    expect(get("STABILIZING")).toBeLessThan(get("FOCUSED"));
    expect(get("FOCUSED")).toBeLessThan(get("EXPANDING"));
  });

  it("CONTRACTING reduces visibleTaskLimit vs STABLE for all modes", () => {
    for (const mode of ["RECOVERY", "STABILIZING", "FOCUSED", "EXPANDING"] as const) {
      const contracting = OUTPUTS.find((o) => o.mode === mode && o.trajectory === "CONTRACTING")!
        .output.execution.visibleTaskLimit;
      const stable = OUTPUTS.find((o) => o.mode === mode && o.trajectory === "STABLE")!.output
        .execution.visibleTaskLimit;
      expect(contracting).toBeLessThan(stable);
    }
  });

  it("EXPANDING trajectory raises visibleTaskLimit vs STABLE for all modes", () => {
    for (const mode of ["RECOVERY", "STABILIZING", "FOCUSED", "EXPANDING"] as const) {
      const expanding = OUTPUTS.find((o) => o.mode === mode && o.trajectory === "EXPANDING")!.output
        .execution.visibleTaskLimit;
      const stable = OUTPUTS.find((o) => o.mode === mode && o.trajectory === "STABLE")!.output
        .execution.visibleTaskLimit;
      expect(expanding).toBeGreaterThan(stable);
    }
  });
});

describe("Scenario matrix: reference point", () => {
  it("FOCUSED × STABLE is the zero-intensity reference: adaptationIntensity === 0", () => {
    const output = OUTPUTS.find((o) => o.mode === "FOCUSED" && o.trajectory === "STABLE")!.output;
    expect(output.adaptationIntensity).toBe(0);
  });
});

describe("Scenario matrix: pacing invariants", () => {
  it("All 4 RECOVERY rows produce REDUCE_LOAD pacing", () => {
    for (const o of OUTPUTS.filter((o) => o.mode === "RECOVERY")) {
      expect(o.output.execution.pacingRecommendation).toBe("REDUCE_LOAD");
    }
  });

  it("EXPANDING × STABLE produces INCREASE_CHALLENGE pacing", () => {
    const output = OUTPUTS.find((o) => o.mode === "EXPANDING" && o.trajectory === "STABLE")!.output;
    expect(output.execution.pacingRecommendation).toBe("INCREASE_CHALLENGE");
  });
});

describe("Scenario matrix: tone invariants", () => {
  it("EXPANDING × CONTRACTING produces CHALLENGING tone (challengeLevel > 70 wins over CONTRACTING branch)", () => {
    // EXPANDING baseline challengeLevel=80 > 70, so CHALLENGING fires before CONTRACTING check
    const output = OUTPUTS.find(
      (o) => o.mode === "EXPANDING" && o.trajectory === "CONTRACTING",
    )!.output;
    expect(output.guidance.messagingTone).toBe("CHALLENGING");
  });

  it("RECOVERY × STABLE produces STABILIZING tone", () => {
    const output = OUTPUTS.find((o) => o.mode === "RECOVERY" && o.trajectory === "STABLE")!.output;
    expect(output.guidance.messagingTone).toBe("STABILIZING");
  });
});
