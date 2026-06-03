import type { BehavioralInsight, Circle, DayData, ExecutionProof, Member, Task } from "@/lib/store";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const demoTasks: Task[] = [
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

export function buildDemoHistory(): DayData[] {
  const out: DayData[] = [];
  const now = new Date();
  for (let i = 28; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

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

export function buildDemoInsights(history: DayData[]): BehavioralInsight[] {
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
  const eveningDrop = Math.round(avgDistractions * 8);

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

export function buildDemoProofs(): ExecutionProof[] {
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

export const demoPersonalProofs = [
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

export const demoPrinciples = [
  "Execution is a discipline, not an emotion.",
  "Never miss twice. Fast recovery is the only metric that matters.",
  "Protect the morning focus window at all costs.",
];

export function buildDemoMembers(): Member[] {
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

export const demoCircle: Circle = {
  id: "c1",
  name: "Deep Work · Spring",
  subtitle: "Shared resilience over social performance. Small groups built on proof of execution.",
  charter:
    "We prioritize deep work, movement, and recovery. We support each other without judgment.",
  memberIds: ["u1", "u2", "u3", "u4", "u5"],
};

export const emptyCircle: Circle = {
  id: "c1",
  name: "Your circle",
  subtitle: "Invite trusted people. Empty until you do.",
  charter: "",
  memberIds: [],
};
