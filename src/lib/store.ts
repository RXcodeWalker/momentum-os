import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Task = {
  id: string;
  label: string;
  estMin: number;
  done: boolean;
  type: "deep" | "shallow" | "movement" | "wind-down";
  rescheduled?: number;
};

export type CheckIn = {
  date: string; // YYYY-MM-DD
  focus: number; // 1-10
  energy: number; // 0-100
  mood: number; // 0-4
  distractions: string[];
  honesty: number; // 1-10 (how honest the user rates themselves)
  reflection?: string;
  sleepHours: number;
  completed: number;
  planned: number;
};

export type DayLog = {
  date: string;
  executionScore: number; // 0-100
  planned: number;
  completed: number;
  focus: number;
  sleepHours: number;
  distractions: number;
  recovery: boolean;
};

type State = {
  onboarded: boolean;
  goals: string[];
  struggles: string[];
  tasks: Task[];
  checkIns: CheckIn[];
  history: DayLog[]; // last 28d synthetic + new
  recoveryMode: boolean;
  recoveryReason?: string;
  recoveryStarted?: string;
  premium: boolean;
  // actions
  setOnboarding: (g: string[], s: string[]) => void;
  toggleTask: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "done">) => void;
  rescheduleTask: (id: string) => void;
  saveCheckIn: (c: Omit<CheckIn, "date">) => { newScore: number; delta: number };
  enterRecovery: (reason: string) => void;
  exitRecovery: () => void;
  acceptMinimumViableDay: () => void;
  resetDemo: () => void;
  setPremium: (v: boolean) => void;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const defaultTasks: Task[] = [
  { id: "t1", label: "Deep work — Linear algebra problem set", estMin: 90, done: true, type: "deep" },
  { id: "t2", label: "Ship signup screen", estMin: 45, done: false, type: "deep" },
  { id: "t3", label: "Run · Zone 2", estMin: 30, done: true, type: "movement" },
  { id: "t4", label: "Wind down · screens off by 22:30", estMin: 0, done: false, type: "wind-down" },
];

// Synthetic 28-day history with realistic variance and a recent dip
function seedHistory(): DayLog[] {
  const out: DayLog[] = [];
  const base = [
    62, 71, 58, 74, 80, 68, 55, 62, 73, 81, 77, 70, 64, 58,
    49, 42, 55, 67, 72, 78, 81, 74, 68, 71, 79, 83, 76, 78,
  ];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const v = base[27 - i];
    out.push({
      date: d.toISOString().slice(0, 10),
      executionScore: v,
      planned: 3 + Math.round(Math.random() * 4),
      completed: Math.max(1, Math.round((v / 100) * 5)),
      focus: Math.round(4 + (v / 100) * 5),
      sleepHours: 5.5 + Math.random() * 2.5,
      distractions: Math.round((100 - v) / 18),
      recovery: v < 50,
    });
  }
  return out;
}

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      onboarded: true,
      goals: ["coding", "studying", "fitness"],
      struggles: ["inconsistency", "overplanning"],
      tasks: defaultTasks,
      checkIns: [],
      history: seedHistory(),
      recoveryMode: false,
      premium: false,

      setOnboarding: (goals, struggles) => set({ onboarded: true, goals, struggles }),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),

      addTask: (t) =>
        set((s) => ({
          tasks: [...s.tasks, { ...t, id: crypto.randomUUID(), done: false }],
        })),

      rescheduleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, rescheduled: (t.rescheduled || 0) + 1 } : t
          ),
        })),

      saveCheckIn: (c) => {
        const date = todayStr();
        const ci: CheckIn = { date, ...c };
        // Compute new execution score using weighted signals
        const taskRatio = c.planned > 0 ? c.completed / c.planned : 0;
        const focusN = c.focus / 10;
        const energyN = c.energy / 100;
        const sleepN = Math.min(1, Math.max(0, (c.sleepHours - 5) / 3)); // 5h -> 0, 8h -> 1
        const distN = Math.max(0, 1 - c.distractions.length / 6);
        const honestyN = c.honesty / 10;
        const raw =
          taskRatio * 35 + focusN * 22 + energyN * 12 + sleepN * 14 + distN * 10 + honestyN * 7;
        const newScore = Math.round(Math.max(15, Math.min(100, raw)));

        const prev = get().history;
        const last = prev[prev.length - 1];
        const delta = newScore - (last?.executionScore ?? newScore);

        // Replace today if exists, else append
        const dayLog: DayLog = {
          date,
          executionScore: newScore,
          planned: c.planned,
          completed: c.completed,
          focus: c.focus,
          sleepHours: c.sleepHours,
          distractions: c.distractions.length,
          recovery: get().recoveryMode,
        };
        const newHistory = prev[prev.length - 1]?.date === date
          ? [...prev.slice(0, -1), dayLog]
          : [...prev, dayLog];

        set({
          checkIns: [...get().checkIns.filter((x) => x.date !== date), ci],
          history: newHistory,
        });

        // Auto-trigger recovery if score crashed
        if (newScore < 45 && !get().recoveryMode) {
          set({
            recoveryMode: true,
            recoveryReason: c.sleepHours < 6 ? "sleep-debt" : "overload",
            recoveryStarted: date,
          });
        }
        if (newScore > 70 && get().recoveryMode) {
          set({ recoveryMode: false, recoveryReason: undefined });
        }

        return { newScore, delta };
      },

      enterRecovery: (reason) =>
        set({ recoveryMode: true, recoveryReason: reason, recoveryStarted: todayStr() }),

      exitRecovery: () => set({ recoveryMode: false, recoveryReason: undefined }),

      acceptMinimumViableDay: () =>
        set({
          tasks: [
            { id: "mvd1", label: "20 min review · linear algebra", estMin: 20, done: false, type: "deep" },
            { id: "mvd2", label: "Walk · 30 min, no headphones", estMin: 30, done: false, type: "movement" },
            { id: "mvd3", label: "In bed by 22:30, screens away", estMin: 0, done: false, type: "wind-down" },
          ],
        }),

      setPremium: (v) => set({ premium: v }),

      resetDemo: () =>
        set({
          tasks: defaultTasks,
          checkIns: [],
          history: seedHistory(),
          recoveryMode: false,
          recoveryReason: undefined,
        }),
    }),
    { name: "cadence-store-v1" }
  )
);

// Derived selectors
export function useExecutionScore(): number {
  const h = useApp((s) => s.history);
  return h[h.length - 1]?.executionScore ?? 0;
}

export function useMomentum(): { delta: number; trend: "up" | "down" | "flat" } {
  const h = useApp((s) => s.history);
  const last7 = h.slice(-7).map((d) => d.executionScore);
  const prev7 = h.slice(-14, -7).map((d) => d.executionScore);
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const delta = Math.round(avg(last7) - avg(prev7));
  return { delta, trend: delta > 2 ? "up" : delta < -2 ? "down" : "flat" };
}

export function useConsistency(days = 14): number {
  const h = useApp((s) => s.history).slice(-days);
  if (!h.length) return 0;
  const above = h.filter((d) => d.executionScore >= 60).length;
  return Math.round((above / h.length) * 100);
}

export type UserState = "peak" | "steady" | "inconsistent" | "burnout" | "recovery";

export function useUserState(): { state: UserState; label: string; tone: "success" | "accent" | "warning" | "danger" | "neutral" } {
  const h = useApp((s) => s.history);
  const recovery = useApp((s) => s.recoveryMode);
  if (recovery) return { state: "recovery", label: "Recovery mode", tone: "warning" };
  const last7 = h.slice(-7);
  if (!last7.length) return { state: "steady", label: "Calibrating", tone: "neutral" };
  const avg = last7.reduce((a, d) => a + d.executionScore, 0) / last7.length;
  const lowSleep = last7.filter((d) => d.sleepHours < 6).length;
  const lowDays = last7.filter((d) => d.executionScore < 50).length;
  const mean = avg;
  const variance = last7.reduce((a, d) => a + (d.executionScore - mean) ** 2, 0) / last7.length;
  const sd = Math.sqrt(variance);
  if (lowDays >= 3 && lowSleep >= 3) return { state: "burnout", label: "Burnout signals", tone: "danger" };
  if (avg >= 75) return { state: "peak", label: "Peak window", tone: "success" };
  if (sd > 14) return { state: "inconsistent", label: "Inconsistent", tone: "warning" };
  return { state: "steady", label: "Steady state", tone: "accent" };
}

export function useResilience(): { score: number; avgRecoveryDays: number } {
  const h = useApp((s) => s.history);
  let dips = 0, totalDays = 0;
  for (let i = 1; i < h.length; i++) {
    if (h[i - 1].executionScore < 50 && h[i].executionScore >= 50) {
      // find prior dip start
      let start = i - 1;
      while (start > 0 && h[start - 1].executionScore < 50) start--;
      // find recovery to ≥65
      for (let j = i; j < h.length; j++) {
        if (h[j].executionScore >= 65) {
          dips++;
          totalDays += j - start;
          break;
        }
      }
    }
  }
  const avg = dips ? totalDays / dips : 2;
  // Faster recovery → higher score (cap at 4 days)
  const score = Math.round(Math.max(20, Math.min(100, 100 - (avg - 1) * 18)));
  return { score, avgRecoveryDays: Math.round(avg * 10) / 10 };
}

export function useFakeProductivityFlags() {
  const h = useApp((s) => s.history).slice(-14);
  const tasks = useApp((s) => s.tasks);
  const totalPlanned = h.reduce((a, d) => a + d.planned, 0);
  const totalDone = h.reduce((a, d) => a + d.completed, 0);
  const ratio = totalPlanned ? totalDone / totalPlanned : 0;
  const reschedules = tasks.reduce((a, t) => a + (t.rescheduled || 0), 0);
  const avgPlanned = totalPlanned / Math.max(1, h.length);
  return {
    planExecuteRatio: Math.round(ratio * 100),
    overplanning: avgPlanned > 5,
    reschedules,
    flags: [
      ratio < 0.6 && `You executed ${Math.round(ratio * 100)}% of what you planned this week.`,
      avgPlanned > 5 && `You plan ${avgPlanned.toFixed(1)} priorities/day. Your sustainable cap is 3.`,
      reschedules >= 3 && `${reschedules} tasks rescheduled in the last cycle. That's avoidance.`,
    ].filter(Boolean) as string[],
  };
}
