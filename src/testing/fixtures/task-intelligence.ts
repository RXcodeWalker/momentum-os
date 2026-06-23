import type { UserState } from "@/core/contracts/state/user-state";
import type { UserMode } from "@/core/contracts/state/modes";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { Task, TaskCategory } from "@/core/contracts/tasks/task";
import type { StateCompatibility } from "@/core/contracts/tasks/compatibility";
import { emptySnapshot, makeSnapshot } from "./state-evidence";

const BASE_TS = "2026-03-01T08:00:00.000Z";

// ---------------------------------------------------------------------------
// UserState builder — minimal opaque snapshot for task engine tests
// ---------------------------------------------------------------------------

export function makeUserState(mode: UserMode, overrides: Partial<UserState> = {}): UserState {
  return {
    recoveryDebt: 30,
    cognitiveStrain: 28,
    executionStability: 72,
    emotionalFriction: 25,
    momentumIntegrity: 68,
    resilienceCapacity: 70,
    overwhelmLevel: 22,
    fragmentationLevel: 20,
    recoveryCapacity: 70,
    meaningfulEngagement: 72,
    deepWorkContinuity: 75,
    behavioralVolatility: 18,
    currentMode: mode,
    currentTrajectory: "STABLE",
    overloadRisk: "LOW",
    burnoutRisk: "LOW",
    avoidanceRisk: "LOW",
    collapseRisk: "LOW",
    adaptationReadiness: 72,
    expansionReadiness: 68,
    consistencyTrend: "STABLE",
    recoveryTrend: "STABLE",
    engagementTrend: "STABLE",
    confidence: {
      score: 75,
      band: "HIGH",
      evidenceCoverage: 0.85,
      signalConsistency: 0.8,
      uncertaintyFactors: [],
    },
    lastUpdatedAt: BASE_TS,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// StateCompatibility presets
// ---------------------------------------------------------------------------

function defaultCompatibility(
  bands: Partial<Record<UserMode, StateCompatibility[UserMode]>>,
): StateCompatibility {
  return {
    RECOVERY: bands.RECOVERY ?? "COMPATIBLE",
    STABILIZING: bands.STABILIZING ?? "COMPATIBLE",
    FOCUSED: bands.FOCUSED ?? "COMPATIBLE",
    EXPANDING: bands.EXPANDING ?? "COMPATIBLE",
  };
}

const ADVANCEMENT_BANDS = defaultCompatibility({
  RECOVERY: "HARMFUL",
  STABILIZING: "FRAGILE",
  FOCUSED: "OPTIMAL",
  EXPANDING: "OPTIMAL",
});

const MAINTENANCE_BANDS = defaultCompatibility({
  RECOVERY: "OPTIMAL",
  STABILIZING: "OPTIMAL",
  FOCUSED: "COMPATIBLE",
  EXPANDING: "COMPATIBLE",
});

const RECOVERY_TASK_BANDS = defaultCompatibility({
  RECOVERY: "OPTIMAL",
  STABILIZING: "COMPATIBLE",
  FOCUSED: "COMPATIBLE",
  EXPANDING: "FRAGILE",
});

const SUPPORT_BANDS = defaultCompatibility({
  RECOVERY: "COMPATIBLE",
  STABILIZING: "COMPATIBLE",
  FOCUSED: "FRAGILE",
  EXPANDING: "COMPATIBLE",
});

const GROWTH_BANDS = defaultCompatibility({
  RECOVERY: "HARMFUL",
  STABILIZING: "FRAGILE",
  FOCUSED: "COMPATIBLE",
  EXPANDING: "OPTIMAL",
});

const BANDS_BY_CATEGORY: Record<TaskCategory, StateCompatibility> = {
  MAINTENANCE: MAINTENANCE_BANDS,
  RECOVERY: RECOVERY_TASK_BANDS,
  GROWTH: GROWTH_BANDS,
  ADVANCEMENT: ADVANCEMENT_BANDS,
  SUPPORT: SUPPORT_BANDS,
};

// ---------------------------------------------------------------------------
// Task factory
// ---------------------------------------------------------------------------

let taskCounter = 0;

export function makeTask(overrides: Partial<Task> & { title: string }): Task {
  taskCounter += 1;
  const category = overrides.category ?? "ADVANCEMENT";
  const id = overrides.id ?? `task-${taskCounter}`;

  const resolvedCategory = overrides.category ?? category;
  return {
    meaningfulness: 70,
    cognitiveLoad: 50,
    emotionalResistance: 35,
    ambiguity: 30,
    reversibilityRisk: 20,
    recoveryCost: 30,
    fragmentationRisk: 25,
    momentumContribution: 60,
    recoveryCompatibility: 55,
    deepWorkCompatibility: 65,
    timeHorizon: "MEDIUM",
    leverageWeight: 65,
    repeatedDeferralCount: 0,
    estimatedDuration: 60,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
    ...overrides,
    id,
    title: overrides.title,
    category: resolvedCategory,
    stateCompatibility: overrides.stateCompatibility ?? BANDS_BY_CATEGORY[resolvedCategory],
  };
}

export function makeSignalSnapshot(
  signals: Partial<Record<BehavioralSignal, { strength: number; days: number }>> = {},
): SignalSnapshot {
  return signals && Object.keys(signals).length > 0 ? makeSnapshot(0, signals) : emptySnapshot(0);
}

// ---------------------------------------------------------------------------
// Scenario builders
// ---------------------------------------------------------------------------

/** Maintenance tasks active; advancement deferred — maintenance gap pattern. */
export function buildScenario_MaintenanceLooping(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("FOCUSED", { avoidanceRisk: "MODERATE" }),
    tasks: [
      makeTask({
        title: "Inbox sweep",
        category: "MAINTENANCE",
        meaningfulness: 35,
        repeatedDeferralCount: 0,
      }),
      makeTask({
        title: "Expense reports",
        category: "MAINTENANCE",
        meaningfulness: 30,
        repeatedDeferralCount: 0,
      }),
      makeTask({
        title: "Weekly admin",
        category: "MAINTENANCE",
        meaningfulness: 40,
        repeatedDeferralCount: 1,
      }),
      makeTask({
        title: "Ship feature",
        category: "ADVANCEMENT",
        meaningfulness: 85,
        emotionalResistance: 55,
        repeatedDeferralCount: 3,
      }),
      makeTask({
        title: "Write proposal",
        category: "ADVANCEMENT",
        meaningfulness: 80,
        emotionalResistance: 50,
        repeatedDeferralCount: 2,
      }),
    ],
  };
}

/** High support activity; advancement deferred — preparation escape pattern. */
export function buildScenario_PreparationEscape(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("FOCUSED"),
    tasks: [
      makeTask({ title: "Research competitors", category: "SUPPORT", meaningfulness: 50 }),
      makeTask({ title: "Outline roadmap", category: "SUPPORT", meaningfulness: 55 }),
      makeTask({ title: "Draft project plan", category: "SUPPORT", meaningfulness: 45 }),
      makeTask({
        title: "Launch MVP",
        category: "ADVANCEMENT",
        meaningfulness: 90,
        repeatedDeferralCount: 3,
      }),
      makeTask({
        title: "Client deliverable",
        category: "ADVANCEMENT",
        meaningfulness: 88,
        repeatedDeferralCount: 2,
      }),
    ],
  };
}

/** Cluster of high-resistance meaningful deferred tasks. */
export function buildScenario_ResistanceClustering(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("FOCUSED", { avoidanceRisk: "HIGH" }),
    tasks: [
      makeTask({
        title: "Difficult conversation",
        category: "ADVANCEMENT",
        meaningfulness: 80,
        emotionalResistance: 75,
        repeatedDeferralCount: 3,
      }),
      makeTask({
        title: "Complex refactor",
        category: "ADVANCEMENT",
        meaningfulness: 78,
        emotionalResistance: 70,
        repeatedDeferralCount: 2,
      }),
      makeTask({
        title: "Quick email",
        category: "MAINTENANCE",
        meaningfulness: 25,
        emotionalResistance: 10,
      }),
    ],
  };
}

/** RECOVERY mode — recovery-compatible primary, harmful advancement suppressed. */
export function buildScenario_RecoverySequencing(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("RECOVERY", { recoveryCapacity: 40, recoveryDebt: 65 }),
    tasks: [
      makeTask({
        title: "Rest walk",
        category: "RECOVERY",
        recoveryCompatibility: 90,
        recoveryCost: 10,
        cognitiveLoad: 10,
      }),
      makeTask({
        title: "Light admin",
        category: "MAINTENANCE",
        recoveryCompatibility: 75,
        recoveryCost: 15,
        cognitiveLoad: 20,
      }),
      makeTask({
        title: "Major launch",
        category: "ADVANCEMENT",
        recoveryCost: 80,
        cognitiveLoad: 85,
        emotionalResistance: 60,
      }),
    ],
  };
}

/** FOCUSED mode — deep work candidate should surface as primary. */
export function buildScenario_FocusedDeepWork(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("FOCUSED", { deepWorkContinuity: 78 }),
    tasks: [
      makeTask({
        title: "Check slack",
        category: "MAINTENANCE",
        meaningfulness: 20,
        deepWorkCompatibility: 15,
        fragmentationRisk: 70,
      }),
      makeTask({
        title: "Sort inbox",
        category: "MAINTENANCE",
        meaningfulness: 25,
        deepWorkCompatibility: 10,
        fragmentationRisk: 65,
      }),
      makeTask({
        title: "Design system architecture",
        category: "ADVANCEMENT",
        meaningfulness: 90,
        deepWorkCompatibility: 92,
        cognitiveLoad: 70,
        leverageWeight: 88,
      }),
      makeTask({
        title: "Quick standup prep",
        category: "SUPPORT",
        meaningfulness: 30,
        deepWorkCompatibility: 20,
      }),
    ],
  };
}

/** EXPANDING mode — stretch growth/advancement over maintenance. */
export function buildScenario_ExpandingStretch(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("EXPANDING", { expansionReadiness: 82, recoveryCapacity: 75 }),
    tasks: [
      makeTask({
        title: "File expenses",
        category: "MAINTENANCE",
        meaningfulness: 25,
        cognitiveLoad: 15,
      }),
      makeTask({
        title: "Learn new framework",
        category: "GROWTH",
        meaningfulness: 75,
        cognitiveLoad: 65,
        leverageWeight: 80,
      }),
      makeTask({
        title: "Build v2 prototype",
        category: "ADVANCEMENT",
        meaningfulness: 88,
        cognitiveLoad: 72,
        leverageWeight: 90,
      }),
    ],
  };
}

/** RECOVERY mode with maintenance dominance — gap pattern should NOT fire. */
export function buildScenario_RecoveryMaintenanceExpected(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("RECOVERY", { recoveryCapacity: 45 }),
    tasks: [
      makeTask({ title: "Hydrate and stretch", category: "RECOVERY", recoveryCompatibility: 95 }),
      makeTask({
        title: "Tidy workspace",
        category: "MAINTENANCE",
        meaningfulness: 30,
        repeatedDeferralCount: 0,
      }),
      makeTask({
        title: "Light email",
        category: "MAINTENANCE",
        meaningfulness: 25,
        repeatedDeferralCount: 0,
      }),
      makeTask({
        title: "Deferred launch",
        category: "ADVANCEMENT",
        meaningfulness: 85,
        repeatedDeferralCount: 3,
      }),
    ],
  };
}

/** Long-horizon deferred advancement — planning context, not support gap. */
export function buildScenario_PlanningPhaseLongHorizon(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("FOCUSED"),
    tasks: [
      makeTask({ title: "Research phase", category: "SUPPORT", meaningfulness: 55 }),
      makeTask({ title: "Architecture notes", category: "SUPPORT", meaningfulness: 50 }),
      makeTask({ title: "Sprint planning", category: "SUPPORT", meaningfulness: 45 }),
      makeTask({
        title: "Thesis chapter",
        category: "ADVANCEMENT",
        meaningfulness: 90,
        timeHorizon: "LONG",
        repeatedDeferralCount: 2,
      }),
      makeTask({
        title: "Dissertation draft",
        category: "ADVANCEMENT",
        meaningfulness: 88,
        timeHorizon: "LONG",
        repeatedDeferralCount: 3,
      }),
    ],
  };
}

/** Fewer than 3 tasks — no portfolio patterns. */
export function buildScenario_LowTaskVolume(): { state: UserState; tasks: Task[] } {
  return {
    state: makeUserState("FOCUSED"),
    tasks: [
      makeTask({ title: "Only task A", category: "ADVANCEMENT" }),
      makeTask({ title: "Only task B", category: "MAINTENANCE" }),
    ],
  };
}
