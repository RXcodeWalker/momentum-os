import { Target, Moon, Smartphone, Calendar, Battery } from "lucide-react";

export const mvdProtocols = {
  burnout: {
    label: "Burnout recovery",
    tasks: [
      { t: "20 min low-stakes review", est: "20m", type: "deep" as const },
      { t: "Walk · 30 min, no headphones", est: "30m", type: "movement" as const },
      { t: "In bed by 22:00, screens away", est: "—", type: "wind-down" as const },
    ],
  },
  procrastination: {
    label: "Procrastination protocol",
    tasks: [
      { t: "Open the file. Five minutes only.", est: "5m", type: "deep" as const },
      { t: "Do one tiny version of the hard task", est: "15m", type: "deep" as const },
      { t: "Log it. Don't escalate.", est: "—", type: "wind-down" as const },
    ],
  },
  perfectionism: {
    label: "Perfectionism reset",
    tasks: [
      { t: "Define 'good enough' in one sentence", est: "5m", type: "deep" as const },
      { t: "Ship the ugly version", est: "30m", type: "deep" as const },
      { t: "Note one thing you'd improve", est: "5m", type: "wind-down" as const },
    ],
  },
  "low-energy": {
    label: "Low-energy day",
    tasks: [
      { t: "10 min walk in daylight", est: "10m", type: "movement" as const },
      { t: "One easy admin task", est: "15m", type: "shallow" as const },
      { t: "Sleep before 22:30", est: "—", type: "wind-down" as const },
    ],
  },
  distraction: {
    label: "Distraction detox",
    tasks: [
      { t: "Phone in another room · 60 min", est: "60m", type: "deep" as const },
      { t: "Single task, single tab", est: "45m", type: "deep" as const },
      { t: "No notifications until evening", est: "—", type: "wind-down" as const },
    ],
  },
  "sleep-debt": {
    label: "Sleep debt recovery",
    tasks: [
      { t: "20 min review · easiest subject", est: "20m", type: "deep" as const },
      { t: "Walk · 30 min, natural light", est: "30m", type: "movement" as const },
      { t: "In bed by 21:30, screens away", est: "—", type: "wind-down" as const },
    ],
  },
};

export type ProtocolKey = keyof typeof mvdProtocols;

export const protocolRoadmaps: Record<
  ProtocolKey,
  {
    next24h: { time: string; action: string; priority: "critical" | "high" | "medium" }[];
    next3d: { day: string; focus: string; metric: string }[];
    rebuilding: { phase: string; duration: string; goal: string }[];
  }
> = {
  burnout: {
    next24h: [
      { time: "Tonight", action: "Digital sunset at 20:30", priority: "critical" },
      { time: "Tomorrow AM", action: "Zero meetings / No calls", priority: "high" },
      { time: "Tomorrow PM", action: "Nature walk · 45 min", priority: "medium" },
    ],
    next3d: [
      { day: "Day 1", focus: "Neural rest", metric: "No social media" },
      { day: "Day 2", focus: "Physical reset", metric: "Movement > 30m" },
      { day: "Day 3", focus: "Low-stakes review", metric: "Max 1h focused work" },
    ],
    rebuilding: [
      { phase: "Stabilize", duration: "Days 1-4", goal: "Anchor sleep & movement" },
      { phase: "Build", duration: "Days 5-10", goal: "Add 1 deep work block" },
      { phase: "Sustain", duration: "Week 2+", goal: "Return to 60% load" },
    ],
  },
  procrastination: {
    next24h: [
      { time: "Next 1h", action: "Clean workspace / Clear tabs", priority: "high" },
      { time: "Today", action: "One 15-min 'ugly' draft", priority: "critical" },
      { time: "Tonight", action: "Plan tomorrow (max 2 items)", priority: "medium" },
    ],
    next3d: [
      { day: "Day 1", focus: "Lowering the bar", metric: "Start 3 tasks" },
      { day: "Day 2", focus: "Momentum clicks", metric: "Finish 1 priority" },
      { day: "Day 3", focus: "Steady escalation", metric: "Finish 2 priorities" },
    ],
    rebuilding: [
      { phase: "Stabilize", duration: "Days 1-2", goal: "Break the 'not doing' cycle" },
      { phase: "Build", duration: "Days 3-5", goal: "Consistent completion" },
      { phase: "Sustain", duration: "Day 6+", goal: "Normal priority load" },
    ],
  },
  perfectionism: {
    next24h: [
      { time: "Today", action: "Ship something 'B-' quality", priority: "critical" },
      { time: "Today", action: "Set 30-min timer for hard task", priority: "high" },
      { time: "Tonight", action: "Log one 'good enough' win", priority: "medium" },
    ],
    next3d: [
      { day: "Day 1", focus: "Time-boxing", metric: "No task > 60 min" },
      { day: "Day 2", focus: "Vulnerability", metric: "Share raw progress" },
      { day: "Day 3", focus: "Volume over quality", metric: "Complete 4 small tasks" },
    ],
    rebuilding: [
      { phase: "Stabilize", duration: "Days 1-3", goal: "Focus on 'done' over 'perfect'" },
      { phase: "Build", duration: "Days 4-6", goal: "Increase task complexity" },
      { phase: "Sustain", duration: "Week 2", goal: "Calibrated quality standards" },
    ],
  },
  "low-energy": {
    next24h: [
      { time: "Today", action: "Hydrate / Sunlight exposure", priority: "high" },
      { time: "Today", action: "Easiest admin task only", priority: "medium" },
      { time: "Tonight", action: "Sleep before 21:30", priority: "critical" },
    ],
    next3d: [
      { day: "Day 1", focus: "Bio-recharge", metric: "Sleep > 8h" },
      { day: "Day 2", focus: "Light movement", metric: "Walk 20 min" },
      { day: "Day 3", focus: "Energy management", metric: "Work during peaks only" },
    ],
    rebuilding: [
      { phase: "Stabilize", duration: "Days 1-3", goal: "Restore biological baseline" },
      { phase: "Build", duration: "Days 4-7", goal: "Gradual cognitive load" },
      { phase: "Sustain", duration: "Week 2", goal: "Return to full schedule" },
    ],
  },
  distraction: {
    next24h: [
      { time: "Now", action: "Phone in another room", priority: "critical" },
      { time: "Today", action: "One 60-min 'monk mode' block", priority: "high" },
      { time: "Tonight", action: "No screens 1h before bed", priority: "medium" },
    ],
    next3d: [
      { day: "Day 1", focus: "Attention hygiene", metric: "Notifications OFF" },
      { day: "Day 2", focus: "Deep work anchor", metric: "Start AM with 90m focus" },
      { day: "Day 3", focus: "Context protection", metric: "Max 3 app switches/h" },
    ],
    rebuilding: [
      { phase: "Stabilize", duration: "Days 1-2", goal: "Reset focus muscle" },
      { phase: "Build", duration: "Days 3-5", goal: "Increase deep work depth" },
      { phase: "Sustain", duration: "Week 2", goal: "Resilient attention span" },
    ],
  },
  "sleep-debt": {
    next24h: [
      { time: "Today", action: "No caffeine after 12:00", priority: "high" },
      { time: "Tonight", action: "In bed by 21:00", priority: "critical" },
      { time: "Tomorrow", action: "20-min nap at 14:00", priority: "medium" },
    ],
    next3d: [
      { day: "Day 1", focus: "Sleep anchor", metric: "Same wake time" },
      { day: "Day 2", focus: "Cognitive mercy", metric: "No heavy decisions" },
      { day: "Day 3", focus: "System recovery", metric: "Sleep > 7.5h" },
    ],
    rebuilding: [
      { phase: "Stabilize", duration: "Days 1-3", goal: "Pay off acute debt" },
      { phase: "Build", duration: "Days 4-6", goal: "Stabilize circadian rhythm" },
      { phase: "Sustain", duration: "Week 2", goal: "Optimized sleep/work sync" },
    ],
  },
};

export const reinforcements = [
  {
    message: "Fast recovery builds reliable execution.",
    sub: "You're training the system to bounce back quickly, not to never fall.",
  },
  {
    message: "Consistency is measured by return speed, not perfection.",
    sub: "Every dip you recover from makes the next recovery faster.",
  },
  {
    message: "Momentum restored through adaptive recovery.",
    sub: "You've chosen the tactical path over the guilt cycle.",
  },
];
