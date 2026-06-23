import { describe, expect, it } from "vitest";
import { applySoftRules } from "./suppression/soft-rules";
import type { InterventionCandidate, EligibilityAssessment } from "./types/internal";
import type { SequencingDecision } from "@/core/contracts/tasks/sequencing";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import { makeUserState, makeSignalSnapshot } from "@/testing/fixtures/task-intelligence";

const NOW = Date.now();

function makeCandidate(type: InterventionCandidate["type"] = "OVERLOAD"): InterventionCandidate {
  return {
    type,
    matchedSignals: ["RISING_FRAGMENTATION"],
    minSignalDuration: 3,
    evidenceScore: 75,
  };
}

function makeAssessment(
  type: InterventionCandidate["type"],
  maxLevel: 0 | 1 | 2 | 3 = 2,
): EligibilityAssessment {
  return {
    candidateType: type,
    gate1_signalEvidence: true,
    gate2_stateCorroboration: true,
    gate3_sequencingSaturation: true,
    gate4_interruptionValue: true,
    gate5_constitutionalFilter: true,
    eligible: true,
    maxAllowedLevel: maxLevel,
    reason: "all gates passed",
  };
}

function makeSequencing(overrides: Partial<SequencingDecision> = {}): SequencingDecision {
  return {
    recommendedPrimaryTaskId: "task-1",
    suppressedTaskIds: [],
    compressedTaskIds: [],
    sequencingReasoning: [],
    reasoningTrace: { factors: [], confidenceBand: "HIGH" },
    expectedRecoveryImpact: 30,
    expectedMomentumImpact: 50,
    sequencingConfidence: 70,
    ...overrides,
  };
}

function makeSnapshot(confidence: "LOW" | "MEDIUM" | "HIGH" = "HIGH"): SignalSnapshot {
  return makeSignalSnapshot() // task fixture returns empty signals with confidence
    ? {
        capturedAt: new Date().toISOString(),
        activeSignals: [],
        signalStrengths: {},
        signalDurations: {},
        confidence,
      }
    : {
        capturedAt: new Date().toISOString(),
        activeSignals: [],
        signalStrengths: {},
        signalDurations: {},
        confidence,
      };
}

function makeAuditRecord(level: 0 | 1 | 2 | 3, hoursAgo: number): InterventionAuditRecord {
  return {
    interventionId: `test-${hoursAgo}`,
    type: "OVERLOAD",
    level,
    firedAt: new Date(NOW - hoursAgo * 60 * 60 * 1000).toISOString(),
    flowPhase: "morning",
    cooldownDurationHours: 24,
  };
}

const state = makeUserState("FOCUSED");

// ---------------------------------------------------------------------------
// sequencing saturation → level 0 downgrade
// ---------------------------------------------------------------------------

describe("soft rule: sequencingSaturated", () => {
  it("downgrades to level 0 when ≥50% of tasks are suppressed", () => {
    const saturated = makeSequencing({
      suppressedTaskIds: ["t1", "t2"],
      compressedTaskIds: ["t3"],
    });
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD")],
      state,
      makeSnapshot(),
      saturated,
      [],
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBe(0);
    expect(verdicts[0].rule).toBe("SEQUENCING_SATURATED");
  });

  it("does not downgrade when suppression ratio < 50%", () => {
    const light = makeSequencing({
      suppressedTaskIds: ["t1"],
      compressedTaskIds: ["t2", "t3", "t4"],
    });
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD")],
      state,
      makeSnapshot(),
      light,
      [],
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBeUndefined();
  });

  it("does not downgrade when no tasks are involved", () => {
    const empty = makeSequencing({ suppressedTaskIds: [], compressedTaskIds: [] });
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD")],
      state,
      makeSnapshot(),
      empty,
      [],
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// low confidence → max level 1 downgrade
// ---------------------------------------------------------------------------

describe("soft rule: lowConfidenceDowngrade", () => {
  it("downgrades to level 1 when snapshot confidence is LOW and maxLevel > 1", () => {
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 2)],
      state,
      makeSnapshot("LOW"),
      makeSequencing(),
      [],
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBe(1);
  });

  it("does not downgrade when confidence is MEDIUM", () => {
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 2)],
      state,
      makeSnapshot("MEDIUM"),
      makeSequencing(),
      [],
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBeUndefined();
  });

  it("does not downgrade when maxLevel is already ≤1", () => {
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 1)],
      state,
      makeSnapshot("LOW"),
      makeSequencing(),
      [],
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// intervention fatigue → max level 1 downgrade
// ---------------------------------------------------------------------------

describe("soft rule: interventionFatigue", () => {
  it("downgrades to level 1 when a level-1+ intervention fired in last 24h", () => {
    const recent = [makeAuditRecord(1, 12)];
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 2)],
      state,
      makeSnapshot(),
      makeSequencing(),
      recent,
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBe(1);
  });

  it("does not downgrade when recent intervention fired > 24h ago", () => {
    const old = [makeAuditRecord(1, 25)];
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 2)],
      state,
      makeSnapshot(),
      makeSequencing(),
      old,
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBeUndefined();
  });

  it("does not downgrade when maxLevel is already ≤1", () => {
    const recent = [makeAuditRecord(1, 12)];
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 1)],
      state,
      makeSnapshot(),
      makeSequencing(),
      recent,
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Priority: saturation downgrades before fatigue
// ---------------------------------------------------------------------------

describe("soft rule: priority order", () => {
  it("saturation takes precedence over fatigue when both apply", () => {
    const saturated = makeSequencing({
      suppressedTaskIds: ["t1", "t2"],
      compressedTaskIds: ["t3"],
    });
    const recent = [makeAuditRecord(1, 12)];
    const verdicts = applySoftRules(
      [makeCandidate()],
      [makeAssessment("OVERLOAD", 2)],
      state,
      makeSnapshot(),
      saturated,
      recent,
      NOW,
    );
    expect(verdicts[0].downgradeLevel).toBe(0);
    expect(verdicts[0].rule).toBe("SEQUENCING_SATURATED");
  });
});
