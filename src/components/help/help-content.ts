import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Sun,
  AlertTriangle,
  Zap,
  LifeBuoy,
  Keyboard,
  Rocket,
  CheckCircle2,
  Clock,
  Target,
  Brain,
  TrendingDown,
  RotateCcw,
  ShieldCheck,
  Flame,
  BookOpen,
  ArrowRight,
  Moon,
  Activity,
  AlertCircle,
  Layers,
  Focus,
  Timer,
  HeartPulse,
  Repeat,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabId =
  | "overview"
  | "daily-flow"
  | "mistakes"
  | "rules"
  | "recovery"
  | "shortcuts"
  | "quick-start";

export type UserLevel = "new" | "developing" | "consistent" | "advanced";

export type TriggerCondition =
  | "overloaded"
  | "skipped-checkins"
  | "score-declining"
  | "new-user"
  | "always";

export type CtaAction =
  | { type: "navigate"; to: string }
  | { type: "close" }
  | { type: "external"; url: string };

export interface Cta {
  label: string;
  action: CtaAction;
  variant?: "primary" | "ghost";
}

export interface HelpTab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  intent: string;
  userLevel: UserLevel[];
  triggerConditions: TriggerCondition[];
}

export interface OverviewSection {
  positioning: string;
  truths: Array<{
    id: string;
    title: string;
    body: string;
    icon: LucideIcon;
  }>;
  cta: Cta;
}

export interface WorkflowStep {
  step: number;
  time: string;
  action: string;
  detail: string;
  icon: LucideIcon;
  cta?: Cta;
}

export interface MistakeCard {
  id: string;
  title: string;
  body: string;
  expandedBody: string;
  icon: LucideIcon;
  tone: "warning" | "danger" | "neutral";
  triggerConditions: TriggerCondition[];
  cta?: Cta;
}

export interface Rule {
  id: string;
  number: number;
  quote: string;
  body: string;
  icon: LucideIcon;
  userLevel: UserLevel[];
}

export interface RecoveryPrinciple {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  emotional: boolean;
}

export interface RecoverySection {
  headline: string;
  subheadline: string;
  principles: RecoveryPrinciple[];
  protocol: Array<{ step: number; action: string; detail: string }>;
  cta: Cta;
}

export interface Shortcut {
  keys: string[];
  label: string;
  description: string;
}

export interface QuickStartStep {
  step: number;
  title: string;
  body: string;
  icon: LucideIcon;
  cta: Cta;
}

export interface SearchableItem {
  tabId: TabId;
  title: string;
  body: string;
  keywords?: string[];
}

// ─── Tab Definitions ─────────────────────────────────────────────────────────

export const HELP_TABS: HelpTab[] = [
  {
    id: "overview",
    label: "What it is",
    shortLabel: "Overview",
    icon: Compass,
    intent: "understand the system's purpose",
    userLevel: ["developing", "consistent", "advanced"],
    triggerConditions: ["always"],
  },
  {
    id: "daily-flow",
    label: "Daily workflow",
    shortLabel: "Daily",
    icon: Sun,
    intent: "learn the daily execution loop",
    userLevel: ["new", "developing", "consistent", "advanced"],
    triggerConditions: ["always"],
  },
  {
    id: "mistakes",
    label: "Mistakes",
    shortLabel: "Mistakes",
    icon: AlertTriangle,
    intent: "avoid common failure patterns",
    userLevel: ["new", "developing"],
    triggerConditions: ["overloaded", "skipped-checkins", "always"],
  },
  {
    id: "rules",
    label: "Momentum rules",
    shortLabel: "Rules",
    icon: Zap,
    intent: "internalize the operating principles",
    userLevel: ["developing", "consistent", "advanced"],
    triggerConditions: ["always"],
  },
  {
    id: "recovery",
    label: "Recovery protocol",
    shortLabel: "Recovery",
    icon: LifeBuoy,
    intent: "recover fast and restart with clarity",
    userLevel: ["new", "developing", "consistent", "advanced"],
    triggerConditions: ["score-declining", "skipped-checkins", "always"],
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    shortLabel: "Keys",
    icon: Keyboard,
    intent: "navigate faster",
    userLevel: ["developing", "consistent", "advanced"],
    triggerConditions: ["always"],
  },
  {
    id: "quick-start",
    label: "Quick start",
    shortLabel: "Start",
    icon: Rocket,
    intent: "get momentum in the first 24 hours",
    userLevel: ["new"],
    triggerConditions: ["new-user", "always"],
  },
];

// ─── Overview Content ─────────────────────────────────────────────────────────

export const OVERVIEW: OverviewSection = {
  positioning:
    "Cadence is not a to-do list. It is a behavioral measurement system — one that observes your patterns, surfaces what's breaking your execution, and builds protocols for recovery. The goal is momentum, not perfection.",
  truths: [
    {
      id: "measurement",
      title: "It measures, not manages",
      body: "Cadence tracks how consistently you execute, not just what you planned. The score is a signal, not a grade.",
      icon: Activity,
    },
    {
      id: "patterns",
      title: "Patterns matter more than days",
      body: "One bad day tells you nothing. Seven days of low energy on Mondays tells you everything. Cadence finds those patterns.",
      icon: TrendingDown,
    },
    {
      id: "recovery",
      title: "Recovery is part of the system",
      body: "The system is designed with failure in mind. Recovery mode exists not as a fallback — it's a core feature, expected and planned for.",
      icon: RotateCcw,
    },
    {
      id: "compounding",
      title: "Small wins compound fast",
      body: "Scoring 60 five days in a row outperforms scoring 100 once and crashing. Cadence is built around this truth.",
      icon: Flame,
    },
  ],
  cta: {
    label: "See your patterns",
    action: { type: "navigate", to: "/insights" },
    variant: "primary",
  },
};

// ─── Daily Workflow ───────────────────────────────────────────────────────────

export const DAILY_FLOW: WorkflowStep[] = [
  {
    step: 1,
    time: "Morning",
    action: "Review your plan",
    detail:
      "Open the Today view and review the tasks Cadence suggested based on last night's check-in. These are pre-loaded from your tomorrow plan.",
    icon: Sun,
    cta: {
      label: "Go to Today",
      action: { type: "navigate", to: "/" },
      variant: "ghost",
    },
  },
  {
    step: 2,
    time: "9:00 AM",
    action: "Commit to 3–5 tasks max",
    detail:
      "Pick your three to five highest-value tasks and remove the rest. Overloading your list is disguised avoidance — the system tracks this.",
    icon: Target,
    cta: {
      label: "Reduce to 5 tasks",
      action: { type: "navigate", to: "/" },
      variant: "ghost",
    },
  },
  {
    step: 3,
    time: "First block",
    action: "Start with the hardest task",
    detail:
      "Execute your highest-friction task first. Motivation follows action — waiting for readiness is a trap. Cadence tracks task-start patterns.",
    icon: Flame,
  },
  {
    step: 4,
    time: "Throughout day",
    action: "Check off honestly",
    detail:
      "No partial credit, no optimistic ticks. A task is done when it's done. Dishonest check-offs corrupt all behavioral intelligence downstream.",
    icon: CheckCircle2,
  },
  {
    step: 5,
    time: "Evening",
    action: "Complete your check-in",
    detail:
      "Score your focus, energy, mood, sleep, and distractions honestly. This 3-minute check-in is the data source for everything Cadence learns.",
    icon: Moon,
    cta: {
      label: "Start tonight's check-in",
      action: { type: "navigate", to: "/check-in" },
      variant: "primary",
    },
  },
  {
    step: 6,
    time: "Before sleep",
    action: "Review and set tomorrow's focus",
    detail:
      "Check your execution score, scan your insight feed, and let Cadence generate tomorrow's suggested plan. The cycle restarts from a stronger baseline.",
    icon: BookOpen,
    cta: {
      label: "View your insights",
      action: { type: "navigate", to: "/insights" },
      variant: "ghost",
    },
  },
];

// ─── Common Mistakes ──────────────────────────────────────────────────────────

export const MISTAKES: MistakeCard[] = [
  {
    id: "overplanning",
    title: "Planning 10+ tasks",
    body: "More tasks planned = less executed. The research is clear.",
    expandedBody:
      'Overplanning feels productive but is often procrastination wearing a disguise. When you plan 10+ tasks, you fragment your focus and give yourself permission to "make progress" by doing easy tasks while avoiding hard ones. Cadence flags days where your plan-to-execution ratio drops below 60% — this is why.',
    icon: Layers,
    tone: "danger",
    triggerConditions: ["overloaded"],
    cta: {
      label: "Reduce task list now",
      action: { type: "navigate", to: "/" },
    },
  },
  {
    id: "dishonest-scores",
    title: "Inflating check-in scores",
    body: "Dishonest data breaks all behavioral intelligence downstream.",
    expandedBody:
      "Cadence's entire intelligence layer — distraction correlations, recovery recommendations, tomorrow planning — is built on check-in data. When you score a 7/10 focus day that was actually a 4/10, you corrupt the system. It will give you wrong suggestions. Score honestly, even when it stings.",
    icon: AlertCircle,
    tone: "danger",
    triggerConditions: ["always"],
  },
  {
    id: "ignoring-recovery",
    title: "Pushing through when score < 45",
    body: "A depleted system cannot produce peak output. Recovery is execution.",
    expandedBody:
      "When your execution score drops below 45, your system is signaling genuine depletion — not laziness. Pushing through typically extends the low-score period. Recovery mode activates to give you a minimum viable day protocol that rebuilds momentum without overextending.",
    icon: HeartPulse,
    tone: "warning",
    triggerConditions: ["score-declining"],
    cta: {
      label: "Open Recovery mode",
      action: { type: "navigate", to: "/recovery" },
    },
  },
  {
    id: "streak-obsession",
    title: "Treating streaks as the goal",
    body: "Streaks are signals, not goals. Chasing them creates fragility.",
    expandedBody:
      "When you make streak preservation the goal, you start making bad decisions: doing low-quality work just to tick boxes, avoiding hard tasks that might break your streak, optimizing for appearance over output. Your streak is a byproduct of good execution — not the goal.",
    icon: Repeat,
    tone: "warning",
    triggerConditions: ["always"],
  },
  {
    id: "skipping-checkins",
    title: "Skipping check-ins for 2+ days",
    body: "Without data, there is no intelligence.",
    expandedBody:
      "Every skipped check-in is a gap in your behavioral dataset. Cadence cannot surface distraction patterns, blocker correlations, or day-of-week profiles without input. Three consecutive skips triggers a system gap — your insights will be stale and your tomorrow plan will lack personalization.",
    icon: Clock,
    tone: "warning",
    triggerConditions: ["skipped-checkins"],
    cta: {
      label: "Log tonight's check-in",
      action: { type: "navigate", to: "/check-in" },
    },
  },
  {
    id: "passive-use",
    title: "Reading insights without acting",
    body: "Awareness without action is sophisticated procrastination.",
    expandedBody:
      "The Insights tab can become its own form of avoidance if you read patterns without committing to change. When you commit to an insight rule, Cadence tracks whether your score improves in the following 14 days. Uncommitted insights are just observations — they change nothing.",
    icon: Brain,
    tone: "neutral",
    triggerConditions: ["always"],
    cta: {
      label: "Review your insights",
      action: { type: "navigate", to: "/insights" },
    },
  },
];

// ─── Momentum Rules ───────────────────────────────────────────────────────────

export const RULES: Rule[] = [
  {
    id: "overplanning",
    number: 1,
    quote: "Overplanning is disguised avoidance.",
    body: "When planning feels more comfortable than executing, you've crossed a line. The plan is never the output. Three focused tasks outperform ten aspirational ones every time.",
    icon: Layers,
    userLevel: ["new", "developing", "consistent", "advanced"],
  },
  {
    id: "execution",
    number: 2,
    quote: "Execution reveals reality.",
    body: "You don't know what's hard, what's unclear, or what's wrong until you start. Starting surfaces truth faster than any amount of planning. Start before you're ready.",
    icon: ArrowRight,
    userLevel: ["new", "developing", "consistent", "advanced"],
  },
  {
    id: "negotiation",
    number: 3,
    quote: "Momentum dies in negotiation.",
    body: 'Every time you negotiate with yourself about whether to start — "just five more minutes", "I\'ll begin after this" — momentum erodes. The negotiation is the friction. Cut it.',
    icon: Timer,
    userLevel: ["developing", "consistent", "advanced"],
  },
  {
    id: "discipline",
    number: 4,
    quote: "Discipline is reducing friction.",
    body: "Willpower is finite and unreliable. The highest-leverage move is eliminating the conditions that make starting hard. Cadence tracks your distraction patterns so you can design your environment instead of fighting it.",
    icon: Focus,
    userLevel: ["developing", "consistent", "advanced"],
  },
  {
    id: "systems",
    number: 5,
    quote: "Your systems determine your score.",
    body: "Motivation is the spark. Systems are the engine. A person with weak motivation and strong systems outperforms a motivated person with no systems, every week. Your score reflects your systems.",
    icon: ShieldCheck,
    userLevel: ["consistent", "advanced"],
  },
];

// ─── Recovery Protocol ────────────────────────────────────────────────────────

export const RECOVERY: RecoverySection = {
  headline: "Recovery is not failure. It is the system working.",
  subheadline:
    "Every high performer has bad days. What separates them is not immunity to dips — it is how fast they restart.",
  principles: [
    {
      id: "expected",
      title: "Bad days are built into the design",
      body: "Cadence was designed with failure in mind. Recovery mode is not a fallback for weak days — it is a scheduled part of a sustainable system. Expecting perfect execution is itself a failure of systems thinking.",
      icon: ShieldCheck,
      emotional: false,
    },
    {
      id: "speed",
      title: "Recovery speed matters more than streaks",
      body: "A three-day dip followed by a strong return is more valuable than a long streak maintained by avoiding difficult work. Cadence tracks resilience separately — how fast you bounce back from low scores is its own measure of strength.",
      icon: RotateCcw,
      emotional: true,
    },
    {
      id: "restart",
      title: "Restarting quickly is a learnable skill",
      body: "Most people wait until they feel ready to restart. The people who build lasting momentum restart before they feel ready, and let the action rebuild the feeling. The protocol is: minimum viable day, one honest check-in, no self-assessment until Day 3.",
      icon: Flame,
      emotional: false,
    },
    {
      id: "shame",
      title: "Shame spirals destroy more than the original dip",
      body: "Skipping one check-in becomes two days of guilt becomes a week of avoidance. The spiral is the real threat — not the bad day. Cadence does not penalize gaps. You can return after two weeks and start from where you are.",
      icon: HeartPulse,
      emotional: true,
    },
  ],
  protocol: [
    {
      step: 1,
      action: "Accept the dip",
      detail:
        "Open Recovery mode. Acknowledge the low score without judgment. This is data, not a verdict.",
    },
    {
      step: 2,
      action: "Choose a minimum viable day",
      detail:
        "Pick the protocol that matches your depletion type. Do only the MVD tasks — nothing more. Completion matters, not volume.",
    },
    {
      step: 3,
      action: "Log one honest check-in",
      detail:
        "Even a score of 30 with honest inputs is more valuable than a skipped check-in. The data keeps your patterns intact.",
    },
  ],
  cta: {
    label: "Open Recovery mode",
    action: { type: "navigate", to: "/recovery" },
    variant: "primary",
  },
};

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────

export const SHORTCUTS: Shortcut[] = [
  {
    keys: ["⌘", "K"],
    label: "Command palette",
    description: "Jump to any page or action without touching the mouse.",
  },
  {
    keys: ["?"],
    label: "Momentum Guide",
    description: "Open and close this guide from anywhere in the app.",
  },
  {
    keys: ["Esc"],
    label: "Close overlay",
    description: "Dismiss any open modal, palette, or panel.",
  },
];

// ─── Quick Start ──────────────────────────────────────────────────────────────

export const QUICK_START: QuickStartStep[] = [
  {
    step: 1,
    title: "Complete your onboarding",
    body: "Set your goals, name your struggles, and define your protocols. This calibrates the intelligence system to your specific situation — skip it and the recommendations will be generic.",
    icon: Target,
    cta: {
      label: "Go to onboarding",
      action: { type: "navigate", to: "/onboarding" },
    },
  },
  {
    step: 2,
    title: "Log your first check-in tonight",
    body: "Don't wait for the perfect day. Score your first check-in honestly, even if everything went sideways. The system needs real data to learn from — the first entry is the most important.",
    icon: Moon,
    cta: {
      label: "Start check-in",
      action: { type: "navigate", to: "/check-in" },
    },
  },
  {
    step: 3,
    title: "Accept tomorrow's plan",
    body: "Tomorrow morning, Cadence will generate a suggested task plan based on your check-in. Accept it. Don't add more. Trust the system for the first week — this is how you establish a baseline.",
    icon: CheckCircle2,
    cta: {
      label: "View today's plan",
      action: { type: "navigate", to: "/" },
    },
  },
];

// ─── Search Index ─────────────────────────────────────────────────────────────

export const SEARCH_INDEX: SearchableItem[] = [
  // Overview
  {
    tabId: "overview",
    title: "What is Cadence?",
    body: OVERVIEW.positioning,
    keywords: ["purpose", "system", "behavioral", "measurement"],
  },
  ...OVERVIEW.truths.map((t) => ({ tabId: "overview" as TabId, title: t.title, body: t.body })),

  // Daily flow
  ...DAILY_FLOW.map((s) => ({
    tabId: "daily-flow" as TabId,
    title: s.action,
    body: s.detail,
    keywords: [s.time],
  })),

  // Mistakes
  ...MISTAKES.map((m) => ({
    tabId: "mistakes" as TabId,
    title: m.title,
    body: m.body + " " + m.expandedBody,
    keywords: [m.tone],
  })),

  // Rules
  ...RULES.map((r) => ({
    tabId: "rules" as TabId,
    title: r.quote,
    body: r.body,
  })),

  // Recovery
  {
    tabId: "recovery",
    title: RECOVERY.headline,
    body: RECOVERY.subheadline,
    keywords: ["bad day", "dip", "restart", "shame"],
  },
  ...RECOVERY.principles.map((p) => ({
    tabId: "recovery" as TabId,
    title: p.title,
    body: p.body,
    keywords: ["recovery", "bounce back", "restart"],
  })),

  // Shortcuts
  ...SHORTCUTS.map((s) => ({
    tabId: "shortcuts" as TabId,
    title: s.label,
    body: s.description,
    keywords: s.keys,
  })),

  // Quick start
  ...QUICK_START.map((s) => ({
    tabId: "quick-start" as TabId,
    title: s.title,
    body: s.body,
    keywords: ["begin", "start", "first", "new"],
  })),
];

export const SEARCH_PLACEHOLDERS = [
  "Why am I losing momentum?",
  "How should I plan my day?",
  "What should I do after a bad day?",
  "How does recovery work?",
  "Why does my score keep dropping?",
  "How many tasks should I plan?",
];
