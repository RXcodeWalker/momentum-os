import { describe, expect, it } from "vitest";
import { evaluateInterventions } from "./evaluate";
import {
  buildScenario_RecoverySpiral,
  buildScenario_AvoidanceCluster,
  buildScenario_AvoidanceCluster_CooldownActive,
  buildScenario_ExpandingOvercommit_Saturated,
  buildScenario_ExpandingOvercommit_NotSaturated,
} from "@/testing/fixtures/intervention-engine";

// ---------------------------------------------------------------------------
// Simulation 1 — RecoverySpiral
// Evidence: RECOVERY_COLLAPSE (4d) + DECLINING_EXECUTION_QUALITY (3d)
// State: burnoutRisk CRITICAL, collapseRisk CRITICAL, RECOVERY mode
// Expected: BURNOUT_PREVENTION fires at level ≥1 (T0 highest priority)
// ---------------------------------------------------------------------------

describe("Simulation: RecoverySpiral", () => {
  const input = buildScenario_RecoverySpiral();
  const result = evaluateInterventions(input);

  it("fires at least one intervention", () => {
    expect(result.interventions.length).toBeGreaterThan(0);
  });

  it("selects BURNOUT_PREVENTION as the intervention type (T0)", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).toContain("BURNOUT_PREVENTION");
  });

  it("fires at level ≥ 1 (sustained critical evidence)", () => {
    const bp = result.interventions.find((i) => i.type === "BURNOUT_PREVENTION");
    expect(bp?.level).toBeGreaterThanOrEqual(1);
  });

  it("includes observational triggerReasoning (no scores/formulas)", () => {
    const bp = result.interventions.find((i) => i.type === "BURNOUT_PREVENTION");
    expect(bp?.triggerReasoning.length).toBeGreaterThan(0);
    for (const reason of bp?.triggerReasoning ?? []) {
      expect(reason).not.toMatch(/\d+%|\bscore\b|\bweight\b|\bthreshold\b/i);
    }
  });

  it("does not include shame, urgency, or identity language", () => {
    const bp = result.interventions.find((i) => i.type === "BURNOUT_PREVENTION");
    const allText = [
      ...(bp?.triggerReasoning ?? []),
      bp?.interventionMessage ?? "",
      bp?.emotionalGoal ?? "",
    ].join(" ");
    expect(allText).not.toMatch(/\b(failing|lazy|procrastinating|should|must|always|never)\b/i);
  });

  it("emits adaptation directives pointing to compression", () => {
    const bp = result.interventions.find((i) => i.type === "BURNOUT_PREVENTION");
    const hasCompressionDirective = bp?.adaptationDirectives.some(
      (d) => d.field.includes("workload") || d.field.includes("interfaceDensity"),
    );
    expect(hasCompressionDirective).toBe(true);
  });

  it("does not include deprecated types", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).not.toContain("MOMENTUM_EXPANSION");
    expect(types).not.toContain("CAPABILITY_CONTRACTION");
  });
});

// ---------------------------------------------------------------------------
// Simulation 2 — AvoidanceCluster
// Evidence: AVOIDANCE_CLUSTERING (3d) + MEANINGFULNESS_DEFERRAL (3d)
// State: avoidanceRisk HIGH, emotionalFriction 65
// Expected: AVOIDANCE_INTERRUPTION fires at level 1
// Second run (cooldown active 10h ago): suppressed, restraintApplied true
// ---------------------------------------------------------------------------

describe("Simulation: AvoidanceCluster — first run", () => {
  const input = buildScenario_AvoidanceCluster();
  const result = evaluateInterventions(input);

  it("fires AVOIDANCE_INTERRUPTION", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).toContain("AVOIDANCE_INTERRUPTION");
  });

  it("fires at level 1 (sustained 3-day evidence)", () => {
    const av = result.interventions.find((i) => i.type === "AVOIDANCE_INTERRUPTION");
    expect(av?.level).toBe(1);
  });

  it("sets suppressionEligible true at level 1", () => {
    const av = result.interventions.find((i) => i.type === "AVOIDANCE_INTERRUPTION");
    expect(av?.suppressionEligible).toBe(true);
  });

  it("includes cooldownDurationHours for audit record creation", () => {
    const av = result.interventions.find((i) => i.type === "AVOIDANCE_INTERRUPTION");
    expect(av?.cooldownDurationHours).toBeGreaterThan(0);
  });
});

describe("Simulation: AvoidanceCluster — cooldown active (suppression regression)", () => {
  const input = buildScenario_AvoidanceCluster_CooldownActive();
  const result = evaluateInterventions(input);

  it("fires no level ≥1 interventions while cooldown is active", () => {
    const highLevel = result.interventions.filter((i) => i.level >= 1);
    expect(highLevel.length).toBe(0);
  });

  it("sets restraintApplied true when cooldown suppresses", () => {
    expect(result.restraintApplied).toBe(true);
  });

  it("includes cooldown note in evaluationNotes", () => {
    const hasNote = result.evaluationNotes.some(
      (n) => n.toLowerCase().includes("cooldown") || n.toLowerCase().includes("avoidance"),
    );
    expect(hasNote).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Simulation 3 — ExpandingOvercommit
// Evidence: RISING_FRAGMENTATION (3d) + PACING_INSTABILITY (3d), EXPANDING mode
// Case A (saturated): sequencing already suppressed 50%+ → OVERLOAD at level 0
// Case B (not saturated): OVERLOAD fires at level 1
// Regression: MOMENTUM_EXPANSION never appears regardless
// ---------------------------------------------------------------------------

describe("Simulation: ExpandingOvercommit — sequencing saturated (soft downgrade)", () => {
  const input = buildScenario_ExpandingOvercommit_Saturated();
  const result = evaluateInterventions(input);

  it("fires OVERLOAD or no high-level intervention when sequencing is saturated", () => {
    const highLevel = result.interventions.filter((i) => i.level >= 1);
    // Sequencing saturation should downgrade to level 0 or suppress entirely
    expect(highLevel.length).toBe(0);
  });

  it("sets restraintApplied true due to soft downgrade", () => {
    expect(result.restraintApplied).toBe(true);
  });

  it("never includes deprecated MOMENTUM_EXPANSION", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).not.toContain("MOMENTUM_EXPANSION");
    expect(types).not.toContain("CAPABILITY_CONTRACTION");
  });
});

describe("Simulation: ExpandingOvercommit — sequencing not saturated", () => {
  const input = buildScenario_ExpandingOvercommit_NotSaturated();
  const result = evaluateInterventions(input);

  it("fires OVERLOAD when sequencing has not already compressed the load", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).toContain("OVERLOAD");
  });

  it("fires at level 1 with 3-day sustained signal evidence", () => {
    const overload = result.interventions.find((i) => i.type === "OVERLOAD");
    expect(overload?.level).toBeGreaterThanOrEqual(1);
  });

  it("still never includes deprecated types", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).not.toContain("MOMENTUM_EXPANSION");
    expect(types).not.toContain("CAPABILITY_CONTRACTION");
  });
});
