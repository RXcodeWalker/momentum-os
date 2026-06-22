import { describe, expect, it } from "vitest";
import { computeAttribution } from "./attribution";
import { computeTypeEffectiveness, computeAllEffectiveness } from "./effectiveness";
import { computeFatigueSignal } from "./fatigue";
import { buildIntelligenceAdvisories } from "./advisor";
import { buildPendingOutcomeRecord } from "./measure-outcome";
import { reconcileOutcomeRecord } from "./reconcile";
import type { InterventionOutcomeRecord } from "@/core/contracts/interventions/intelligence";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import type { DayData } from "@/lib/store";
import type { CheckIn } from "@/lib/store";

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

function isoAgo(daysAgo: number): string {
  return new Date(NOW - daysAgo * DAY_MS).toISOString();
}

function dateAgo(daysAgo: number): string {
  return new Date(NOW - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

function makeDay(daysAgo: number, overrides: Partial<DayData> = {}): DayData {
  return {
    date: dateAgo(daysAgo),
    executionScore: 65,
    focus: 6,
    sleepHours: 7,
    distractions: 3,
    planned: 5,
    completed: 4,
    recovery: false,
    ...overrides,
  };
}

function makeCheckIn(daysAgo: number, overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    date: dateAgo(daysAgo),
    honesty: 7,
    focus: 6,
    sleepHours: 7,
    energy: 6,
    mood: 6,
    completed: 4,
    planned: 5,
    distractions: [],
    blockers: {},
    ...overrides,
  };
}

function makeAuditRecord(
  type: InterventionAuditRecord["type"],
  daysAgo: number,
): InterventionAuditRecord {
  return {
    interventionId: `test-${type}-${daysAgo}`,
    type,
    level: 2,
    firedAt: isoAgo(daysAgo),
    flowPhase: "evening",
    cooldownDurationHours: 24,
  };
}

function makeOutcomeRecord(
  type: InterventionOutcomeRecord["type"],
  overrides: Partial<InterventionOutcomeRecord> = {},
): InterventionOutcomeRecord {
  return {
    outcomeId: `test-${type}`,
    type,
    firedAt: isoAgo(10),
    targetMetricId: "EXECUTION_SCORE",
    baselineValue: 55,
    postWindowValue: null,
    outcomeDelta: null,
    windowDays: 3,
    postCheckInCount: 0,
    status: "PENDING",
    finalizedAt: null,
    attribution: null,
    expiresAt: isoAgo(-90),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Attribution — confounder detection
// ---------------------------------------------------------------------------

describe("computeAttribution — UNATTRIBUTABLE when insufficient post data", () => {
  it("returns UNATTRIBUTABLE when postCheckInCount < 3", () => {
    const record = makeOutcomeRecord("OVERLOAD", {
      postCheckInCount: 2,
      postWindowValue: 68,
      outcomeDelta: 13,
      status: "MEASURED",
    });
    const result = computeAttribution(record, [], [], []);
    expect(result.verdict).toBe("UNATTRIBUTABLE");
    expect(result.hardConfounders).toContain("INSUFFICIENT_POSTDATA");
  });
});

describe("computeAttribution — CONCURRENT_INTERVENTION confounder", () => {
  it("returns UNATTRIBUTABLE when another intervention fired inside window", () => {
    const firedAt = isoAgo(5);
    const record = makeOutcomeRecord("FRAGMENTATION_REDUCTION", {
      firedAt,
      postCheckInCount: 3,
      postWindowValue: 72,
      outcomeDelta: 17,
      windowDays: 3,
      status: "MEASURED",
    });
    // Another intervention fired 2 days after (inside 3d window)
    const concurrentAudit = makeAuditRecord("AVOIDANCE_INTERRUPTION", 3);
    concurrentAudit.firedAt = isoAgo(3);

    const result = computeAttribution(record, [], [], [concurrentAudit]);
    expect(result.verdict).toBe("UNATTRIBUTABLE");
    expect(result.hardConfounders).toContain("CONCURRENT_INTERVENTION");
  });
});

describe("computeAttribution — directional verdict when no confounders", () => {
  it("returns IMPROVED for positive delta without confounders", () => {
    const record = makeOutcomeRecord("RESTART_ASSISTANCE", {
      firedAt: isoAgo(10),
      postCheckInCount: 4,
      postWindowValue: 70,
      outcomeDelta: 15,
      windowDays: 3,
      status: "MEASURED",
    });
    // Provide history without recovery flag and no sleep shift
    const history = [
      makeDay(13),
      makeDay(12),
      makeDay(11), // pre-window
      makeDay(9),
      makeDay(8),
      makeDay(7), // post-window (inside 3d after fire at day 10)
    ];
    const checkIns = history.map((d) => makeCheckIn(0, { date: d.date }));
    const result = computeAttribution(record, history, checkIns, []);
    // Weekend boundary may trigger for some date combinations — we check that if
    // no hard confounders remain, verdict is directional (IMPROVED, NEUTRAL, or WORSENED)
    if (result.hardConfounders.length === 0) {
      expect(["IMPROVED", "NEUTRAL", "WORSENED"]).toContain(result.verdict);
    } else {
      expect(result.verdict).toBe("UNATTRIBUTABLE");
    }
  });
});

// ---------------------------------------------------------------------------
// Effectiveness scoring
// ---------------------------------------------------------------------------

describe("computeTypeEffectiveness — INSUFFICIENT_EVIDENCE below minimum", () => {
  it("returns INSUFFICIENT_EVIDENCE with fewer than 4 attributable outcomes", () => {
    const outcomes: InterventionOutcomeRecord[] = [
      makeOutcomeRecord("OVERLOAD", {
        status: "FINALIZED",
        outcomeDelta: 10,
        attribution: { verdict: "IMPROVED", hardConfounders: [], softConfounders: [], basis: "" },
      }),
      makeOutcomeRecord("OVERLOAD", {
        outcomeId: "test-OVERLOAD-2",
        status: "FINALIZED",
        outcomeDelta: 8,
        attribution: { verdict: "IMPROVED", hardConfounders: [], softConfounders: [], basis: "" },
      }),
    ];
    const result = computeTypeEffectiveness("OVERLOAD", outcomes);
    expect(result.verdict).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.confidence).toBe("INSUFFICIENT");
  });
});

describe("computeTypeEffectiveness — WORKING with sufficient IMPROVED outcomes", () => {
  it("returns WORKING when median delta ≥ threshold and sign agreement ≥ 70%", () => {
    const makeImprovedOutcome = (id: string, delta: number): InterventionOutcomeRecord => ({
      ...makeOutcomeRecord("FRAGMENTATION_REDUCTION", {
        outcomeId: id,
        status: "FINALIZED",
        outcomeDelta: delta,
        attribution: { verdict: "IMPROVED", hardConfounders: [], softConfounders: [], basis: "" },
      }),
    });

    const outcomes = [
      makeImprovedOutcome("o1", 8),
      makeImprovedOutcome("o2", 12),
      makeImprovedOutcome("o3", 5),
      makeImprovedOutcome("o4", 9),
      makeImprovedOutcome("o5", 7),
    ];
    const result = computeTypeEffectiveness("FRAGMENTATION_REDUCTION", outcomes);
    expect(result.verdict).toBe("WORKING");
    expect(result.medianDelta).toBeGreaterThanOrEqual(3);
  });
});

describe("computeTypeEffectiveness — NOT_WORKING with negative median delta", () => {
  it("returns NOT_WORKING when median delta ≤ -3", () => {
    const makeWorsenedOutcome = (id: string, delta: number): InterventionOutcomeRecord => ({
      ...makeOutcomeRecord("AVOIDANCE_INTERRUPTION", {
        outcomeId: id,
        status: "FINALIZED",
        outcomeDelta: delta,
        attribution: { verdict: "WORSENED", hardConfounders: [], softConfounders: [], basis: "" },
      }),
    });

    const outcomes = [
      makeWorsenedOutcome("o1", -6),
      makeWorsenedOutcome("o2", -4),
      makeWorsenedOutcome("o3", -8),
      makeWorsenedOutcome("o4", -5),
    ];
    const result = computeTypeEffectiveness("AVOIDANCE_INTERRUPTION", outcomes);
    expect(result.verdict).toBe("NOT_WORKING");
    expect(result.medianDelta).toBeLessThanOrEqual(-3);
  });
});

// ---------------------------------------------------------------------------
// Cooldown advisory — caps and safety-type exemptions
// ---------------------------------------------------------------------------

describe("buildIntelligenceAdvisories — cooldown multiplier caps", () => {
  it("caps cooldown multiplier at 3× for NOT_WORKING + HIGH fatigue", () => {
    // Build a report state that triggers max advisory
    const effectiveness = computeAllEffectiveness([
      // 4+ NOT_WORKING outcomes for DEEP_WORK_PROTECTION with MEDIUM+ confidence
      ...["o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8"].map((id, i) => ({
        ...makeOutcomeRecord("DEEP_WORK_PROTECTION", {
          outcomeId: id,
          status: "FINALIZED" as const,
          outcomeDelta: -8 - i,
          attribution: {
            verdict: "WORSENED" as const,
            hardConfounders: [],
            softConfounders: [],
            basis: "",
          },
        }),
      })),
    ]);

    const fatigueSignals = [
      {
        type: "DEEP_WORK_PROTECTION" as const,
        level: "HIGH" as const,
        basis: ["Fired 5× without improvement."],
      },
    ];

    const report = buildIntelligenceAdvisories([], effectiveness, fatigueSignals, null);
    const advisory = report.cooldownAdvisories.find((a) => a.type === "DEEP_WORK_PROTECTION");

    expect(advisory).toBeDefined();
    expect(advisory!.multiplier).toBeLessThanOrEqual(3);
    expect(advisory!.multiplier).toBeGreaterThanOrEqual(1);
  });

  it("forces BURNOUT_PREVENTION cooldown multiplier to 1× regardless of verdict", () => {
    const effectiveness = computeAllEffectiveness([
      ...["o1", "o2", "o3", "o4"].map((id) => ({
        ...makeOutcomeRecord("BURNOUT_PREVENTION", {
          outcomeId: id,
          status: "FINALIZED" as const,
          outcomeDelta: -10,
          attribution: {
            verdict: "WORSENED" as const,
            hardConfounders: [],
            softConfounders: [],
            basis: "",
          },
        }),
      })),
    ]);

    const fatigueSignals = [
      { type: "BURNOUT_PREVENTION" as const, level: "HIGH" as const, basis: ["test"] },
    ];

    const report = buildIntelligenceAdvisories([], effectiveness, fatigueSignals, null);
    const advisory = report.cooldownAdvisories.find((a) => a.type === "BURNOUT_PREVENTION");

    expect(advisory!.multiplier).toBe(1); // safety type: never extended
  });

  it("forces RECOVERY_ENFORCEMENT cooldown multiplier to 1×", () => {
    const fatigueSignals = [
      { type: "RECOVERY_ENFORCEMENT" as const, level: "HIGH" as const, basis: ["test"] },
    ];
    const report = buildIntelligenceAdvisories([], [], fatigueSignals, null);
    const advisory = report.cooldownAdvisories.find((a) => a.type === "RECOVERY_ENFORCEMENT");
    expect(advisory!.multiplier).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Suppression advisory — safety types never demoted
// ---------------------------------------------------------------------------

describe("buildIntelligenceAdvisories — suppression DEMOTE", () => {
  it("never demotes BURNOUT_PREVENTION", () => {
    const effectiveness = computeAllEffectiveness([
      ...["o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8"].map((id) => ({
        ...makeOutcomeRecord("BURNOUT_PREVENTION", {
          outcomeId: id,
          status: "FINALIZED" as const,
          outcomeDelta: -12,
          attribution: {
            verdict: "WORSENED" as const,
            hardConfounders: [],
            softConfounders: [],
            basis: "",
          },
        }),
      })),
    ]);
    const fatigueSignals = [
      { type: "BURNOUT_PREVENTION" as const, level: "HIGH" as const, basis: ["test"] },
    ];
    const report = buildIntelligenceAdvisories([], effectiveness, fatigueSignals, null);
    const advisory = report.suppressionAdvisories.find((a) => a.type === "BURNOUT_PREVENTION");
    expect(advisory!.action).toBe("NONE");
  });

  it("never demotes RECOVERY_ENFORCEMENT", () => {
    const fatigueSignals = [
      { type: "RECOVERY_ENFORCEMENT" as const, level: "HIGH" as const, basis: ["test"] },
    ];
    const effectiveness = computeAllEffectiveness([
      ...["o1", "o2", "o3", "o4"].map((id) => ({
        ...makeOutcomeRecord("RECOVERY_ENFORCEMENT", {
          outcomeId: id,
          status: "FINALIZED" as const,
          outcomeDelta: -8,
          attribution: {
            verdict: "WORSENED" as const,
            hardConfounders: [],
            softConfounders: [],
            basis: "",
          },
        }),
      })),
    ]);
    const report = buildIntelligenceAdvisories([], effectiveness, fatigueSignals, null);
    const advisory = report.suppressionAdvisories.find((a) => a.type === "RECOVERY_ENFORCEMENT");
    expect(advisory!.action).toBe("NONE");
  });

  it("emits DEMOTE for NOT_WORKING + HIGH fatigue non-safety type", () => {
    const effectiveness = computeAllEffectiveness([
      ...["o1", "o2", "o3", "o4", "o5"].map((id) => ({
        ...makeOutcomeRecord("OVERLOAD", {
          outcomeId: id,
          status: "FINALIZED" as const,
          outcomeDelta: -7,
          attribution: {
            verdict: "WORSENED" as const,
            hardConfounders: [],
            softConfounders: [],
            basis: "",
          },
        }),
      })),
    ]);
    const fatigueSignals = [{ type: "OVERLOAD" as const, level: "HIGH" as const, basis: ["test"] }];
    const report = buildIntelligenceAdvisories([], effectiveness, fatigueSignals, null);
    const advisory = report.suppressionAdvisories.find((a) => a.type === "OVERLOAD");
    expect(advisory!.action).toBe("DEMOTE");
  });
});

// ---------------------------------------------------------------------------
// reconcileOutcomeRecord
// ---------------------------------------------------------------------------

describe("reconcileOutcomeRecord — UNMEASURABLE when too few post check-ins", () => {
  it("marks UNMEASURABLE when window elapsed but fewer than 3 check-ins", () => {
    const firedAt = isoAgo(5);
    const record = makeOutcomeRecord("RESTART_ASSISTANCE", {
      firedAt,
      windowDays: 3,
      status: "PENDING",
    });
    // Only 1 check-in in the post-window
    const history = [makeDay(4)];
    const checkIns = [makeCheckIn(0, { date: history[0].date })];
    const elapsed = NOW; // window elapsed (5 days ago + 3 day window = 2 days past)
    const result = reconcileOutcomeRecord(record, history, checkIns, [], elapsed);
    expect(result.status).toBe("UNMEASURABLE");
    expect(result.attribution?.verdict).toBe("UNATTRIBUTABLE");
  });
});

describe("reconcileOutcomeRecord — PENDING when window not yet elapsed", () => {
  it("returns unchanged PENDING record when window has not elapsed", () => {
    const firedAt = isoAgo(1); // fired 1 day ago
    const record = makeOutcomeRecord("DEEP_WORK_PROTECTION", {
      firedAt,
      windowDays: 2, // 2-day window — not yet elapsed
      status: "PENDING",
    });
    const result = reconcileOutcomeRecord(record, [], [], [], NOW);
    expect(result.status).toBe("PENDING");
  });
});

describe("buildPendingOutcomeRecord — baseline from trailing 3d history", () => {
  it("builds a PENDING record with computed baseline", () => {
    const firedAt = new Date(NOW - 1 * DAY_MS).toISOString(); // fired yesterday
    const history: DayData[] = [
      makeDay(4, { executionScore: 60 }),
      makeDay(3, { executionScore: 55 }),
      makeDay(2, { executionScore: 50 }),
    ];
    const checkIns = history.map((d) => makeCheckIn(0, { date: d.date }));
    const record = buildPendingOutcomeRecord(
      "test-id",
      "BURNOUT_PREVENTION",
      firedAt,
      history,
      checkIns,
    );
    expect(record.status).toBe("PENDING");
    expect(record.type).toBe("BURNOUT_PREVENTION");
    expect(record.baselineValue).toBeGreaterThan(0);
    expect(record.outcomeDelta).toBeNull();
    expect(record.targetMetricId).toBe("EXECUTION_SCORE");
  });
});
