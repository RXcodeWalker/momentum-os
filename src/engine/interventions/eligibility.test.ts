import { describe, expect, it } from "vitest";
import { assessGates } from "./eligibility/evidence-gates";
import { evaluateInterventions } from "./evaluate";
import type { InterventionCandidate } from "./types/internal";
import type { SequencingDecision } from "@/core/contracts/tasks/sequencing";
import { makeUserState } from "@/testing/fixtures/task-intelligence";
import {
  makeSignalSnapshot,
  makeSequencing,
  makeInput,
} from "@/testing/fixtures/intervention-engine";

// ---------------------------------------------------------------------------
// Gate 4 — EV gate T0/T1 exemption (C-5 regression guard)
// ---------------------------------------------------------------------------

describe("Gate 4: interruptionValuePositive — T0/T1 exemption (C-5)", () => {
  const highFrictionHighDebt = makeUserState("RECOVERY", {
    emotionalFriction: 85,
    recoveryDebt: 88,
    burnoutRisk: "CRITICAL",
    collapseRisk: "CRITICAL",
  });

  const lowStrengthCandidate: InterventionCandidate = {
    type: "BURNOUT_PREVENTION",
    matchedSignals: ["RECOVERY_COLLAPSE"],
    minSignalDuration: 4,
    evidenceScore: 55, // below cost threshold without exemption
  };

  function makeBasicSequencing(): SequencingDecision {
    return makeSequencing();
  }

  it("BURNOUT_PREVENTION passes Gate 4 even at low signal strength + high friction", () => {
    const result = assessGates(lowStrengthCandidate, highFrictionHighDebt, makeBasicSequencing());
    expect(result.gates.gate4_interruptionValue).toBe(true);
    expect(result.eligible).toBe(true);
  });

  it("RECOVERY_ENFORCEMENT passes Gate 4 even at low signal strength + high friction", () => {
    const candidate: InterventionCandidate = {
      type: "RECOVERY_ENFORCEMENT",
      matchedSignals: ["DECLINING_EXECUTION_QUALITY"],
      minSignalDuration: 3,
      evidenceScore: 55,
    };
    const state = makeUserState("RECOVERY", {
      emotionalFriction: 85,
      recoveryDebt: 88,
      overloadRisk: "MODERATE",
    });
    const result = assessGates(candidate, state, makeBasicSequencing());
    expect(result.gates.gate4_interruptionValue).toBe(true);
  });

  it("OVERLOAD (T2) DOES fail Gate 4 at low signal strength + high friction", () => {
    const candidate: InterventionCandidate = {
      type: "OVERLOAD",
      matchedSignals: ["RISING_FRAGMENTATION"],
      minSignalDuration: 3,
      evidenceScore: 55,
    };
    const state = makeUserState("FOCUSED", {
      emotionalFriction: 85,
      recoveryDebt: 88,
      overloadRisk: "HIGH",
      overwhelmLevel: 70,
    });
    const result = assessGates(candidate, state, makeBasicSequencing());
    // 55 benefit vs 85*0.5 + 20 = 62.5 cost → should fail
    expect(result.gates.gate4_interruptionValue).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Gate 3 — sequencing saturation (eligibility eliminates, not downgrades)
// ---------------------------------------------------------------------------

describe("Gate 3: sequencingNotSaturated", () => {
  it("eliminates candidate when suppressed ≥50% AND recovery impact > 65", () => {
    const saturatedSequencing = makeSequencing({
      suppressedTaskIds: ["t1", "t2"],
      compressedTaskIds: ["t3"],
      expectedRecoveryImpact: 70,
    });
    const candidate: InterventionCandidate = {
      type: "OVERLOAD",
      matchedSignals: ["RISING_FRAGMENTATION"],
      minSignalDuration: 3,
      evidenceScore: 75,
    };
    const state = makeUserState("EXPANDING", { overloadRisk: "HIGH", overwhelmLevel: 70 });
    const result = assessGates(candidate, state, saturatedSequencing);
    expect(result.gates.gate3_sequencingSaturation).toBe(false);
    expect(result.eligible).toBe(false);
  });

  it("passes gate when suppressed ≥50% but recovery impact is low (≤65)", () => {
    const partialSequencing = makeSequencing({
      suppressedTaskIds: ["t1", "t2"],
      compressedTaskIds: ["t3"],
      expectedRecoveryImpact: 50, // not high enough to trigger gate 3
    });
    const candidate: InterventionCandidate = {
      type: "OVERLOAD",
      matchedSignals: ["RISING_FRAGMENTATION"],
      minSignalDuration: 3,
      evidenceScore: 75,
    };
    const state = makeUserState("EXPANDING", { overloadRisk: "HIGH", overwhelmLevel: 70 });
    const result = assessGates(candidate, state, partialSequencing);
    expect(result.gates.gate3_sequencingSaturation).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full pipeline: friction=90 + 2 L2 records still fires BURNOUT_PREVENTION
// (C-2 + C-3 combined regression guard — the most dangerous silent failure mode)
// ---------------------------------------------------------------------------

describe("Pipeline: critical burnout scenario not silenced by suppression rules", () => {
  const twoL2Records = [
    {
      interventionId: "r1",
      type: "OVERLOAD" as const,
      level: 2 as const,
      firedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      flowPhase: "morning" as const,
      cooldownDurationHours: 24,
    },
    {
      interventionId: "r2",
      type: "FRAGMENTATION_REDUCTION" as const,
      level: 2 as const,
      firedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      flowPhase: "morning" as const,
      cooldownDurationHours: 12,
    },
  ];

  const input = makeInput(
    {
      currentMode: "RECOVERY",
      burnoutRisk: "CRITICAL",
      collapseRisk: "CRITICAL",
      recoveryDebt: 88,
      emotionalFriction: 90, // above FRICTION_CEILING=85
      overloadRisk: "HIGH",
    },
    ["RECOVERY_COLLAPSE", "DECLINING_EXECUTION_QUALITY"],
    { RECOVERY_COLLAPSE: 4, DECLINING_EXECUTION_QUALITY: 3 },
    {},
    twoL2Records,
  );

  const result = evaluateInterventions(input);

  it("fires BURNOUT_PREVENTION even at friction=90 with 2 recent L2 records", () => {
    const types = result.interventions.map((i) => i.type);
    expect(types).toContain("BURNOUT_PREVENTION");
  });

  it("candidatesFound > 0 confirming the engine evaluated candidates", () => {
    expect(result.candidatesFound).toBeGreaterThan(0);
  });

  it("carries engineVersion in result", () => {
    expect(result.engineVersion).toBe("v1");
  });
});

// ---------------------------------------------------------------------------
// C-1: emptyResult mutation safety
// ---------------------------------------------------------------------------

describe("Pipeline: empty result mutation safety (C-1)", () => {
  it("mutating returned interventions array does not affect next call", () => {
    const input = makeInput({ currentMode: "FOCUSED" }, []); // no signals → no candidates
    const result1 = evaluateInterventions(input);
    expect(result1.interventions.length).toBe(0);

    // Attempt mutation
    result1.interventions.push({} as never);
    result1.evaluationNotes.push("CORRUPTED");

    const result2 = evaluateInterventions(input);
    expect(result2.interventions.length).toBe(0);
    expect(result2.evaluationNotes).not.toContain("CORRUPTED");
  });
});

// ---------------------------------------------------------------------------
// candidatesFound semantic: zero vs deliberate restraint
// ---------------------------------------------------------------------------

describe("Pipeline: candidatesFound distinguishes no-evidence from restraint", () => {
  it("candidatesFound=0 when no signals match any trigger", () => {
    const input = makeInput({ currentMode: "FOCUSED" }, []);
    const result = evaluateInterventions(input);
    expect(result.candidatesFound).toBe(0);
    expect(result.restraintApplied).toBe(false);
  });

  it("candidatesFound>0 and restraintApplied=true when cooldown blocks", () => {
    const recentRecord = {
      interventionId: "prev-1",
      type: "AVOIDANCE_INTERRUPTION" as const,
      level: 1 as const,
      firedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      flowPhase: "morning" as const,
      cooldownDurationHours: 36,
    };
    const input = makeInput(
      { currentMode: "STABILIZING", avoidanceRisk: "HIGH", emotionalFriction: 65 },
      ["AVOIDANCE_CLUSTERING", "MEANINGFULNESS_DEFERRAL"],
      { AVOIDANCE_CLUSTERING: 3, MEANINGFULNESS_DEFERRAL: 3 },
      {},
      [recentRecord],
    );
    const result = evaluateInterventions(input);
    expect(result.candidatesFound).toBeGreaterThan(0);
    expect(result.restraintApplied).toBe(true);
  });
});
