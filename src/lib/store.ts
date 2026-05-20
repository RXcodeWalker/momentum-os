import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  hydrateFromDB,
  syncProfile,
  syncDayLog,
  syncCheckIn,
  syncTasks,
  syncInsightState,
  syncPersonalProof,
  syncCircleProof,
} from "@/lib/sync";
import { buildMigrationPayload } from "@/lib/migration";

export type Task = {
  id: string;
  label: string;
  estMin: number;
  done: boolean;
  type: "deep" | "shallow" | "admin" | "movement" | "wind-down";
  rescheduled?: number;
};

export type DayData = {
  date: string;
  executionScore: number;
  focus: number;
  sleepHours: number;
  distractions: number;
  planned: number;
  completed: number;
  recovery: boolean; // Did they do a recovery activity (walk, meditation, etc)
};

export type BehavioralInsight = {
  id: string;
  type: "pattern" | "warning" | "breakthrough" | "identity";
  title: string;
  body: string;
  unlocked: boolean;
  unlockedAt?: string;
  dismissed: boolean;
  committed?: boolean;
  committedAt?: string;
  preCommitAvgScore?: number;
  actionType?: "prune" | "recovery" | "none";
  actionLabel?: string;
};

export type ExecutionProof = {
  id: string;
  memberId: string;
  text: string;
  timestamp: string;
  type: "deep-work" | "recovery" | "movement" | "completion" | "milestone";
  acknowledgedBy?: string[]; // IDs of members who "celebrated" this
};

export type CheckIn = {
  date: string;
  honesty: number;
  focus: number;
  sleepHours: number;
  energy: number;
  mood: number;
  completed: number;
  planned: number;
  distractions: string[];
  blockers: Record<string, string>;
  tomorrowFocus?: string;
  reflection?: string;
};

export type OnboardingProfile = {
  goals: string[];
  struggles: string[];
  energyPeak: string[];
  sleep: string[];
  focus: string[];
  workload: string[];
  recovery: string[];
  baselineScore: number;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  consistency: number;
  state: "peak" | "steady" | "recovery" | "inconsistent";
  lastActive?: string;
  recentActivity: number[]; // 1 for active, 0 for inactive, last 7 days
};

export type Circle = {
  id: string;
  name: string;
  subtitle: string;
  charter: string;
  memberIds: string[];
};

export type BlockerRecord = {
  date: string;
  taskId: string;
  taskType: Task["type"];
  blockerType: string;
};

export type DistractionLogEntry = {
  date: string;
  types: string[];
};

export type StreakState = {
  current: number;
  longest: number;
  currentResilienceStreak: number;
  longestResilienceStreak: number;
  lastBreakDate?: string;
  quickRecoveries: number;
};

export type TomorrowPlan = {
  northStar: string;
  suggestedTasks: {
    label: string;
    type: Task["type"];
    estMin: number;
    source: "rescheduled" | "generated";
    originalTaskId?: string;
  }[];
  capacityForecast: {
    predictedScore: number;
    recommendedLoadMin: number;
    warningFlags: string[];
  };
  generatedAt: string;
};

type State = {
  user: string;
  currentUserId: string;
  onboarded: boolean;
  setup: {
    step: number;
    completed: boolean;
  };
  goals: string[];
  struggles: string[];
  profile: OnboardingProfile | null;
  tasks: Task[];
  checkIns: CheckIn[];
  history: DayData[];
  blockerHistory: BlockerRecord[];
  distractionLog: DistractionLogEntry[];
  streaks: StreakState;
  tomorrowPlan: TomorrowPlan | null;
  recoveryMode: boolean;
  recoveryHighScoreDays: number;
  recoveryReason?: string;
  recoveryPlan?: {
    protocol: string;
    tasks: { t: string; est: string; type: string }[];
    timeline: { day: string; focus: string; metric: string }[];
    startedAt: string;
  };
  premium: boolean;
  checkInStyle: "wizard" | "quick";
  insights: BehavioralInsight[];
  committedRules: {
    id: string;
    label: string;
    active: boolean;
    committedAt?: string;
    preCommitAvgScore?: number;
  }[];
  daysOnApp: number;
  proofs: ExecutionProof[];
  personalProofs: { id: string; text: string; trait: string; date: string }[];
  principles: string[];
  members: Member[];
  circle: Circle;

  // Guest/auth session metadata
  sessionType: "guest" | "authenticated";
  guestSince: string | null;
  pendingMigration: boolean;
  upgradePromptDismissed: boolean;
  upgradePromptDismissedAt: string | null;
  dataIsSeeded: boolean;

  // Actions
  acceptTomorrowPlan: () => void;
  completeOnboarding: () => void;
  updateSetup: (step: number) => void;
  finishSetup: (archetype: string, score: number) => void;
  setOnboardingProfile: (profile: OnboardingProfile) => void;
  setGoals: (goals: string[]) => void;
  setStruggles: (struggles: string[]) => void;
  addTask: (params: { label: string; estMin: number; type: Task["type"] }) => void;
  toggleTask: (id: string) => void;
  rescheduleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addCheckIn: (honesty: number) => void;
  saveCheckIn: (data: Omit<CheckIn, "date">) => { newScore: number; delta: number };
  unlockInsight: (id: string) => void;
  enterRecovery: (reason: string) => void;
  exitRecovery: () => void;
  setRecoveryPlan: (plan: State["recoveryPlan"]) => void;
  acceptMinimumViableDay: (mvdTasks: { t: string; est: string; type: string }[]) => void;
  pruneTasks: () => void;
  setPremium: (v: boolean) => void;
  setCheckInStyle: (style: "wizard" | "quick") => void;
  resetDemo: () => void;
  addProof: (proof: Omit<ExecutionProof, "id" | "timestamp">) => void;
  acknowledgeProof: (proofId: string, memberId: string) => void;
  dismissInsight: (id: string) => void;
  addPersonalProof: (text: string, trait: string) => void;
  commitToInsight: (id: string, rule: string) => void;
  addPrinciple: (p: string) => void;
  removePrinciple: (p: string) => void;
  refreshInsights: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  startGuestSession: () => void;
  dismissUpgradePrompt: () => void;
  migrateGuestToAccount: (userId: string, email: string, cloudData: Partial<State> | null) => Promise<void>;
  hydrateStore: (
    data: Partial<State> & { _insightOverrides?: Map<string, Record<string, unknown>> },
  ) => void;
};

const defaultTasks: Task[] = [
  {
    id: "1",
    label: "Deep focus: Core feature implementation",
    estMin: 90,
    done: false,
    type: "deep",
  },
  { id: "2", label: "Quick admin: Email and scheduling", estMin: 20, done: true, type: "admin" },
  { id: "3", label: "Recovery: 20 min afternoon walk", estMin: 20, done: false, type: "movement" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function seedHistory(): DayData[] {
  const out: DayData[] = [];
  const now = new Date();
  for (let i = 28; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    // Synthetic data generation with some patterns
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseScore = isWeekend ? 40 : 65;
    const variance = Math.random() * 30 - 15;
    const score = Math.max(20, Math.min(100, baseScore + variance));

    out.push({
      date: dateStr,
      executionScore: Math.round(score),
      focus: Math.round(score / 10 + Math.random() * 2),
      sleepHours: 6 + Math.random() * 2.5,
      distractions: Math.floor(Math.random() * 8),
      planned: 3 + Math.floor(Math.random() * 4),
      completed: 2 + Math.floor(Math.random() * 3),
      recovery: score < 50,
    });
  }
  return out;
}

function seedInsights(history: DayData[]): BehavioralInsight[] {
  // Calculate some real stats from the synthetic history to make insights feel real
  const last28 = history.slice(-28);
  const movementDays = last28.filter((d) => d.recovery);
  const nonMovementDays = last28.filter((d) => !d.recovery);

  const avgMovementScore = movementDays.length
    ? Math.round(movementDays.reduce((a, d) => a + d.executionScore, 0) / movementDays.length)
    : 75;
  const avgNonMovementScore = nonMovementDays.length
    ? Math.round(nonMovementDays.reduce((a, d) => a + d.executionScore, 0) / nonMovementDays.length)
    : 52;
  const movementLift = avgMovementScore - avgNonMovementScore;

  const avgDistractions =
    last28.reduce((a, d) => a + d.distractions, 0) / Math.max(1, last28.length);
  const eveningDrop = Math.round(avgDistractions * 8); // Synthesized drop

  return [
    {
      id: "i1",
      type: "pattern",
      title: `Focus quality drops significantly after 8 PM.`,
      body: `Evening distraction signals are ${eveningDrop}% higher than morning baselines. Protect the evening — it sets up tomorrow's execution window.`,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
      dismissed: false,
    },
    {
      id: "i2",
      type: "breakthrough",
      title: "Your best execution days follow movement.",
      body: `Days with recovery movement average ${movementLift} points higher execution score. This is your highest-leverage behavioral input.`,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
      dismissed: false,
    },
    {
      id: "i3",
      type: "warning",
      title: "Monday overplanning pattern detected.",
      body: "Mondays average 2x the task load of other days but only 1.2x the execution. The ambition is real; the capacity isn't. Cap Mondays at 3 priorities.",
      unlocked: true,
      unlockedAt: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
      dismissed: false,
      actionType: "prune",
      actionLabel: "Prune Monday Load",
    },
    {
      id: "i4",
      type: "identity",
      title: "Your recovery resilience is trending up.",
      body: "You've shortened your bounce-back time after a missed day by nearly 40% in 4 weeks. That's not willpower — that's a system working.",
      unlocked: true,
      unlockedAt: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      dismissed: false,
    },
    {
      id: "i5",
      type: "pattern",
      title: "Shorter task lists lead to faster recoveries.",
      body: "After a missed day, days with 3 or fewer priorities recover momentum significantly faster than higher-load days. Less surface area, more execution.",
      unlocked: false,
      dismissed: false,
      actionType: "prune",
      actionLabel: "Reduce Surface Area",
    },
    {
      id: "i6",
      type: "breakthrough",
      title: "Your morning window is neurologically optimal.",
      body: "The majority of your high-focus deep work lands between 8 AM and 11 AM. Guard it like a meeting you cannot cancel.",
      unlocked: false,
      dismissed: false,
    },
    {
      id: "i7",
      type: "warning",
      title: "Integrity gap detected.",
      body: "Your reported honesty is high, but execution score is lagging. You are aware of the problem, but the structural load is too high to overcome with willpower alone.",
      unlocked: false,
      dismissed: false,
      actionType: "recovery",
      actionLabel: "Start System Reset",
    },
  ];
}

function seedProofs(): ExecutionProof[] {
  const now = Date.now();
  return [
    {
      id: "p1",
      memberId: "u1",
      text: "Shipped signup screen · 2h",
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      type: "deep-work",
      acknowledgedBy: ["u2", "u5"],
    },
    {
      id: "p2",
      memberId: "u2",
      text: "3hr linear algebra deep work — locked in",
      timestamp: new Date(now - 5 * 3600000).toISOString(),
      type: "deep-work",
      acknowledgedBy: ["u1"],
    },
    {
      id: "p3",
      memberId: "u3",
      text: "20 min review, accepted minimum viable day",
      timestamp: new Date(now - 8 * 3600000).toISOString(),
      type: "recovery",
      acknowledgedBy: ["u1", "u2", "u4"],
    },
    {
      id: "p4",
      memberId: "u4",
      text: "Zone 2 run · 32 min, no headphones",
      timestamp: new Date(now - 11 * 3600000).toISOString(),
      type: "movement",
    },
    {
      id: "p5",
      memberId: "u5",
      text: "Closed 4 of 4 priorities",
      timestamp: new Date(now - 14 * 3600000).toISOString(),
      type: "completion",
      acknowledgedBy: ["u1", "u3"],
    },
  ];
}

const defaultPersonalProofs = [
  {
    id: "pp1",
    text: "Rejected distraction during deep work session",
    trait: "Focus",
    date: todayStr(),
  },
  {
    id: "pp2",
    text: "Accepted minimum viable day instead of quitting",
    trait: "Resilience",
    date: todayStr(),
  },
];

const defaultPrinciples = [
  "Execution is a discipline, not an emotion.",
  "Never miss twice. Fast recovery is the only metric that matters.",
  "Protect the morning focus window at all costs.",
];

function seedMembers(): Member[] {
  return [
    {
      id: "u2",
      name: "Maya R.",
      initials: "MR",
      consistency: 84,
      state: "peak",
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      recentActivity: [1, 1, 1, 1, 1, 1, 1],
    },
    {
      id: "u3",
      name: "Daniel K.",
      initials: "DK",
      consistency: 41,
      state: "recovery",
      lastActive: new Date(Date.now() - 14400000).toISOString(),
      recentActivity: [0, 0, 1, 0, 1, 0, 0],
    },
    {
      id: "u4",
      name: "Sami O.",
      initials: "SO",
      consistency: 67,
      state: "inconsistent",
      lastActive: new Date(Date.now() - 43200000).toISOString(),
      recentActivity: [1, 0, 1, 1, 0, 1, 0],
    },
    {
      id: "u5",
      name: "Lin T.",
      initials: "LT",
      consistency: 78,
      state: "steady",
      lastActive: new Date(Date.now() - 1800000).toISOString(),
      recentActivity: [1, 1, 0, 1, 1, 1, 1],
    },
  ];
}

const defaultCircle: Circle = {
  id: "c1",
  name: "Deep Work · Spring",
  subtitle: "Shared resilience over social performance. Small groups built on proof of execution.",
  charter:
    "We prioritize deep work, movement, and recovery. We support each other without judgment.",
  memberIds: ["u1", "u2", "u3", "u4", "u5"],
};

export const useApp = create<State>()(
  persist(
    (set, get) => {
      const history = seedHistory();
      return {
        user: "",
        currentUserId: "",
        onboarded: false,
        sessionType: "guest" as const,
        guestSince: null,
        pendingMigration: false,
        upgradePromptDismissed: false,
        upgradePromptDismissedAt: null,
        dataIsSeeded: true,
        setup: {
          step: 0,
          completed: false,
        },
        goals: [],
        struggles: [],
        profile: null,
        tasks: defaultTasks,
        checkIns: [],
        history,
        blockerHistory: [],
        distractionLog: [],
        streaks: {
          current: 0,
          longest: 0,
          currentResilienceStreak: 0,
          longestResilienceStreak: 0,
          quickRecoveries: 0,
        },
        tomorrowPlan: null,
        recoveryMode: false,
        recoveryHighScoreDays: 0,
        premium: false,
        checkInStyle: "wizard",
        insights: seedInsights(history),
        committedRules: [],
        daysOnApp: history.length,
        proofs: seedProofs(),
        personalProofs: defaultPersonalProofs,
        principles: defaultPrinciples,
        members: seedMembers(),
        circle: defaultCircle,

        completeOnboarding: () => set({ onboarded: true }),
        updateSetup: (step) => set((s) => ({ setup: { ...s.setup, step } })),
        finishSetup: (archetype, score) =>
          set((s) => ({
            setup: { ...s.setup, completed: true },
            profile: {
              goals: s.goals,
              struggles: s.struggles,
              energyPeak: [],
              sleep: [],
              focus: [],
              workload: [],
              recovery: [],
              baselineScore: score,
            },
          })),
        setOnboardingProfile: (profile) => {
          set({
            profile,
            onboarded: true,
            goals: profile.goals,
            struggles: profile.struggles,
            guestSince: get().guestSince ?? todayStr(),
          });
          const userId = get().currentUserId;
          if (userId) {
            syncProfile(userId, {
              goals: profile.goals,
              struggles: profile.struggles,
              profile_json: profile,
            });
          }
        },
        setGoals: (goals) => set({ goals }),
        setStruggles: (struggles) => set({ struggles }),
        addTask: ({ label, estMin, type }) => {
          const newTask = {
            id: Math.random().toString(36).slice(2, 9),
            label,
            estMin,
            done: false,
            type,
          };
          set((s) => ({ tasks: [...s.tasks, newTask] }));
          const { currentUserId, tasks } = get();
          if (currentUserId) syncTasks(currentUserId, [...tasks, newTask], todayStr());
        },
        toggleTask: (id) => {
          set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
          const { currentUserId, tasks } = get();
          if (currentUserId) syncTasks(currentUserId, tasks, todayStr());
        },
        rescheduleTask: (id) => {
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, rescheduled: (t.rescheduled || 0) + 1 } : t,
            ),
          }));
          const { currentUserId, tasks } = get();
          if (currentUserId) syncTasks(currentUserId, tasks, todayStr());
        },
        deleteTask: (id) => {
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
          const { currentUserId, tasks } = get();
          if (currentUserId) syncTasks(currentUserId, tasks, todayStr());
        },
        addCheckIn: (honesty) =>
          set((s) => ({
            checkIns: [
              ...s.checkIns,
              {
                date: todayStr(),
                honesty,
                focus: 5,
                sleepHours: 7,
                energy: 5,
                mood: 5,
                completed: 0,
                planned: 0,
                distractions: [],
                blockers: {},
              },
            ],
          })),
        saveCheckIn: (data) => {
          set({ dataIsSeeded: false });
          const s = get();
          const completed = s.tasks.filter((t) => t.done).length;
          const planned = s.tasks.length;
          const completionRatio = planned > 0 ? completed / planned : 1;

          const base = completionRatio * 50;
          const focusBonus = (data.focus / 10) * 20;
          const sleepBonus = (data.sleepHours / 8) * 20;
          const honestyBonus = (data.honesty / 10) * 10;

          const newScore = Math.round(base + focusBonus + sleepBonus + honestyBonus);
          const lastScore = s.history[s.history.length - 1]?.executionScore ?? 50;
          const delta = newScore - lastScore;

          const newEntry: DayData = {
            date: todayStr(),
            executionScore: newScore,
            focus: data.focus,
            sleepHours: data.sleepHours,
            distractions: data.distractions.length,
            planned,
            completed,
            recovery: s.recoveryMode || data.energy < 4,
          };

          const history = [...s.history];
          const todayIdx = history.findIndex((h) => h.date === todayStr());
          if (todayIdx !== -1) {
            history[todayIdx] = newEntry;
          } else {
            history.push(newEntry);
          }

          // Capture blocker history from incomplete tasks
          const newBlockers: BlockerRecord[] = [];
          Object.entries(data.blockers).forEach(([taskId, blockerType]) => {
            const task = s.tasks.find((t) => t.id === taskId);
            if (task && !task.done) {
              newBlockers.push({
                date: todayStr(),
                taskId,
                taskType: task.type,
                blockerType: blockerType as string,
              });
            }
          });

          // Preserve distraction types before collapsing to count
          const newDistractionEntry: DistractionLogEntry = {
            date: todayStr(),
            types: data.distractions,
          };
          const distractionLog = [
            ...s.distractionLog.filter((d) => d.date !== todayStr()),
            newDistractionEntry,
          ];

          // Compute streaks
          const allHistory = history;
          const streaks = { ...s.streaks };
          const scoreThreshold = 60;

          // Execution streak: consecutive days >= 60
          let execStreak = 0;
          for (let i = allHistory.length - 1; i >= 0; i--) {
            if (allHistory[i].executionScore >= scoreThreshold) execStreak++;
            else break;
          }
          if (execStreak > streaks.longest) streaks.longest = execStreak;
          const prevStreak = streaks.current;
          streaks.current = execStreak;

          // Resilience streak: no two consecutive days below 50
          let resStreak = 0;
          let prevBelowThreshold = false;
          for (let i = 0; i < allHistory.length; i++) {
            const below = allHistory[i].executionScore < 50;
            if (below && prevBelowThreshold) {
              resStreak = 0;
            } else {
              resStreak++;
            }
            prevBelowThreshold = below;
          }
          if (resStreak > streaks.longestResilienceStreak)
            streaks.longestResilienceStreak = resStreak;
          streaks.currentResilienceStreak = resStreak;

          // Quick recovery: was yesterday a break day and today recovered?
          if (prevStreak === 0 && execStreak >= 1 && allHistory.length >= 2) {
            const twoDaysAgo = allHistory[allHistory.length - 2];
            if (twoDaysAgo && twoDaysAgo.executionScore < scoreThreshold) {
              streaks.quickRecoveries = (streaks.quickRecoveries || 0) + 1;
            }
          }
          if (execStreak === 0) {
            streaks.lastBreakDate = todayStr();
          }

          // Generate tomorrow's plan
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowDow = tomorrow.getDay();
          const dowHistory = allHistory.filter((d) => new Date(d.date).getDay() === tomorrowDow);
          const tomorrowAvgScore = dowHistory.length
            ? Math.round(dowHistory.reduce((a, d) => a + d.executionScore, 0) / dowHistory.length)
            : 60;
          const tomorrowIsLowDay = tomorrowAvgScore < 55;
          const capacityCap = tomorrowIsLowDay ? 2 : 3;

          const rescheduledTasks = s.tasks
            .filter((t) => !t.done && (t.rescheduled ?? 0) >= 0)
            .sort((a, b) => (b.rescheduled ?? 0) - (a.rescheduled ?? 0))
            .slice(0, capacityCap);

          const hasMovementTask = rescheduledTasks.some((t) => t.type === "movement");
          const movementBoost =
            allHistory.filter((d) => d.recovery).length > allHistory.length * 0.3;

          const suggestedTasks: TomorrowPlan["suggestedTasks"] = rescheduledTasks.map((t) => ({
            label: t.label,
            type: t.type,
            estMin: t.estMin,
            source: "rescheduled" as const,
            originalTaskId: t.id,
          }));

          if (!hasMovementTask && movementBoost && suggestedTasks.length < capacityCap) {
            suggestedTasks.push({
              label: "Recovery: 20 min walk",
              type: "movement",
              estMin: 20,
              source: "generated",
            });
          }

          const avgDowLoad = dowHistory.length
            ? Math.round(dowHistory.reduce((a, d) => a + d.planned, 0) / dowHistory.length)
            : 3;
          const recommendedLoadMin = Math.min(capacityCap, avgDowLoad) * 45;

          const tomorrowPlan: TomorrowPlan = {
            northStar: data.tomorrowFocus || "",
            suggestedTasks,
            capacityForecast: {
              predictedScore: tomorrowAvgScore,
              recommendedLoadMin,
              warningFlags: tomorrowIsLowDay
                ? ["Historically a lower-performance day — keep the load light"]
                : [],
            },
            generatedAt: new Date().toISOString(),
          };

          // Recovery exit hysteresis: require 2 consecutive days >= 65, not a single spike > 70
          const wasRecovery = s.recoveryMode;
          let recoveryHighScoreDays = s.recoveryHighScoreDays ?? 0;
          let nextRecoveryMode = wasRecovery;
          if (wasRecovery) {
            if (newScore >= 65) {
              recoveryHighScoreDays += 1;
              if (recoveryHighScoreDays >= 2) {
                nextRecoveryMode = false;
                recoveryHighScoreDays = 0;
              }
            } else {
              recoveryHighScoreDays = 0;
            }
          } else if (newScore < 45) {
            nextRecoveryMode = true;
            recoveryHighScoreDays = 0;
          }

          set((state) => ({
            history,
            checkIns: [...state.checkIns, { ...data, date: todayStr() }],
            recoveryMode: nextRecoveryMode,
            recoveryHighScoreDays,
            blockerHistory: [...state.blockerHistory, ...newBlockers],
            distractionLog,
            streaks,
            tomorrowPlan,
          }));

          const userId = get().currentUserId;
          if (userId) {
            syncDayLog(userId, newEntry);
            syncCheckIn(userId, { ...data, date: todayStr() });
          }

          return { newScore, delta };
        },
        unlockInsight: (id) => {
          set((s) => ({
            insights: s.insights.map((i) =>
              i.id === id ? { ...i, unlocked: true, unlockedAt: todayStr() } : i,
            ),
          }));
          const userId = get().currentUserId;
          if (userId) syncInsightState(userId, id, { unlocked: true, unlocked_at: todayStr() });
        },
        enterRecovery: (reason) => set({ recoveryMode: true, recoveryReason: reason }),
        exitRecovery: () =>
          set({ recoveryMode: false, recoveryReason: undefined, recoveryPlan: undefined }),
        setRecoveryPlan: (plan) => set({ recoveryPlan: plan }),
        acceptMinimumViableDay: (mvdTasks) =>
          set({
            tasks: mvdTasks.map((t, i) => ({
              id: `mvd-${Date.now()}-${i}`,
              label: t.t,
              estMin: parseInt(t.est) || 0,
              done: false,
              type: t.type as Task["type"],
            })),
          }),

        pruneTasks: () =>
          set((s) => {
            const incomplete = s.tasks.filter((t) => !t.done);
            if (incomplete.length <= 3) return s;
            const keptIncomplete = incomplete.slice(0, 3);
            const done = s.tasks.filter((t) => t.done);
            return { tasks: [...done, ...keptIncomplete] };
          }),

        acceptTomorrowPlan: () => {
          const plan = get().tomorrowPlan;
          if (!plan) return;
          const newTasks: Task[] = plan.suggestedTasks.map((t, i) => ({
            id: `tp-${Date.now()}-${i}`,
            label: t.label,
            estMin: t.estMin,
            done: false,
            type: t.type,
          }));
          set({ tasks: newTasks, tomorrowPlan: null });
        },
        setPremium: (v) => set({ premium: v }),
        setCheckInStyle: (style) => set({ checkInStyle: style }),
        dismissInsight: (id) => {
          set((s) => ({
            insights: s.insights.map((i) => (i.id === id ? { ...i, dismissed: true } : i)),
          }));
          const userId = get().currentUserId;
          if (userId) syncInsightState(userId, id, { dismissed: true });
        },
        addProof: (proof) => {
          const newProof = {
            ...proof,
            id: Math.random().toString(36).slice(2, 9),
            timestamp: new Date().toISOString(),
          };
          set((s) => ({ proofs: [newProof, ...s.proofs] }));
          const userId = get().currentUserId;
          if (userId && proof.memberId === userId) {
            syncCircleProof(userId, { id: newProof.id, text: newProof.text, type: newProof.type });
          }
        },
        acknowledgeProof: (proofId, memberId) =>
          set((s) => ({
            proofs: s.proofs.map((p) =>
              p.id === proofId
                ? { ...p, acknowledgedBy: [...(p.acknowledgedBy || []), memberId] }
                : p,
            ),
          })),
        addPersonalProof: (text, trait) => {
          const proof = {
            id: Math.random().toString(36).slice(2, 9),
            text,
            trait,
            date: todayStr(),
          };
          set((s) => ({ personalProofs: [proof, ...s.personalProofs] }));
          const userId = get().currentUserId;
          if (userId) syncPersonalProof(userId, proof);
        },
        commitToInsight: (id, rule) => {
          const s = get();
          const last7 = s.history.slice(-7);
          const preCommitAvgScore = last7.length
            ? Math.round(last7.reduce((a, d) => a + d.executionScore, 0) / last7.length)
            : 50;
          const committedAt = todayStr();
          set((state) => ({
            insights: state.insights.map((i) =>
              i.id === id ? { ...i, committed: true, committedAt, preCommitAvgScore } : i,
            ),
            committedRules: [
              ...state.committedRules,
              {
                id: Math.random().toString(36).slice(2, 9),
                label: rule,
                active: true,
                committedAt,
                preCommitAvgScore,
              },
            ],
          }));
          const userId = get().currentUserId;
          if (userId) {
            syncInsightState(userId, id, { committed: true });
            syncProfile(userId, { committed_rules: get().committedRules });
          }
        },
        addPrinciple: (p) => {
          set((s) => ({ principles: [...s.principles, p] }));
          const userId = get().currentUserId;
          if (userId) syncProfile(userId, { principles: get().principles });
        },
        removePrinciple: (p) => {
          set((s) => ({ principles: s.principles.filter((x) => x !== p) }));
          const userId = get().currentUserId;
          if (userId) syncProfile(userId, { principles: get().principles });
        },
        refreshInsights: () => {
          const s = get();
          const h = s.history;
          const currentInsights = s.insights;
          const newInsights = [...currentInsights];
          let changed = false;

          // Calculate Maturity Archetype (simplified from useMaturityLevel)
          const daysOnApp = s.daysOnApp;
          const consistency = h.slice(-28).filter((d) => d.executionScore >= 60).length;
          const consistencyPct = h.length ? consistency / Math.min(28, h.length) : 0;
          const archetype = consistencyPct > 0.8 ? "The Architect" : "The Explorer";

          // Rule: Monday Overplanning
          const mondays = h.filter((d) => new Date(d.date).getDay() === 1);
          const avgMonPlanned =
            mondays.reduce((a, d) => a + d.planned, 0) / Math.max(1, mondays.length);
          if (avgMonPlanned > 5 && !currentInsights.some((i) => i.id === "i3" && i.unlocked)) {
            const idx = newInsights.findIndex((i) => i.id === "i3");
            if (idx !== -1) {
              const baseBody =
                archetype === "The Architect"
                  ? "Your system capacity is exceeded on Mondays. Recalibrate your structural load to match your objective execution velocity."
                  : "You're over-planning on Mondays. Try anchoring your day to just 3 core priorities instead of 5+.";
              newInsights[idx] = {
                ...newInsights[idx],
                body: baseBody,
                unlocked: true,
                unlockedAt: todayStr(),
              };
              changed = true;
            }
          }

          // Rule: Sleep Impact
          const lowSleep = h.filter((d) => d.sleepHours < 6.5);
          if (lowSleep.length > 3 && !currentInsights.some((i) => i.id === "i5" && i.unlocked)) {
            const idx = newInsights.findIndex((i) => i.id === "i5");
            if (idx !== -1) {
              newInsights[idx] = { ...newInsights[idx], unlocked: true, unlockedAt: todayStr() };
              changed = true;
            }
          }

          // Rule: Integrity Gap
          const recentH = h.slice(-7);
          const recentCheckIns = s.checkIns.slice(-7);
          const avgHonesty =
            recentCheckIns.reduce((a, c) => a + c.honesty, 0) / Math.max(1, recentCheckIns.length);
          const avgExecution =
            recentH.reduce((a, d) => a + d.executionScore, 0) / Math.max(1, recentH.length);

          if (
            avgHonesty > 8 &&
            avgExecution < 50 &&
            !currentInsights.some((i) => i.id === "i7" && i.unlocked)
          ) {
            const idx = newInsights.findIndex((i) => i.id === "i7");
            if (idx !== -1) {
              newInsights[idx] = { ...newInsights[idx], unlocked: true, unlockedAt: todayStr() };
              changed = true;
            }
          }

          if (changed) set({ insights: newInsights });
        },
        signIn: async (email, password) => {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const userId = data.user.id;
          const cloudData = await hydrateFromDB(userId);
          await get().migrateGuestToAccount(userId, data.user.email ?? email, cloudData);
        },
        signUp: async (email, password) => {
          const redirectTo = `${window.location.origin}/`;
          const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
          if (error) throw error;
          const userId = data.user?.id ?? "";
          if (userId) await get().migrateGuestToAccount(userId, email, null);
        },
        signInWithGoogle: async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/` },
          });
          if (error) throw error;
        },
        signOut: async () => {
          await supabase.auth.signOut();
          set({
            currentUserId: "",
            user: "",
            sessionType: "guest",
            guestSince: todayStr(),
          });
        },
        startGuestSession: () => {
          set({
            sessionType: "guest",
            currentUserId: "",
            user: "",
            guestSince: get().guestSince ?? todayStr(),
          });
        },
        dismissUpgradePrompt: () => {
          set({
            upgradePromptDismissed: true,
            upgradePromptDismissedAt: todayStr(),
          });
        },
        migrateGuestToAccount: async (userId, email, cloudData) => {
          set({ pendingMigration: true });

          // Safety check: verify the session still belongs to this userId
          const { data: { user: sessionUser } } = await supabase.auth.getUser();
          if (sessionUser && sessionUser.id !== userId) {
            set({ pendingMigration: false });
            return;
          }

          const local = get();

          if (cloudData !== null) {
            // Existing account — merge local guest data with cloud data
            const merged = buildMigrationPayload(local, cloudData);
            set(merged as Partial<State>);
          } else {
            // New account — push local data to cloud if it's real (not seeded)
            if (!local.dataIsSeeded) {
              try {
                await Promise.all([
                  syncProfile(userId, {
                    display_name: email,
                    goals: local.goals,
                    struggles: local.struggles,
                    profile_json: local.profile ?? undefined,
                  }),
                  ...local.history.map((entry) => syncDayLog(userId, entry)),
                  ...local.checkIns.map((ci) => syncCheckIn(userId, ci)),
                  syncTasks(userId, local.tasks, todayStr()),
                  ...local.insights
                    .filter((i) => i.unlocked || i.committed || i.dismissed)
                    .map((i) =>
                      syncInsightState(userId, i.id, {
                        unlocked: i.unlocked,
                        unlocked_at: i.unlockedAt,
                        dismissed: i.dismissed,
                        committed: i.committed,
                      }),
                    ),
                  ...local.personalProofs.map((p) => syncPersonalProof(userId, p)),
                ]);
              } catch {
                // Sync failures are non-fatal — local state is authoritative
              }
            } else {
              // Data is seeded demo data; just create the profile record
              syncProfile(userId, { display_name: email });
            }
          }

          set({
            currentUserId: userId,
            user: email,
            sessionType: "authenticated",
            pendingMigration: false,
            guestSince: null,
            dataIsSeeded: false,
          });
        },
        hydrateStore: (data) => {
          const { _insightOverrides, ...rest } = data as typeof data & {
            _insightOverrides?: Map<string, Record<string, unknown>>;
          };
          if (_insightOverrides && _insightOverrides.size > 0) {
            // Merge DB insight state into the static insight definitions
            const currentInsights = get().insights;
            const merged = currentInsights.map((ins) => {
              const override = _insightOverrides.get(ins.id);
              if (!override) return ins;
              return {
                ...ins,
                unlocked: (override.unlocked as boolean) ?? ins.unlocked,
                unlockedAt: (override.unlocked_at as string) ?? ins.unlockedAt,
                dismissed: (override.dismissed as boolean) ?? ins.dismissed,
                committed: (override.committed as boolean) ?? ins.committed,
              };
            });
            set({ ...rest, insights: merged } as Partial<State>);
          } else {
            set(rest as Partial<State>);
          }
        },
        resetDemo: () => {
          if (import.meta.env.PROD) return;
          const h = seedHistory();
          set({
            tasks: defaultTasks,
            checkIns: [],
            history: h,
            blockerHistory: [],
            distractionLog: [],
            streaks: {
              current: 0,
              longest: 0,
              currentResilienceStreak: 0,
              longestResilienceStreak: 0,
              quickRecoveries: 0,
            },
            tomorrowPlan: null,
            recoveryMode: false,
            recoveryReason: undefined,
            insights: seedInsights(h),
            proofs: seedProofs(),
            daysOnApp: 84,
            checkInStyle: "wizard",
            principles: defaultPrinciples,
            members: seedMembers(),
            circle: defaultCircle,
          });
        },
      };
    },
    {
      name: "cadence-store-v1",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const s = persistedState as Partial<State>;
          return {
            ...s,
            sessionType: s.currentUserId ? ("authenticated" as const) : ("guest" as const),
            guestSince: s.currentUserId ? null : todayStr(),
            pendingMigration: false,
            upgradePromptDismissed: false,
            upgradePromptDismissedAt: null,
            dataIsSeeded: false, // existing users have real data
          };
        }
        return persistedState as State;
      },
    },
  ),
);

// Derived selectors
export function useExecutionScore(): number {
  const h = useApp((s) => s.history);
  return h[h.length - 1]?.executionScore ?? 0;
}

export function useMomentum(): { delta: number; trend: "up" | "down" | "flat" } {
  const h = useApp((s) => s.history);
  return useMemo(() => {
    const last7 = h.slice(-7).map((d) => d.executionScore);
    const prev7 = h.slice(-14, -7).map((d) => d.executionScore);
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const delta = Math.round(avg(last7) - avg(prev7));
    return { delta, trend: delta > 2 ? "up" : delta < -2 ? "down" : "flat" };
  }, [h]);
}

export function useMomentumScore(): number {
  const h = useApp((s) => s.history);
  const score = useExecutionScore();
  return useMemo(() => {
    const last7 = h.slice(-7).map((d) => d.executionScore);
    const avg = last7.length ? last7.reduce((x, y) => x + y, 0) / last7.length : 0;
    // Momentum is a blend of current score and recent average, weighted towards current
    return Math.round(score * 0.6 + avg * 0.4);
  }, [h, score]);
}

export function useDeepWorkStats() {
  const h = useApp((s) => s.history);
  return useMemo(() => {
    const last28 = h.slice(-28);
    const avgFocus = last28.reduce((a, d) => a + d.focus, 0) / Math.max(1, last28.length);
    // Deep work hours estimated from focus score (10 focus -> ~4h deep work)
    const avgHours = (avgFocus / 10) * 4;

    // Calculate execution drop after low sleep
    const lowSleepDays = h.filter((d) => d.sleepHours < 6.5);
    const normalSleepDays = h.filter((d) => d.sleepHours >= 7);

    const avgLowSleepScore = lowSleepDays.length
      ? lowSleepDays.reduce((a, d) => a + d.executionScore, 0) / lowSleepDays.length
      : 0;
    const avgNormalSleepScore = normalSleepDays.length
      ? normalSleepDays.reduce((a, d) => a + d.executionScore, 0) / normalSleepDays.length
      : 0;

    const sleepImpact =
      avgNormalSleepScore > 0
        ? Math.round(((avgNormalSleepScore - avgLowSleepScore) / avgNormalSleepScore) * 100)
        : 35; // Fallback to 35% if no data

    return {
      avgHours: Math.round(avgHours * 10) / 10,
      sleepImpact: Math.max(5, sleepImpact),
    };
  }, [h]);
}

export function useDistractionStats() {
  const h = useApp((s) => s.history);
  return useMemo(() => {
    const last14 = h.slice(-14);
    const avgDistractions =
      last14.reduce((a, d) => a + d.distractions, 0) / Math.max(1, last14.length);
    const avgSleep = last14.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last14.length);

    // Peak window shifts based on sleep schedule
    const peakHour = avgSleep > 7.5 ? 20 : 21;
    const peakWindow = `${peakHour}:00 – ${peakHour + 2}:00`;

    // Reduction is estimated based on distraction level
    const reduction = Math.min(60, Math.max(20, Math.round(avgDistractions * 5)));

    return {
      avg: Math.round(avgDistractions * 10) / 10,
      peakWindow,
      reduction,
    };
  }, [h]);
}

export function useRootCauseAnalysis() {
  const h = useApp((s) => s.history);
  const tasks = useApp((s) => s.tasks);

  return useMemo(() => {
    const last7 = h.slice(-7);
    const avgSleep = last7.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last7.length);
    const avgPlanned = last7.reduce((a, d) => a + d.planned, 0) / Math.max(1, last7.length);
    const avgDist = last7.reduce((a, d) => a + d.distractions, 0) / Math.max(1, last7.length);
    const recoveryDays = last7.filter((d) => d.recovery).length;

    const currentPlanned = tasks.length;
    const currentDeepTasks = tasks.filter((t) => t.type === "deep").length;

    // Calculate available deep work hours (8h sleep + 6h admin/life = 10h potential, max 4h deep)
    const availableHours = Math.max(1.5, Math.min(4, 16 - avgSleep - 6));

    return {
      workload: {
        observation: `Your task list requires ~${currentDeepTasks * 1.5}h of deep work. You have ~${availableHours.toFixed(1)}h available.`,
        detected: currentDeepTasks * 1.5 > availableHours,
      },
      sleep: {
        observation: `Avg ${Math.floor(avgSleep)}h${Math.round((avgSleep % 1) * 60)}m last 7 nights. Decision quality drops sharply below 6.5h.`,
        detected: avgSleep < 6.5,
      },
      distraction: {
        observation: `Phone pickups average ${avgDist.toFixed(1)}/day. Context switching fragments focus.`,
        detected: avgDist > 5,
      },
      overplanning: {
        observation: `You plan ${avgPlanned.toFixed(1)} priorities/day. Your sustainable cap is 3.`,
        detected: avgPlanned > 4,
      },
      recovery: {
        observation:
          recoveryDays === 0
            ? "No recovery activities logged this week. Best execution follows movement."
            : "Recovery protocol active but consistency is low.",
        detected: recoveryDays < 2,
      },
    };
  }, [h, tasks]);
}

// Returns unlocked, non-dismissed insights sorted by recency
export function useActiveInsights(): BehavioralInsight[] {
  const insights = useApp((s) => s.insights);
  return useMemo(() => insights.filter((i) => i.unlocked && !i.dismissed), [insights]);
}

export function useConsistency(days: number = 28): number {
  const h = useApp((s) => s.history);
  return useMemo(() => {
    const recent = h.slice(-days);
    if (recent.length === 0) return 0;
    const highDays = recent.filter((d) => d.executionScore >= 70).length;
    return Math.round((highDays / recent.length) * 100);
  }, [h, days]);
}

export function useResilience(): { score: number; avgRecoveryDays: number } {
  const h = useApp((s) => s.history);
  return useMemo(() => {
    const scores = h.map((d) => d.executionScore);
    let dips = 0;
    let recoveries = 0;
    let recoveryTotalDays = 0;
    let inDip = false;
    let dipStartIdx = 0;

    for (let i = 0; i < scores.length; i++) {
      if (scores[i] < 50 && !inDip) {
        inDip = true;
        dipStartIdx = i;
        dips++;
      } else if (scores[i] >= 70 && inDip) {
        inDip = false;
        recoveries++;
        recoveryTotalDays += i - dipStartIdx;
      }
    }

    const avgRecoveryDays =
      recoveries > 0 ? Math.round((recoveryTotalDays / recoveries) * 10) / 10 : 2.5;
    // Resilience score is high if recovery is fast and dips are few
    const score = Math.max(0, Math.min(100, 100 - avgRecoveryDays * 10 + recoveries * 5));

    return { score: Math.round(score), avgRecoveryDays };
  }, [h]);
}

export function useUserState() {
  const score = useExecutionScore();
  const recovery = useApp((s) => s.recoveryMode);

  return useMemo(() => {
    if (recovery) return { state: "recovery", label: "Recovery Mode", tone: "warning" as const };
    if (score >= 85) return { state: "peak", label: "Peak Performance", tone: "success" as const };
    if (score >= 60) return { state: "steady", label: "Steady Execution", tone: "accent" as const };
    if (score >= 45)
      return { state: "building", label: "Building Momentum", tone: "neutral" as const };
    return { state: "burnout", label: "Burnout Risk", tone: "danger" as const };
  }, [score, recovery]);
}

export function usePredictiveRecoveryAlert(): {
  detected: boolean;
  title?: string;
  body?: string;
  confidence: number;
  actionType?: "prune" | "recovery" | "none";
  actionLabel?: string;
} {
  const h = useApp((s) => s.history);
  const premium = useApp((s) => s.premium);

  return useMemo(() => {
    if (!premium || h.length < 5) return { detected: false, confidence: 0 };

    const recent = h.slice(-5);
    const scores = recent.map((d) => d.executionScore);

    // Trend analysis: consecutive drops or sustained low performance under high load
    const isDeclining = scores[4] < scores[3] && scores[3] < scores[2];
    const avgSleep = recent.reduce((a, d) => a + d.sleepHours, 0) / 5;
    const avgPlanned = recent.reduce((a, d) => a + d.planned, 0) / 5;
    const avgFocus = recent.reduce((a, d) => a + d.focus, 0) / 5;

    if (isDeclining && avgSleep < 6.8) {
      return {
        detected: true,
        title: "Burnout horizon detected",
        body: "Your execution velocity is decoupling from your recovery baseline. A motivation crash is likely within 36 hours unless load is reduced.",
        confidence: 92,
        actionType: "recovery",
        actionLabel: "Activate Recovery Protocol",
      };
    }

    if (avgPlanned > 5 && avgFocus < 6) {
      return {
        detected: true,
        title: "Cognitive overload warning",
        body: "You are attempting high-complexity planning with low-focus capacity. Expect execution failure by end-of-day.",
        confidence: 84,
        actionType: "prune",
        actionLabel: "Prune Low-Priority Tasks",
      };
    }

    return { detected: false, confidence: 0 };
  }, [h, premium]);
}

export function useFocusAnalysis() {
  const h = useApp((s) => s.history);
  const tasks = useApp((s) => s.tasks);
  const premium = useApp((s) => s.premium);

  return useMemo(() => {
    if (!premium) return null;

    const last14 = h.slice(-14);
    const deepTasks = tasks.filter((t) => t.type === "deep").length;
    const avgSleep = last14.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last14.length);

    // Simulate optimal focus window based on sleep and history
    const startHour = avgSleep > 7.5 ? 8 : 10;
    const duration = Math.max(2, Math.min(4, avgSleep - 4));

    return {
      optimalWindow: `${startHour}:00 – ${startHour + Math.round(duration)}:00`,
      distractionRisk: avgSleep < 7 ? "High (after 14:00)" : "Low",
      capacity: deepTasks > 3 ? "Oversaturated" : "Optimal",
      score: Math.round((avgSleep / 8) * 100),
    };
  }, [h, tasks, premium]);
}

export function useFakeProductivityFlags() {
  const tasks = useApp((s) => s.tasks);
  const h = useApp((s) => s.history);

  return useMemo(() => {
    const last7 = h.slice(-7);
    const avgPlanned = last7.reduce((a, d) => a + d.planned, 0) / Math.max(1, last7.length);
    const avgCompleted = last7.reduce((a, d) => a + d.completed, 0) / Math.max(1, last7.length);
    const avgSleep = last7.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last7.length);
    const avgFocus = last7.reduce((a, d) => a + d.focus, 0) / Math.max(1, last7.length);
    const avgPhone = last7.reduce((a, d) => a + d.distractions, 0) / Math.max(1, last7.length);

    const planExecuteRatio = avgPlanned > 0 ? Math.round((avgCompleted / avgPlanned) * 100) : 100;

    // Better derived metrics
    const deepWorkRatio = Math.round((avgFocus / 10) * 100);
    const phonePickups = Math.round(avgPhone * 15);

    const flags = [];
    if (tasks.length > 5) flags.push("Task list exceeds sustainable cognitive load (>5 items)");
    if (planExecuteRatio < 60)
      flags.push("Overplanning detected: consistently executing <60% of daily plan");
    if (avgSleep < 6.5) flags.push("Sleep debt is degrading your morning focus windows.");
    if (deepWorkRatio < 40) flags.push("Shallow work is crowding out your deep work capacity.");

    // Calculate sleep regularity based on variance in sleep hours
    const sleepVariance =
      last7.length > 1
        ? last7.reduce((acc, d) => acc + Math.pow(d.sleepHours - avgSleep, 2), 0) / last7.length
        : 0;
    const sleepRegScore = Math.round(Math.max(20, 100 - sleepVariance * 15));

    return {
      flags,
      overplanning: tasks.length > 5 || planExecuteRatio < 60,
      planExecuteRatio,
      sleepRegularity: sleepRegScore,
      deepWorkRatio,
      phonePickups,
    };
  }, [tasks, h]);
}

export function useMaturityLevel() {
  const daysOnApp = useApp((s) => s.daysOnApp);
  const consistency = useConsistency(28);

  return useMemo(() => {
    const levels = ["calibrating", "building", "consistent", "advanced", "resilient"] as const;
    const labels = ["Calibrating", "Building", "Consistent", "Advanced", "Resilient"];
    const archetypes = [
      "The Explorer",
      "The Builder",
      "The Strategist",
      "The Architect",
      "The Guardian",
    ];

    const levelIdx = Math.min(4, Math.floor(daysOnApp / 30) + (consistency > 80 ? 1 : 0));

    return {
      level: levels[levelIdx],
      label: labels[levelIdx],
      archetype: archetypes[levelIdx],
      daysToNext: Math.max(0, 30 - (daysOnApp % 30)),
    };
  }, [daysOnApp, consistency]);
}

export function useLatestInsight() {
  const insights = useActiveInsights();
  return insights[0] || null;
}

// E2: Distraction type attribution and score correlation
export function useDistractionProfile() {
  const distractionLog = useApp((s) => s.distractionLog);
  const history = useApp((s) => s.history);

  return useMemo(() => {
    const DISTRACTION_IDS = [
      "phone",
      "social",
      "video",
      "noise",
      "snacks",
      "thoughts",
      "fatigue",
      "meetings",
    ];

    const topDistractors = DISTRACTION_IDS.map((id) => {
      const daysWith = distractionLog.filter((d) => d.types.includes(id)).map((d) => d.date);
      const daysWithout = distractionLog.filter((d) => !d.types.includes(id)).map((d) => d.date);

      const avgScoreWith =
        daysWith.length > 0
          ? daysWith.reduce((sum, date) => {
              const h = history.find((d) => d.date === date);
              return sum + (h?.executionScore ?? 0);
            }, 0) / daysWith.length
          : null;

      const avgScoreWithout =
        daysWithout.length > 0
          ? daysWithout.reduce((sum, date) => {
              const h = history.find((d) => d.date === date);
              return sum + (h?.executionScore ?? 0);
            }, 0) / daysWithout.length
          : null;

      const avgScoreImpact =
        avgScoreWith !== null && avgScoreWithout !== null
          ? Math.round(avgScoreWith - avgScoreWithout)
          : 0;

      return { id, frequency: daysWith.length, avgScoreImpact };
    })
      .filter((d) => d.frequency > 0)
      .sort((a, b) => a.avgScoreImpact - b.avgScoreImpact);

    // Weekday pattern: most common distractor per day of week
    const weekdayPattern: Record<number, string[]> = {};
    for (let dow = 0; dow <= 6; dow++) {
      const entries = distractionLog.filter((d) => new Date(d.date).getDay() === dow);
      if (entries.length === 0) continue;
      const freq: Record<string, number> = {};
      entries.forEach((e) =>
        e.types.forEach((t) => {
          freq[t] = (freq[t] || 0) + 1;
        }),
      );
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      weekdayPattern[dow] = sorted.slice(0, 2).map(([id]) => id);
    }

    const worstDistractor = topDistractors[0] ?? null;
    const scoreImpactText =
      worstDistractor && worstDistractor.avgScoreImpact < -3
        ? `${worstDistractor.id} costs you ~${Math.abs(worstDistractor.avgScoreImpact)} pts on days it appears`
        : null;

    return { topDistractors, weekdayPattern, worstDistractor, scoreImpactText };
  }, [distractionLog, history]);
}

// E3: Day-of-week performance profile
export function useDayOfWeekProfile() {
  const history = useApp((s) => s.history);

  return useMemo(() => {
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    type DowStats = {
      avgScore: number;
      avgSleep: number;
      avgFocus: number;
      avgPlanned: number;
      completionRate: number;
      count: number;
    };
    const byDay: Record<number, DowStats> = {};

    for (let i = 0; i <= 6; i++) {
      const days = history.filter((d) => new Date(d.date).getDay() === i);
      if (days.length === 0) {
        byDay[i] = {
          avgScore: 0,
          avgSleep: 0,
          avgFocus: 0,
          avgPlanned: 0,
          completionRate: 0,
          count: 0,
        };
        continue;
      }
      byDay[i] = {
        avgScore: Math.round(days.reduce((a, d) => a + d.executionScore, 0) / days.length),
        avgSleep: Math.round((days.reduce((a, d) => a + d.sleepHours, 0) / days.length) * 10) / 10,
        avgFocus: Math.round((days.reduce((a, d) => a + d.focus, 0) / days.length) * 10) / 10,
        avgPlanned: Math.round((days.reduce((a, d) => a + d.planned, 0) / days.length) * 10) / 10,
        completionRate: Math.round(
          (days.reduce((a, d) => a + (d.planned > 0 ? d.completed / d.planned : 1), 0) /
            days.length) *
            100,
        ),
        count: days.length,
      };
    }

    const daysWithData = Object.entries(byDay).filter(([, v]) => v.count > 0);
    const bestDay = daysWithData.reduce(
      (best, [dow, v]) => (v.avgScore > (byDay[Number(best[0])]?.avgScore ?? 0) ? [dow, v] : best),
      daysWithData[0],
    );
    const worstDay = daysWithData.reduce(
      (worst, [dow, v]) =>
        v.avgScore < (byDay[Number(worst[0])]?.avgScore ?? 100) ? [dow, v] : worst,
      daysWithData[0],
    );

    const overallAvgPlanned = history.length
      ? history.reduce((a, d) => a + d.planned, 0) / history.length
      : 3;
    const overplanDays = Object.entries(byDay)
      .filter(([, v]) => v.count > 0 && v.avgPlanned > overallAvgPlanned + 1)
      .map(([dow]) => Number(dow));

    return {
      byDay,
      bestDay: bestDay
        ? {
            dow: Number(bestDay[0]),
            dayName: DAY_NAMES[Number(bestDay[0])],
            avgScore: bestDay[1].avgScore,
          }
        : null,
      worstDay: worstDay
        ? {
            dow: Number(worstDay[0]),
            dayName: DAY_NAMES[Number(worstDay[0])],
            avgScore: worstDay[1].avgScore,
          }
        : null,
      overplanDays,
      dayNames: DAY_NAMES,
    };
  }, [history]);
}

// E3: Smart check-in defaults based on personal history
export function useSmartCheckInDefaults() {
  const checkIns = useApp((s) => s.checkIns);

  return useMemo(() => {
    const recent = checkIns.slice(-7);
    if (recent.length === 0) {
      return { sleepHours: 6.5, focus: 7, energy: 60, tomorrowFocusSuggestion: null };
    }

    const avgSleep = recent.reduce((a, c) => a + c.sleepHours, 0) / recent.length;
    const last3 = checkIns.slice(-3);
    const avgFocus = last3.length
      ? last3.reduce((a, c) => a + c.focus, 0) / last3.length
      : recent.reduce((a, c) => a + c.focus, 0) / recent.length;

    const lastEnergy = checkIns[checkIns.length - 1]?.energy ?? 60;
    const lastTomorrowFocus = checkIns[checkIns.length - 1]?.tomorrowFocus ?? null;

    return {
      sleepHours: Math.round(avgSleep * 2) / 2,
      focus: Math.round(avgFocus),
      energy: lastEnergy,
      tomorrowFocusSuggestion: lastTomorrowFocus || null,
    };
  }, [checkIns]);
}

// E1: Blocker pattern analysis
export function useBlockerPattern() {
  const blockerHistory = useApp((s) => s.blockerHistory);

  return useMemo(() => {
    const last14 = blockerHistory.filter((b) => {
      const d = new Date(b.date);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      return d >= cutoff;
    });

    if (last14.length === 0) {
      return { dominantBlocker: null, streak: null, recommendation: "", blockerCounts: {} };
    }

    const counts: Record<string, number> = {};
    last14.forEach((b) => {
      counts[b.blockerType] = (counts[b.blockerType] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const dominantBlocker = sorted[0]?.[0] ?? null;

    // Detect streak: same blocker type for 3+ consecutive days
    const datesSorted = [...new Set(last14.map((b) => b.date))].sort();
    let streak: { type: string; days: number } | null = null;

    if (datesSorted.length >= 3) {
      const last3Dates = datesSorted.slice(-3);
      const last3Blockers = last14.filter((b) => last3Dates.includes(b.date));
      const streakCounts: Record<string, number> = {};
      last3Blockers.forEach((b) => {
        streakCounts[b.blockerType] = (streakCounts[b.blockerType] || 0) + 1;
      });
      const streakType = Object.entries(streakCounts).find(([, c]) => c >= 3)?.[0];
      if (streakType) streak = { type: streakType, days: 3 };
    }

    const recommendations: Record<string, string> = {
      energy: "Low energy is your primary blocker. Prioritize sleep and add a movement task.",
      focus: "Focus fragmentation is blocking you. Try a distraction detox protocol.",
      time: "Time scarcity suggests overplanning. Cap your list at 3 priorities.",
      other: "External blockers are getting in the way. Review and prune your commitments.",
    };

    return {
      dominantBlocker,
      streak,
      recommendation: dominantBlocker ? (recommendations[dominantBlocker] ?? "") : "",
      blockerCounts: counts,
    };
  }, [blockerHistory]);
}

// E5: Streak context
export function useStreakContext() {
  const streaks = useApp((s) => s.streaks);
  const history = useApp((s) => s.history);

  return useMemo(() => {
    const { current, longest, currentResilienceStreak, longestResilienceStreak, quickRecoveries } =
      streaks;

    // Determine if "at risk": last 3 days trending down toward threshold
    const last3 = history.slice(-3).map((d) => d.executionScore);
    const atRisk =
      last3.length >= 2 &&
      last3[last3.length - 1] < 65 &&
      last3[last3.length - 1] < (last3[last3.length - 2] ?? 100);

    // Use the better of execution or resilience streak for display
    const useResilienceStreak = currentResilienceStreak > current && currentResilienceStreak > 3;
    const displayStreak = useResilienceStreak ? currentResilienceStreak : current;
    const streakType: "execution" | "resilience" = useResilienceStreak ? "resilience" : "execution";

    // Next milestone: 7, 14, 30, 60, 90
    const milestones = [7, 14, 30, 60, 90];
    const nextMilestone = milestones.find((m) => m > displayStreak) ?? 100;
    const milestoneNext = nextMilestone - displayStreak;

    const milestoneLabel =
      milestoneNext <= 0
        ? "Milestone reached!"
        : `${milestoneNext} day${milestoneNext === 1 ? "" : "s"} to ${nextMilestone}-day ${streakType} streak`;

    return {
      currentStreak: displayStreak,
      streakType,
      atRisk,
      milestoneNext,
      milestoneLabel,
      longest,
      longestResilienceStreak,
      quickRecoveries,
      execStreak: current,
      resStreak: currentResilienceStreak,
    };
  }, [streaks, history]);
}

// E7: Task intelligence
export function useTaskIntelligence() {
  const tasks = useApp((s) => s.tasks);
  const history = useApp((s) => s.history);
  const { state } = useUserState();

  return useMemo(() => {
    // Recommended task mix by user state
    const recommended: Record<Task["type"], number> = {
      deep: state === "peak" ? 3 : state === "steady" ? 2 : state === "recovery" ? 0 : 1,
      shallow: state === "recovery" ? 1 : 2,
      admin: 1,
      movement: 1,
      "wind-down": state === "recovery" ? 1 : 0,
    };

    const actual: Record<Task["type"], number> = {
      deep: 0,
      shallow: 0,
      admin: 0,
      movement: 0,
      "wind-down": 0,
    };
    tasks.forEach((t) => {
      actual[t.type] = (actual[t.type] || 0) + 1;
    });

    const deepCount = actual.deep;
    const maxDeep = recommended.deep;
    const typeBalanceWarning =
      deepCount > maxDeep + 1
        ? `${deepCount} deep tasks is over your current capacity (${maxDeep}). Consider swapping one for movement.`
        : null;

    // Reschedule alerts
    const rescheduleAlerts: { taskId: string; label: string; count: number }[] = tasks
      .filter((t) => (t.rescheduled ?? 0) >= 2)
      .map((t) => ({ taskId: t.id, label: t.label, count: t.rescheduled ?? 0 }));

    // Load risk based on estimated minutes
    const last7 = history.slice(-7);
    const avgCapacityMin = last7.length
      ? Math.round(last7.reduce((a, d) => a + d.completed * 45, 0) / last7.length)
      : 135;
    const totalEstimated = tasks.reduce((a, t) => a + t.estMin, 0);
    const todayLoadRisk: "overloaded" | "optimal" | "underloaded" =
      totalEstimated > avgCapacityMin * 1.4
        ? "overloaded"
        : totalEstimated < avgCapacityMin * 0.5
          ? "underloaded"
          : "optimal";

    const suggestedCap =
      recommended.deep + recommended.shallow + recommended.admin + recommended.movement;

    return {
      todayLoadRisk,
      typeBalanceWarning,
      rescheduleAlerts,
      suggestedCap,
      actual,
      recommended,
    };
  }, [tasks, history, state]);
}

// E6: Personalized recovery protocol matching
export function usePersonalizedRecoveryMatch() {
  const struggles = useApp((s) => s.struggles);
  const profile = useApp((s) => s.profile);
  const history = useApp((s) => s.history);
  const { dominantBlocker } = useBlockerPattern();

  return useMemo(() => {
    type ProtocolKey =
      | "burnout"
      | "procrastination"
      | "perfectionism"
      | "low-energy"
      | "distraction"
      | "sleep-debt";
    const scores: Record<ProtocolKey, number> = {
      burnout: 0,
      procrastination: 0,
      perfectionism: 0,
      "low-energy": 0,
      distraction: 0,
      "sleep-debt": 0,
    };

    // Onboarding struggles signal
    const allStruggles = [...(struggles ?? []), ...(profile?.struggles ?? [])];
    allStruggles.forEach((s) => {
      const sl = s.toLowerCase();
      if (sl.includes("procrastinat")) scores.procrastination += 4;
      if (sl.includes("perfect")) scores.perfectionism += 4;
      if (sl.includes("focus") || sl.includes("distract") || sl.includes("phone"))
        scores.distraction += 3;
      if (sl.includes("energy") || sl.includes("tired") || sl.includes("motivat"))
        scores["low-energy"] += 3;
      if (sl.includes("sleep")) scores["sleep-debt"] += 3;
      if (sl.includes("burnout") || sl.includes("overwhelm") || sl.includes("stress"))
        scores.burnout += 3;
    });

    // Dominant blocker signal
    if (dominantBlocker === "energy") {
      scores["low-energy"] += 3;
      scores["sleep-debt"] += 2;
    }
    if (dominantBlocker === "focus") scores.distraction += 3;
    if (dominantBlocker === "time") scores.burnout += 2;

    // Recent history signals
    const last7 = history.slice(-7);
    const avgSleep = last7.length ? last7.reduce((a, d) => a + d.sleepHours, 0) / last7.length : 7;
    const avgDist = last7.length ? last7.reduce((a, d) => a + d.distractions, 0) / last7.length : 2;
    const last7Scores = last7.map((d) => d.executionScore);
    const weekDrop =
      last7Scores.length >= 2
        ? (last7Scores[0] ?? 50) - (last7Scores[last7Scores.length - 1] ?? 50)
        : 0;

    if (avgSleep < 6.5) scores["sleep-debt"] += 3;
    if (avgDist > 5) scores.distraction += 3;
    if (weekDrop > 25) scores.burnout += 2;

    const sorted = (Object.entries(scores) as [ProtocolKey, number][]).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const second = sorted[1];

    const totalSignals = top[1];
    const confidence: "high" | "medium" | "low" =
      totalSignals >= 6 ? "high" : totalSignals >= 3 ? "medium" : "low";

    const reasonParts: string[] = [];
    if (allStruggles.length > 0) reasonParts.push("your onboarding profile");
    if (dominantBlocker) reasonParts.push(`recent ${dominantBlocker} blockers`);
    if (avgSleep < 6.5) reasonParts.push("low sleep this week");
    if (avgDist > 5) reasonParts.push("high distraction count");

    const reasoning =
      reasonParts.length > 0
        ? `Based on ${reasonParts.join(", ")}.`
        : "Based on general patterns in your history.";

    return {
      recommendedProtocol: top[0],
      confidence,
      reasoning,
      alternativeProtocol: second[0],
    };
  }, [struggles, profile, history, dominantBlocker]);
}

// E4: Insight effectiveness feedback loop
export function useInsightEffectiveness() {
  const insights = useApp((s) => s.insights);
  const history = useApp((s) => s.history);

  return useMemo(() => {
    return insights
      .filter((i) => i.committed && i.committedAt && i.preCommitAvgScore !== undefined)
      .map((insight) => {
        const daysSinceCommit = Math.floor(
          (Date.now() - new Date(insight.committedAt!).getTime()) / 86400000,
        );

        const postCommitDays = history.filter((d) => d.date >= insight.committedAt!);
        const postCommitAvg = postCommitDays.length
          ? Math.round(
              postCommitDays.reduce((a, d) => a + d.executionScore, 0) / postCommitDays.length,
            )
          : insight.preCommitAvgScore!;

        const delta = postCommitAvg - insight.preCommitAvgScore!;

        let verdict: "working" | "too-early" | "not-working" | "plateau";
        if (daysSinceCommit < 7) {
          verdict = "too-early";
        } else if (delta >= 5) {
          const last5 = postCommitDays.slice(-5);
          const last5Avg = last5.length
            ? last5.reduce((a, d) => a + d.executionScore, 0) / last5.length
            : postCommitAvg;
          verdict = last5Avg < insight.preCommitAvgScore! + 3 ? "plateau" : "working";
        } else {
          verdict = "not-working";
        }

        return {
          insightId: insight.id,
          title: insight.title,
          committedAt: insight.committedAt!,
          daysSinceCommit,
          preCommitAvg: insight.preCommitAvgScore!,
          postCommitAvg,
          delta,
          verdict,
        };
      });
  }, [insights, history]);
}

// E9: Score attribution — which factors most deviated from personal baseline today
export function useScoreAttribution() {
  const checkIns = useApp((s) => s.checkIns);
  const history = useApp((s) => s.history);
  const tasks = useApp((s) => s.tasks);

  return useMemo(() => {
    if (checkIns.length < 3) return null;

    const last = checkIns[checkIns.length - 1];
    const baseline = checkIns.slice(-14, -1);
    if (baseline.length < 3) return null;

    const avgSleep = baseline.reduce((a, c) => a + c.sleepHours, 0) / baseline.length;
    const avgFocus = baseline.reduce((a, c) => a + c.focus, 0) / baseline.length;
    const avgHonesty = baseline.reduce((a, c) => a + c.honesty, 0) / baseline.length;
    const avgCompleted =
      history.slice(-14, -1).reduce((a, d) => a + d.completed, 0) /
      Math.max(1, history.slice(-14, -1).length);

    const completed = tasks.filter((t) => t.done).length;

    const deviations: {
      label: string;
      value: string;
      baseline: string;
      direction: "drag" | "boost" | "neutral";
    }[] = [];

    const sleepDiff = last.sleepHours - avgSleep;
    if (Math.abs(sleepDiff) >= 0.5) {
      deviations.push({
        label: "Sleep",
        value: `${last.sleepHours}h`,
        baseline: `${avgSleep.toFixed(1)}h avg`,
        direction: sleepDiff >= 0.5 ? "boost" : "drag",
      });
    }

    const focusDiff = last.focus - avgFocus;
    if (Math.abs(focusDiff) >= 1) {
      deviations.push({
        label: "Focus",
        value: `${last.focus}/10`,
        baseline: `${avgFocus.toFixed(1)} avg`,
        direction: focusDiff >= 1 ? "boost" : "drag",
      });
    }

    const completedDiff = completed - avgCompleted;
    if (Math.abs(completedDiff) >= 0.5) {
      deviations.push({
        label: "Tasks",
        value: `${completed} done`,
        baseline: `${avgCompleted.toFixed(1)} avg`,
        direction: completedDiff >= 0.5 ? "boost" : "drag",
      });
    }

    const honestyDiff = last.honesty - avgHonesty;
    if (Math.abs(honestyDiff) >= 1.5) {
      deviations.push({
        label: "Honesty",
        value: `${last.honesty}/10`,
        baseline: `${avgHonesty.toFixed(1)} avg`,
        direction: honestyDiff >= 1.5 ? "boost" : "drag",
      });
    }

    // Sort: drags first (most impactful to explain a low score)
    deviations.sort(
      (a, b) => (a.direction === "drag" ? -1 : 1) - (b.direction === "drag" ? -1 : 1),
    );

    return { deviations: deviations.slice(0, 3), hasBaseline: true };
  }, [checkIns, history, tasks]);
}

// E10: Score velocity — detect sustained downward trend before it hits burnout threshold
export function useScoreVelocity() {
  const history = useApp((s) => s.history);

  return useMemo(() => {
    const last5 = history.slice(-5);
    if (last5.length < 4) return { declining: false, dropPts: 0, dayCount: 0 };

    let consecutiveDown = 0;
    for (let i = last5.length - 1; i >= 1; i--) {
      const diff = last5[i].executionScore - last5[i - 1].executionScore;
      if (diff < -2) consecutiveDown++;
      else break;
    }

    const dropPts =
      consecutiveDown >= 2
        ? (last5[last5.length - 1 - consecutiveDown]?.executionScore ?? 0) -
          (last5[last5.length - 1]?.executionScore ?? 0)
        : 0;

    return {
      declining: consecutiveDown >= 3,
      dropPts,
      dayCount: consecutiveDown,
    };
  }, [history]);
}

// E8: Tomorrow briefing selector
export function useTomorrowBriefing() {
  const tomorrowPlan = useApp((s) => s.tomorrowPlan);
  const history = useApp((s) => s.history);

  return useMemo(() => {
    if (!tomorrowPlan)
      return {
        hasPlan: false,
        northStar: null,
        suggestedTasks: [],
        capacityForecast: null,
        insight: "",
      };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dow = tomorrow.getDay();
    const DAY_NAMES = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const tomorrowName = DAY_NAMES[dow];

    const { predictedScore, warningFlags } = tomorrowPlan.capacityForecast;

    let insight = `Tomorrow is ${tomorrowName}.`;
    if (predictedScore >= 65) {
      insight += ` Historically a strong day (avg ~${predictedScore}). Load can handle up to ${tomorrowPlan.suggestedTasks.length} priorities.`;
    } else {
      insight += ` Historically a lighter day (avg ~${predictedScore}). Keep it lean.`;
    }
    if (warningFlags.length > 0) insight += ` ${warningFlags[0]}`;

    return {
      hasPlan: true,
      northStar: tomorrowPlan.northStar || null,
      suggestedTasks: tomorrowPlan.suggestedTasks,
      capacityForecast: tomorrowPlan.capacityForecast,
      insight,
    };
  }, [tomorrowPlan, history]);
}
