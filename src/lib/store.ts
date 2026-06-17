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
import type { BehavioralPipeline } from "@/core/contracts/pipeline/behavioral-pipeline";
import { buildSessionEvidence } from "@/engine/orchestrator/evidence-bridge";
import { runBehavioralPipeline } from "@/engine/orchestrator/pipeline-runner";
import {
  buildDemoHistory,
  buildDemoInsights,
  buildDemoMembers,
  buildDemoProofs,
  demoCircle,
  demoPersonalProofs,
  demoPrinciples,
  demoTasks,
  emptyCircle,
} from "@/lib/demo-data";

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
  state: "peak" | "steady" | "building" | "recovery" | "inconsistent";
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

export type MorningCalibrationInput = {
  sleepQuality: 'rough' | 'decent' | 'good'
  bodyEnergy: 1 | 2 | 3 | 4 | 5
  resistance: 'ready' | 'friction' | 'resistant'
}

export type MorningCalibration = {
  date: string
  inputs: MorningCalibrationInput
  skipped: boolean
  committedTaskId: string | null
  intentionText: string | null
  completedAt: string
}

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
  firstCheckInAt: string | null;
  consentedToAutoRecovery: boolean;
  recoverySuggestion: { reason: string; suggestedAt: string } | null;
  /** Last behavioral pipeline result — updated on each saveCheckIn(). null until first check-in. */
  lastPipelineResult: BehavioralPipeline | null;
  /** Morning calibration record for today — null until first morning calibration. */
  lastMorningCalibration: MorningCalibration | null;

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
  loadDemoData: () => void;
  dismissRecoverySuggestion: () => void;
  acceptRecoverySuggestion: () => void;
  addProof: (proof: Omit<ExecutionProof, "id" | "timestamp">) => void;
  acknowledgeProof: (proofId: string, memberId: string) => void;
  dismissInsight: (id: string) => void;
  addPersonalProof: (text: string, trait: string) => void;
  commitToInsight: (id: string, rule: string) => void;
  addPrinciple: (p: string) => void;
  removePrinciple: (p: string) => void;
  refreshInsights: () => void;
  saveMorningCalibration: (data: MorningCalibrationInput, committedTaskId: string | null, intentionText: string | null) => void;
  skipMorningCalibration: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  startGuestSession: () => void;
  dismissUpgradePrompt: () => void;
  migrateGuestToAccount: (
    userId: string,
    email: string,
    cloudData: Partial<State> | null,
  ) => Promise<void>;
  hydrateStore: (
    data: Partial<State> & { _insightOverrides?: Map<string, Record<string, unknown>> },
  ) => void;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const useApp = create<State>()(
  persist(
    (set, get) => {
      return {
        user: "",
        currentUserId: "",
        onboarded: false,
        sessionType: "guest" as const,
        guestSince: null,
        pendingMigration: false,
        upgradePromptDismissed: false,
        upgradePromptDismissedAt: null,
        dataIsSeeded: false,
        firstCheckInAt: null,
        consentedToAutoRecovery: false,
        recoverySuggestion: null,
        lastPipelineResult: null,
        lastMorningCalibration: null,
        setup: {
          step: 0,
          completed: false,
        },
        goals: [],
        struggles: [],
        profile: null,
        tasks: [],
        checkIns: [],
        history: [],
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
        insights: [],
        committedRules: [],
        daysOnApp: 0,
        proofs: [],
        personalProofs: [],
        principles: [],
        members: [],
        circle: emptyCircle,

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

          // Run behavioral pipeline on the updated evidence set.
          // Non-fatal: a pipeline failure keeps the last known result.
          const updatedCheckIns = [...s.checkIns, { ...data, date: todayStr() }]
          const pipelineEvidence = buildSessionEvidence(history, updatedCheckIns)
          const previousEngineMode = s.lastPipelineResult?.stateInterpretation.currentMode
          let lastPipelineResult: BehavioralPipeline | null = s.lastPipelineResult
          try {
            lastPipelineResult = runBehavioralPipeline({
              evidence: pipelineEvidence,
              context: {
                flowPhase: 'evening',
                historicalSnapshots: [],
                previousMode: previousEngineMode,
              },
              recentInterventions: [],
            })
          } catch {
            // Pipeline failure is non-fatal — keep previous result
          }

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
          }

          // Recovery is never auto-flipped on. A low score raises a suggestion the user can accept or dismiss.
          let nextSuggestion = get().recoverySuggestion;
          if (!wasRecovery && newScore < 45 && !nextSuggestion) {
            nextSuggestion = {
              reason:
                "Your last reflection landed low. Cadence can switch to a smaller-surface recovery mode if that fits today.",
              suggestedAt: todayStr(),
            };
          }

          set((state) => ({
            history,
            checkIns: [...state.checkIns, { ...data, date: todayStr() }],
            recoveryMode: nextRecoveryMode,
            recoveryHighScoreDays,
            recoverySuggestion: nextSuggestion,
            firstCheckInAt: state.firstCheckInAt ?? todayStr(),
            dataIsSeeded: false,
            blockerHistory: [...state.blockerHistory, ...newBlockers],
            distractionLog,
            streaks,
            tomorrowPlan,
            lastPipelineResult,
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
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo },
          });
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
          const {
            data: { user: sessionUser },
          } = await supabase.auth.getUser();
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
          get().loadDemoData();
        },
        loadDemoData: () => {
          const h = buildDemoHistory();
          set({
            tasks: demoTasks,
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
            recoverySuggestion: null,
            insights: buildDemoInsights(h),
            proofs: buildDemoProofs(),
            daysOnApp: h.length,
            checkInStyle: "wizard",
            personalProofs: demoPersonalProofs,
            principles: demoPrinciples,
            members: buildDemoMembers(),
            circle: demoCircle,
            dataIsSeeded: true,
          });
        },
        saveMorningCalibration: (data, committedTaskId, intentionText) => {
          const s = get()
          const SLEEP_QUALITY_MAP = { rough: 25, decent: 60, good: 90 } as const
          const ENERGY_MAP = [20, 40, 60, 80, 100] as const
          const RESISTANCE_MAP = { ready: 15, friction: 50, resistant: 85 } as const

          const morningInputs = {
            capturedAt: `${todayStr()}T07:00:00.000Z`,
            sessionId: `morning-${todayStr()}`,
            recoveryInputs: {
              sleepQuality: SLEEP_QUALITY_MAP[data.sleepQuality],
              physicalEnergy: ENERGY_MAP[data.bodyEnergy - 1],
              mentalClarity: 65,
            },
            emotionalInputs: {
              emotionalResistance: RESISTANCE_MAP[data.resistance],
              overwhelm: 40,
              stressPressure: 30,
            },
            executionInputs: { meaningfulAdvancementQuality: 65, deepWorkContinuity: 65, executionIntegrity: 65 },
            behavioralInputs: { fragmentationLevel: 25, distractionPatterns: 25, avoidancePressure: 25, pacingQuality: 70 },
          }

          const morningEvidence = {
            sessionId: `morning-${todayStr()}`,
            capturedAt: `${todayStr()}T07:00:00.000Z`,
            evidenceType: 'MANUAL_CALIBRATION' as const,
            inputs: morningInputs,
            completeness: 0.4,
          }

          const mergedEvidence = [morningEvidence, ...buildSessionEvidence(s.history, s.checkIns)]
          const previousMode = s.lastPipelineResult?.stateInterpretation.currentMode
          let lastPipelineResult = s.lastPipelineResult

          try {
            lastPipelineResult = runBehavioralPipeline({
              evidence: mergedEvidence,
              context: {
                flowPhase: 'morning',
                historicalSnapshots: [],
                previousMode,
              },
              recentInterventions: [],
            })
          } catch {
            // Pipeline failure is non-fatal — interpretation step will use previous result
          }

          const calibration: MorningCalibration = {
            date: todayStr(),
            inputs: data,
            skipped: false,
            committedTaskId,
            intentionText,
            completedAt: new Date().toISOString(),
          }

          set({ lastMorningCalibration: calibration, lastPipelineResult })
        },

        skipMorningCalibration: () => {
          set({
            lastMorningCalibration: {
              date: todayStr(),
              inputs: { sleepQuality: 'decent', bodyEnergy: 3, resistance: 'friction' },
              skipped: true,
              committedTaskId: null,
              intentionText: null,
              completedAt: new Date().toISOString(),
            },
          })
        },

        dismissRecoverySuggestion: () => set({ recoverySuggestion: null }),
        acceptRecoverySuggestion: () => {
          const s = get();
          set({
            recoveryMode: true,
            recoveryReason: s.recoverySuggestion?.reason,
            recoverySuggestion: null,
            consentedToAutoRecovery: true,
          });
        },
      };
    },
    {
      name: "cadence-store-v1",
      version: 4,
      migrate: (persistedState, version) => {
        let s = persistedState as Partial<State>;
        if (version < 2) {
          s = {
            ...s,
            sessionType: s.currentUserId ? ("authenticated" as const) : ("guest" as const),
            guestSince: s.currentUserId ? null : todayStr(),
            pendingMigration: false,
            upgradePromptDismissed: false,
            upgradePromptDismissedAt: null,
            dataIsSeeded: false,
          };
        }
        if (version < 3) {
          // Truth Foundation migration: wipe seeded data for users who never reflected.
          // Real users (firstCheckInAt set, or any real checkIns) keep everything.
          const hasRealCheckIns = (s.checkIns?.length ?? 0) > 0;
          const wasSeeded = s.dataIsSeeded === true;
          if (wasSeeded && !hasRealCheckIns) {
            s = {
              ...s,
              tasks: [],
              history: [],
              insights: [],
              proofs: [],
              members: [],
              personalProofs: [],
              principles: [],
              daysOnApp: 0,
              dataIsSeeded: false,
            };
          }
          s = {
            ...s,
            firstCheckInAt:
              s.firstCheckInAt ?? (hasRealCheckIns ? (s.checkIns?.[0]?.date ?? null) : null),
            consentedToAutoRecovery: s.consentedToAutoRecovery ?? false,
            recoverySuggestion: s.recoverySuggestion ?? null,
          };
        }
        if (version < 4) {
          s = { ...s, lastMorningCalibration: s.lastMorningCalibration ?? null }
        }
        return s as State;
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
  const profile = useApp((s) => s.profile);

  return useMemo(() => {
    if (!premium) return null;

    const last14 = h.slice(-14);
    const deepTasks = tasks.filter((t) => t.type === "deep").length;
    const avgSleep = last14.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last14.length);

    // With sparse history, derive window from declared energy peak rather than sleep-based estimate.
    // Once 7+ days of data accumulate, real patterns take over.
    if (last14.length < 7 && profile?.energyPeak[0]) {
      const peakWindowMap: Record<string, string> = {
        early: "5:00 – 9:00",
        morning: "9:00 – 12:00",
        midday: "12:00 – 15:00",
        evening: "17:00 – 21:00",
        night: "21:00 – 24:00",
      };
      return {
        optimalWindow: peakWindowMap[profile.energyPeak[0]] ?? "9:00 – 12:00",
        distractionRisk: avgSleep < 7 ? "High (after 14:00)" : "Low",
        capacity: deepTasks > 3 ? "Oversaturated" : "Optimal",
        score: Math.round((avgSleep / 8) * 100),
      };
    }

    // Behavior-derived window once sufficient history exists
    const startHour = avgSleep > 7.5 ? 8 : 10;
    const duration = Math.max(2, Math.min(4, avgSleep - 4));

    return {
      optimalWindow: `${startHour}:00 – ${startHour + Math.round(duration)}:00`,
      distractionRisk: avgSleep < 7 ? "High (after 14:00)" : "Low",
      capacity: deepTasks > 3 ? "Oversaturated" : "Optimal",
      score: Math.round((avgSleep / 8) * 100),
    };
  }, [h, tasks, premium, profile]);
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
  const profile = useApp((s) => s.profile);

  return useMemo(() => {
    const recent = checkIns.slice(-7);
    if (recent.length === 0) {
      // Seed from declared profile when no behavioral history exists yet.
      // Real check-in data will override these once it accumulates.
      const sleepMap: Record<string, number> = { solid: 8, variable: 7, short: 6, collapsed: 5 };
      const focusMap: Record<string, number> = { "15": 3, "45": 6, "90": 8, varies: 6 };
      return {
        sleepHours: sleepMap[profile?.sleep[0] ?? ""] ?? 6.5,
        focus: focusMap[profile?.focus[0] ?? ""] ?? 7,
        energy: 60,
        tomorrowFocusSuggestion: null,
      };
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
  }, [checkIns, profile]);
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
  const profile = useApp((s) => s.profile);
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

    const stateCap =
      recommended.deep + recommended.shallow + recommended.admin + recommended.movement;
    // Profile cap acts as a soft ceiling — behavioral history is trusted more as it accumulates.
    const workloadCapMap: Record<string, number> = {
      light: 2,
      moderate: 3,
      heavy: 4,
      unclear: Infinity,
    };
    const profileCap = workloadCapMap[profile?.workload[0] ?? "unclear"] ?? Infinity;
    // Blend: profile is the starting signal; after 14 days of history it fades to a secondary guide.
    const onboardingWeight = history.length < 14 ? 1 : 0.35;
    const blendedCap =
      profileCap === Infinity
        ? stateCap
        : Math.round(stateCap * (1 - onboardingWeight) + profileCap * onboardingWeight);
    const suggestedCap = Math.max(1, blendedCap);

    return {
      todayLoadRisk,
      typeBalanceWarning,
      rescheduleAlerts,
      suggestedCap,
      actual,
      recommended,
    };
  }, [tasks, history, state, profile]);
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

    // Recovery pattern signal — self-reported tendency as a soft directional weight
    const recoverySpeed = profile?.recovery[0];
    if (recoverySpeed === "spiral") scores.burnout += 15;
    else if (recoverySpeed === "slow") scores["low-energy"] += 10;
    else if (recoverySpeed === "fast") scores.procrastination += 5;

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
