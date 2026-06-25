import { useApp } from "@/lib/store";
import type { OnboardingProfile, Task } from "@/lib/store";

// ── Task seeding ──────────────────────────────────────────────────────────────

const GOAL_TASKS: Record<string, { label: string; type: Task["type"] }> = {
  studying: { label: "Study session", type: "deep" },
  fitness: { label: "Training block", type: "movement" },
  coding: { label: "Code: pick one thing to ship", type: "deep" },
  creativity: { label: "Creative work session", type: "deep" },
  discipline: { label: "One hard thing", type: "deep" },
  social: { label: "Social commitment", type: "shallow" },
  sleep: { label: "Wind-down (no screens 10 PM)", type: "wind-down" },
  focus: { label: "Deep focus block", type: "deep" },
  emotional: { label: "Reflection / journaling", type: "shallow" },
};

const STRUGGLE_TASKS: Record<string, { label: string; type: Task["type"]; estMin: number }> = {
  burnout: { label: "20 min walk or movement break", type: "movement", estMin: 20 },
  distraction: { label: "Phone-free focus block", type: "deep", estMin: 30 },
  procrastination: { label: "Start the avoided task (5 min)", type: "deep", estMin: 15 },
  perfectionism: { label: "Ship something imperfect", type: "shallow", estMin: 20 },
  inconsistency: { label: "One task only — just finish it", type: "deep", estMin: 30 },
  overplanning: { label: "No new plans — execute one", type: "deep", estMin: 30 },
  motivation: { label: "Smallest possible first step", type: "shallow", estMin: 15 },
};

function deriveFocusMin(focus: string[]): number {
  const map: Record<string, number> = { "15": 25, "45": 50, "90": 90, varies: 50 };
  return map[focus[0] ?? "45"] ?? 50;
}

function deriveTaskCap(workload: string[], sleep: string[]): number {
  const baseCap = { heavy: 4, moderate: 3, light: 2, unclear: 2 }[workload[0] ?? "unclear"] ?? 2;
  const sleepId = sleep[0] ?? "variable";
  if (sleepId === "collapsed") return Math.max(1, baseCap - 2);
  if (sleepId === "short") return Math.max(1, baseCap - 1);
  return baseCap;
}

export function seedFirstSessionTasks(profile: OnboardingProfile): Omit<Task, "id">[] {
  const cap = deriveTaskCap(profile.workload, profile.sleep);
  const focusMin = deriveFocusMin(profile.focus);

  const tasks: Omit<Task, "id">[] = [];

  // Fill goal-derived tasks up to cap - 1 (leaving 1 slot for struggle guardrail)
  for (const goal of profile.goals) {
    if (tasks.length >= cap - 1) break;
    const template = GOAL_TASKS[goal];
    if (!template) continue;
    const estMin = goal === "fitness" ? 45 : template.type === "deep" ? focusMin : 30;
    tasks.push({ label: template.label, type: template.type, estMin, done: false, rescheduled: 0 });
  }

  // Append one struggle-derived guardrail task
  for (const struggle of profile.struggles) {
    const template = STRUGGLE_TASKS[struggle];
    if (template) {
      tasks.push({ label: template.label, type: template.type, estMin: template.estMin, done: false, rescheduled: 0 });
      break;
    }
  }

  return tasks;
}

// ── First session state ───────────────────────────────────────────────────────

export type FirstSessionState = {
  active: boolean;
  taskCap: number;
  focusDuration: number;
  primaryStruggle: string | null;
  baselineScore: number;
  ctaText: string;
};

function deriveCtaText(struggles: string[]): string {
  const struggle = struggles[0];
  if (struggle === "burnout") return "Your profile shows burnout risk — stay within the task cap today.";
  if (struggle === "procrastination") return "Pick one task and start it within the next 10 minutes.";
  if (struggle === "distraction") return "One phone-free block today. That's the only rule.";
  if (struggle === "perfectionism") return "Ship something imperfect. Progress over polish.";
  if (struggle === "inconsistency") return "One completed task is a win. Don't aim for more today.";
  if (struggle === "overplanning") return "No new plans — execute what's already here.";
  if (struggle === "motivation") return "Start with the smallest step. Motion creates motivation.";
  return "Your system is calibrated. Execute within the cap.";
}

export function buildFirstSessionState(
  profile: OnboardingProfile | null,
  checkInsCount: number,
): FirstSessionState {
  if (!profile || checkInsCount > 0) {
    return {
      active: false,
      taskCap: 3,
      focusDuration: 50,
      primaryStruggle: null,
      baselineScore: 0,
      ctaText: "",
    };
  }

  const cap = deriveTaskCap(profile.workload, profile.sleep);
  const focusDuration = deriveFocusMin(profile.focus);
  const primaryStruggle = profile.struggles[0] ?? null;

  return {
    active: true,
    taskCap: cap,
    focusDuration,
    primaryStruggle,
    baselineScore: profile.baselineScore,
    ctaText: deriveCtaText(profile.struggles),
  };
}

export function useFirstSession(): FirstSessionState {
  const profile = useApp((s) => s.profile);
  const checkIns = useApp((s) => s.checkIns);
  return buildFirstSessionState(profile, checkIns.length);
}
